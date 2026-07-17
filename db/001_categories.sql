-- ============================================================
-- 001: categories table + RLS + "אחר" protection + default seeding
-- Run in the Supabase SQL editor, then run 002 in the same sitting.
-- ============================================================

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  color        text not null default 'slate',   -- key into the client COLOR_STYLES map
  icon         text not null default 'Tag',     -- lucide icon name, key into the client CATEGORY_ICONS map
  sort_order   integer not null default 0,
  is_protected boolean not null default false,  -- true only for "אחר"
  archived_at  timestamptz,                     -- soft delete, consistent with shopping_list
  created_at   timestamptz not null default now(),
  constraint categories_name_check check (char_length(trim(name)) between 1 and 40)
);

-- No duplicate active category names per user
create unique index categories_user_name_active_uq
  on public.categories (user_id, name) where archived_at is null;

-- Exactly one active protected category per user
create unique index categories_user_protected_uq
  on public.categories (user_id) where is_protected and archived_at is null;

create index categories_user_idx on public.categories (user_id, sort_order);

-- ---------- RLS ----------
alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ---------- DB-side protection of the default category ----------
create or replace function public.protect_default_category()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.is_protected then
      raise exception 'Cannot delete the protected default category';
    end if;
    return old;
  end if;
  if old.is_protected and (new.archived_at is not null or new.is_protected = false) then
    raise exception 'Cannot archive or unprotect the default category';
  end if;
  if not old.is_protected and new.is_protected then
    raise exception 'Cannot mark a category as protected';
  end if;
  if new.user_id <> old.user_id then
    raise exception 'Cannot change category owner';
  end if;
  return new;
end $$;

create trigger categories_protect_trg
  before update or delete on public.categories
  for each row execute function public.protect_default_category();

-- ---------- Default seeding ----------
-- Idempotent: safe to call repeatedly (auth trigger for new users,
-- client RPC fallback for users that predate the trigger).
create or replace function public.seed_default_categories(target_user uuid default auth.uid())
returns void
language plpgsql security definer set search_path = public as $$
begin
  if target_user is null then
    return;
  end if;
  -- Client callers may only seed themselves (auth.uid() is null in the auth trigger / SQL editor)
  if auth.uid() is not null and auth.uid() <> target_user then
    raise exception 'Not allowed';
  end if;

  insert into public.categories (user_id, name, color, icon, sort_order, is_protected) values
    (target_user, 'פירות וירקות',   'emerald', 'Apple',    0, false),
    (target_user, 'בשר, עוף, דגים', 'rose',    'Beef',     1, false),
    (target_user, 'מזווה',           'amber',   'Package',  2, false),
    (target_user, 'לחם ומאפים',      'orange',  'Wheat',    3, false),
    (target_user, 'חומרי ניקוי',     'sky',     'Sparkles', 4, false),
    (target_user, 'היגיינה',         'teal',    'Droplets', 5, false),
    (target_user, 'מוצרי חלב',       'indigo',  'Milk',     6, false),
    (target_user, 'יין ואלכוהול',    'purple',  'Wine',     7, false),
    (target_user, 'אחר',             'slate',   'Tag',      8, true)
  on conflict (user_id, name) where archived_at is null do nothing;
end $$;

revoke all on function public.seed_default_categories(uuid) from public;
grant execute on function public.seed_default_categories(uuid) to authenticated;

-- Seed automatically for every new signup
create or replace function public.handle_new_user_seed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_default_categories(new.id);
  return new;
end $$;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function public.handle_new_user_seed();

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.categories;
