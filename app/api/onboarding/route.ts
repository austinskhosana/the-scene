import {currentUser} from '@clerk/nextjs/server';
import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';

type OnboardingPayload = {
  purpose: string;
  role: string;
  replyTarget: number;
  postTarget: number;
};

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({error: 'You must be signed in.'}, {status: 401});

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
  const clerkUserId = user.id;
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
