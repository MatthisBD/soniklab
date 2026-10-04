-- ============================================================
--  SONIKLAB — Le sound system / matériel (accueil + page Booking)
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent. Réutilise public.is_admin().
--  Lecture publique des éléments visibles, écriture admin.
-- ============================================================

create table if not exists public.gear_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Nouveau matériel',
  kind       text,                       -- ex. « Diffusion », « Platines & DJ », « Lumière »
  details    text,                       -- ex. « 4 caissons 18'' faits maison · 2 × 1 000 W »
  photo_url  text,
  visible    boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gear_items enable row level security;

drop policy if exists gear_items_read on public.gear_items;
create policy gear_items_read on public.gear_items
  for select to anon, authenticated using (visible or public.is_admin());

drop policy if exists gear_items_admin on public.gear_items;
create policy gear_items_admin on public.gear_items
  for all using (public.is_admin()) with check (public.is_admin());
