-- ============================================================
--  SONIKLAB — Budget caissons (page interne /budget)
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Données PRIVÉES : lecture ET écriture réservées aux admins.
--  Réutilise la fonction existante public.is_admin() (rôle dans app_metadata).
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.budget_categories (
  id        uuid primary key default gen_random_uuid(),
  name      text not null default 'Nouveau caisson',
  note      text,
  units     int  not null default 1,
  position  int  not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_cost_lines (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.budget_categories(id) on delete cascade,
  label       text not null default '',
  mode        text not null default 'unit' check (mode in ('unit', 'surface')),
  quantity    numeric not null default 1,
  width_cm    numeric,
  height_cm   numeric,
  unit_price  numeric not null default 0,
  unit_label  text,
  optional    boolean not null default false,
  included    boolean not null default true,
  position    int not null default 0
);

create table if not exists public.budget_revenue_lines (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.budget_categories(id) on delete cascade,
  label       text not null default '',
  quantity    numeric not null default 1,
  unit_price  numeric not null default 0,
  position    int not null default 0
);

create index if not exists budget_cost_lines_category_idx on public.budget_cost_lines(category_id);
create index if not exists budget_revenue_lines_category_idx on public.budget_revenue_lines(category_id);

-- ---------- RLS : admins uniquement (lecture + écriture) ----------
-- Contrairement aux tables links/* (lecture publique), le budget est privé.

alter table public.budget_categories    enable row level security;
alter table public.budget_cost_lines     enable row level security;
alter table public.budget_revenue_lines  enable row level security;

drop policy if exists budget_categories_admin on public.budget_categories;
create policy budget_categories_admin on public.budget_categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists budget_cost_lines_admin on public.budget_cost_lines;
create policy budget_cost_lines_admin on public.budget_cost_lines
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists budget_revenue_lines_admin on public.budget_revenue_lines;
create policy budget_revenue_lines_admin on public.budget_revenue_lines
  for all using (public.is_admin()) with check (public.is_admin());
