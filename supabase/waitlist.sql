-- Run this in Supabase SQL Editor
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  skill_level text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
  source text not null default 'landing-page',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "allow_anon_insert_waitlist" on public.waitlist;
create policy "allow_anon_insert_waitlist"
on public.waitlist
for insert
to anon
with check (true);
