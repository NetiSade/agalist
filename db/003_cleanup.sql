-- ============================================================
-- 003: enforce category_id, drop the legacy enum column + type.
-- Run ONLY after the new client is deployed and verified, and after
-- re-running the backfill statements (2)+(3) from 002 once to catch
-- rows written by the old client during the deploy window.
-- ============================================================

alter table public.shopping_list alter column category_id set not null;
alter table public.shopping_list alter column user_id set not null;
alter table public.shopping_list drop column category;
drop type if exists public.item_category;
