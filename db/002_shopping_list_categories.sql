-- ============================================================
-- 002: link shopping_list to categories, backfill, enable RLS
-- Requires 001. Run in the Supabase SQL editor.
--
-- PRE-CHECK (run first, fix before continuing):
--   select count(*) from public.shopping_list where user_id is null;
-- Rows with NULL user_id become invisible under RLS and are skipped
-- by the backfill. Assign them manually, e.g.:
--   update public.shopping_list set user_id = '<your-uuid>' where user_id is null;
-- ============================================================

alter table public.shopping_list
  add column if not exists category_id uuid references public.categories(id);

create index if not exists shopping_list_category_idx on public.shopping_list (category_id);
create index if not exists shopping_list_user_idx on public.shopping_list (user_id);

-- 1) Seed the 9 defaults for every user that already has data
do $$
declare u record;
begin
  for u in select distinct user_id from public.shopping_list where user_id is not null loop
    perform public.seed_default_categories(u.user_id);
  end loop;
end $$;

-- 2) Backfill by exact name match (legacy `category` is the enum type
--    item_category, so cast to text for the comparison)
update public.shopping_list s
   set category_id = c.id
  from public.categories c
 where s.category_id is null
   and s.user_id = c.user_id
   and c.archived_at is null
   and c.name = s.category::text;

-- 3) Anything unmatched -> that user's protected "אחר"
update public.shopping_list s
   set category_id = c.id
  from public.categories c
 where s.category_id is null
   and s.user_id = c.user_id
   and c.is_protected and c.archived_at is null;

-- 4) Sanity check: must return 0 before proceeding
select count(*) as unassigned from public.shopping_list where category_id is null;

-- 5) The legacy enum column can't hold user-created category names, so the
--    new client stops writing it — allow NULLs until 003 drops the column.
alter table public.shopping_list alter column category drop not null;

-- ---------- RLS on shopping_list (the list becomes private per user here) ----------
alter table public.shopping_list enable row level security;

drop policy if exists "items_select_own" on public.shopping_list;
drop policy if exists "items_insert_own" on public.shopping_list;
drop policy if exists "items_update_own" on public.shopping_list;
drop policy if exists "items_delete_own" on public.shopping_list;

create policy "items_select_own" on public.shopping_list
  for select using (auth.uid() = user_id);
create policy "items_insert_own" on public.shopping_list
  for insert with check (auth.uid() = user_id);
create policy "items_update_own" on public.shopping_list
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "items_delete_own" on public.shopping_list
  for delete using (auth.uid() = user_id);

-- ---------- Delete-with-reassignment RPC (atomic) ----------
-- security invoker: RLS applies inside, users can only touch their own rows.
create or replace function public.delete_category(cat_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
declare
  other_id uuid;
begin
  select id into other_id
    from public.categories
   where user_id = auth.uid() and is_protected and archived_at is null;
  if other_id is null then
    raise exception 'Default category not found';
  end if;

  update public.shopping_list
     set category_id = other_id
   where category_id = cat_id and user_id = auth.uid();

  update public.categories
     set archived_at = now()
   where id = cat_id and user_id = auth.uid() and not is_protected;
end $$;

grant execute on function public.delete_category(uuid) to authenticated;

-- ---------- Realtime ----------
-- shopping_list is likely already in the publication (realtime works today).
-- Verify in Dashboard -> Database -> Publications; if missing, run:
--   alter publication supabase_realtime add table public.shopping_list;
