-- ============================================================
--  SONIKLAB — Compteur de visiteurs (pied de page du site)
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent. Réutilise public.is_admin().
--
--  Aucune donnée personnelle : la base ne garde que des totaux par jour
--  (ni IP, ni identifiant). Le tri humains / robots se fait dans le
--  navigateur (cf. app/composables/useVisitCounter.ts).
--  Le public ne touche jamais la table directement : il passe par
--  visit_total() (lire) et register_visit() (compter).
-- ============================================================

create table if not exists public.site_visits (
  day          date primary key,                                   -- jour (heure de Paris)
  visitors     int not null default 0 check (visitors >= 0),       -- personnes distinctes ce jour-là
  new_visitors int not null default 0 check (new_visitors >= 0)    -- dont premières venues
);

alter table public.site_visits enable row level security;

-- Détail jour par jour : admins uniquement (le public ne voit que le total).
drop policy if exists site_visits_admin_read on public.site_visits;
create policy site_visits_admin_read on public.site_visits
  for select to authenticated using (public.is_admin());

-- Total affiché = nombre de personnes venues (premières venues cumulées).
create or replace function public.visit_total()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(new_visitors), 0)::bigint from public.site_visits;
$$;

-- Compte une visite : appelée au plus une fois par jour et par navigateur.
-- first_time = première venue de ce navigateur → +1 au total affiché.
create or replace function public.register_visit(first_time boolean)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  d date := (now() at time zone 'Europe/Paris')::date;
begin
  insert into public.site_visits as v (day, visitors, new_visitors)
  values (d, 1, case when first_time then 1 else 0 end)
  on conflict (day) do update
    set visitors     = v.visitors + 1,
        new_visitors = v.new_visitors + excluded.new_visitors;
  return public.visit_total();
end $$;

revoke all on function public.visit_total() from public;
revoke all on function public.register_visit(boolean) from public;
grant execute on function public.visit_total() to anon, authenticated;
grant execute on function public.register_visit(boolean) to anon, authenticated;
