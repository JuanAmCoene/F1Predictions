create table if not exists public.predictions (
  id bigint generated always as identity primary key,
  user_name text not null,
  race_name text not null,
  predictions jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.predictions enable row level security;

drop policy if exists "Public can read predictions" on public.predictions;
create policy "Public can read predictions"
on public.predictions
for select
using (true);

drop policy if exists "Public can insert predictions" on public.predictions;
create policy "Public can insert predictions"
on public.predictions
for insert
to anon
with check (true);
