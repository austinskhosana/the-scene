-- The Scene core data model.
-- The profiles table is created separately in the Supabase dashboard.

create table if not exists public.onboarding_preferences (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique references public.profiles (clerk_user_id) on delete cascade,
  purpose text not null,
  role text not null,
  reply_target integer not null default 10 check (reply_target >= 0),
  post_target integer not null default 1 check (post_target >= 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reply_goals (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique references public.profiles (clerk_user_id) on delete cascade,
  replies_target integer not null default 10 check (replies_target >= 0),
  posts_target integer not null default 1 check (posts_target >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  activity_date date not null,
  replies_count integer not null default 0 check (replies_count >= 0),
  posts_count integer not null default 0 check (posts_count >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clerk_user_id, activity_date)
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique references public.profiles (clerk_user_id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  external_post_id text,
  body text,
  replied_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists daily_activity_user_date_idx
  on public.daily_activity (clerk_user_id, activity_date desc);

create index if not exists replies_user_replied_at_idx
  on public.replies (clerk_user_id, replied_at desc);

alter table public.onboarding_preferences enable row level security;
alter table public.reply_goals enable row level security;
alter table public.daily_activity enable row level security;
alter table public.streaks enable row level security;
alter table public.replies enable row level security;
