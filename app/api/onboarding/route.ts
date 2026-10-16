import {createClerkClient} from '@clerk/backend';
import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';

type OnboardingPayload = {
  purpose: string;
  role: string;
  replyTarget: number;
  postTarget: number;
};

export async function POST(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) {
    return NextResponse.json({error: 'Clerk server keys are not configured.'}, {status: 500});
  }

  const clerk = createClerkClient({secretKey, publishableKey});
  const requestState = await clerk.authenticateRequest(request, {acceptsToken: 'session_token'});
  if (!requestState.isAuthenticated) return NextResponse.json({error: 'You must be signed in.'}, {status: 401});

  const clerkUserId = requestState.toAuth().userId;
  if (!clerkUserId) return NextResponse.json({error: 'Your Clerk session is missing a user.'}, {status: 401});

  const user = await clerk.users.getUser(clerkUserId);

  const payload = await request.json() as Partial<OnboardingPayload>;
  if (
    typeof payload.purpose !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.replyTarget !== 'number' ||
    typeof payload.postTarget !== 'number' ||
    payload.replyTarget < 0 ||
    payload.postTarget < 0
  ) {
    return NextResponse.json({error: 'Onboarding data is invalid.'}, {status: 400});
  }

  const supabase = createSupabaseAdminClient();
  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;
  const completedAt = new Date().toISOString();

  const profileResult = await supabase.from('profiles').upsert({
    clerk_user_id: clerkUserId,
    email,
    display_name: displayName,
    avatar_url: user.imageUrl,
    updated_at: completedAt,
  }, {onConflict: 'clerk_user_id'});
  if (profileResult.error) return NextResponse.json({error: profileResult.error.message}, {status: 500});

  const onboardingResult = await supabase.from('onboarding_preferences').upsert({
    clerk_user_id: clerkUserId,
    purpose: payload.purpose,
    role: payload.role,
    reply_target: payload.replyTarget,
    post_target: payload.postTarget,
    completed_at: completedAt,
    updated_at: completedAt,
  }, {onConflict: 'clerk_user_id'});
  if (onboardingResult.error) return NextResponse.json({error: onboardingResult.error.message}, {status: 500});

  const goalsResult = await supabase.from('reply_goals').upsert({
    clerk_user_id: clerkUserId,
    replies_target: payload.replyTarget,
    posts_target: payload.postTarget,
    updated_at: completedAt,
  }, {onConflict: 'clerk_user_id'});
  if (goalsResult.error) return NextResponse.json({error: goalsResult.error.message}, {status: 500});

  const streakResult = await supabase.from('streaks').upsert({clerk_user_id: clerkUserId}, {onConflict: 'clerk_user_id'});
  if (streakResult.error) return NextResponse.json({error: streakResult.error.message}, {status: 500});

  return NextResponse.json({ok: true});
}
