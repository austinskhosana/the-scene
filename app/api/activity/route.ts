import {createClerkClient} from '@clerk/backend';
import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';

type ActivityPayload = {
  activityDate: string;
  repliesCount: number;
  postsCount: number;
};

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function getClerkUserId(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) throw new Error('Clerk server keys are not configured.');

  const clerk = createClerkClient({secretKey, publishableKey});
  const requestState = await clerk.authenticateRequest(request, {acceptsToken: 'session_token'});
  if (!requestState.isAuthenticated) return null;
  return requestState.toAuth().userId;
}

export async function POST(request: Request) {
  const clerkUserId = await getClerkUserId(request);
  if (!clerkUserId) return NextResponse.json({error: 'You must be signed in.'}, {status: 401});

  const payload = await request.json() as Partial<ActivityPayload>;
  if (
    typeof payload.activityDate !== 'string' ||
    !isDate(payload.activityDate) ||
    typeof payload.repliesCount !== 'number' ||
    typeof payload.postsCount !== 'number' ||
    !Number.isInteger(payload.repliesCount) ||
    !Number.isInteger(payload.postsCount) ||
    payload.repliesCount < 0 ||
    payload.postsCount < 0
  ) {
    return NextResponse.json({error: 'Activity data is invalid.'}, {status: 400});
  }

  const supabase = createSupabaseAdminClient();
  const updatedAt = new Date().toISOString();

  // Activity rows reference profiles. This also repairs accounts created before
  // the Supabase sync was added or accounts whose onboarding sync was interrupted.
  const profileResult = await supabase.from('profiles').upsert({
    clerk_user_id: clerkUserId,
    updated_at: updatedAt,
  }, {onConflict: 'clerk_user_id'});
  if (profileResult.error) return NextResponse.json({error: profileResult.error.message}, {status: 500});

  const goalsResult = await supabase
    .from('reply_goals')
    .select('replies_target, posts_target')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();
  if (goalsResult.error) return NextResponse.json({error: goalsResult.error.message}, {status: 500});

  const completed = Boolean(
    goalsResult.data &&
    payload.repliesCount >= goalsResult.data.replies_target &&
    payload.postsCount >= goalsResult.data.posts_target,
  );

  const activityResult = await supabase.from('daily_activity').upsert({
    clerk_user_id: clerkUserId,
    activity_date: payload.activityDate,
    replies_count: payload.repliesCount,
    posts_count: payload.postsCount,
    completed,
    updated_at: updatedAt,
  }, {onConflict: 'clerk_user_id,activity_date'});
  if (activityResult.error) return NextResponse.json({error: activityResult.error.message}, {status: 500});

  const completedResult = await supabase
    .from('daily_activity')
    .select('activity_date')
    .eq('clerk_user_id', clerkUserId)
    .eq('completed', true)
    .order('activity_date', {ascending: false});
  if (completedResult.error) return NextResponse.json({error: completedResult.error.message}, {status: 500});

  let currentStreak = 0;
  let previousDate: Date | null = null;
  for (const row of completedResult.data ?? []) {
    const date = new Date(`${row.activity_date}T12:00:00Z`);
    if (!previousDate) currentStreak = 1;
    else {
      const daysBetween = Math.round((previousDate.getTime() - date.getTime()) / 86_400_000);
      if (daysBetween !== 1) break;
      currentStreak += 1;
    }
    previousDate = date;
  }

  const streakResult = await supabase.from('streaks').upsert({
    clerk_user_id: clerkUserId,
    current_streak: currentStreak,
    best_streak: currentStreak,
    last_completed_date: currentStreak > 0 ? completedResult.data?.[0]?.activity_date : null,
    updated_at: updatedAt,
  }, {onConflict: 'clerk_user_id'});
  if (streakResult.error) return NextResponse.json({error: streakResult.error.message}, {status: 500});

  return NextResponse.json({ok: true, completed, currentStreak});
}

export async function GET(request: Request) {
  const clerkUserId = await getClerkUserId(request);
  if (!clerkUserId) return NextResponse.json({error: 'You must be signed in.'}, {status: 401});

  const supabase = createSupabaseAdminClient();
  const [activityResult, streakResult] = await Promise.all([
    supabase.from('daily_activity').select('replies_count, posts_count').eq('clerk_user_id', clerkUserId).eq('activity_date', '2026-10-07').maybeSingle(),
    supabase.from('streaks').select('current_streak, best_streak').eq('clerk_user_id', clerkUserId).maybeSingle(),
  ]);
  if (activityResult.error) return NextResponse.json({error: activityResult.error.message}, {status: 500});
  if (streakResult.error) return NextResponse.json({error: streakResult.error.message}, {status: 500});

  return NextResponse.json({
    activity: activityResult.data ?? {replies_count: 0, posts_count: 0},
    streak: streakResult.data ?? {current_streak: 0, best_streak: 0},
  });
}
