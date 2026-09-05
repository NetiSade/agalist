-- purchase_events: append-only log of every shopping-list mutation
-- (added / marked_bought / marked_missing / deleted), written by the API.
--
-- Idempotent: safe to paste into the Supabase SQL Editor and re-run any number
-- of times (SQL Editor -> New query -> paste -> Run). Policies are dropped
-- before re-creation because Postgres has no CREATE POLICY IF NOT EXISTS.
--
-- RLS: same owner-only pattern as shopping_list and categories - signed-in
-- users can only read/insert their own rows, and no UPDATE/DELETE policy
-- exists, so the log stays append-only. (The API itself connects with the
-- service role, which bypasses RLS and filters by user_id explicitly.)

create table if not exists public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null,
  category text,
  event_type text not null check (event_type in ('added', 'marked_bought', 'marked_missing', 'deleted')),
  count_delta integer,
  created_at timestamptz not null default now()
);

create index if not exists purchase_events_user_created_idx
  on public.purchase_events (user_id, created_at desc);

alter table public.purchase_events enable row level security;

drop policy if exists "Users can read their own purchase events"
  on public.purchase_events;
create policy "Users can read their own purchase events"
  on public.purchase_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own purchase events"
  on public.purchase_events;
create policy "Users can insert their own purchase events"
  on public.purchase_events for insert
  with check (auth.uid() = user_id);
