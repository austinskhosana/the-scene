-- Marketing permission is separate from account creation and product access.
-- Keep both granted and declined decisions so consent can be audited.

create table if not exists public.marketing_consents (
  clerk_user_id text primary key references public.profiles (clerk_user_id) on delete cascade,
  email text not null,
  consented boolean not null default false,
  consented_at timestamptz,
  recorded_at timestamptz not null,
  source text not null,
  policy_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (consented = true and consented_at is not null)
    or (consented = false and consented_at is null)
  )
);

alter table public.marketing_consents enable row level security;
