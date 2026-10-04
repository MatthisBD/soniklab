-- ============================================================
--  SONIKLAB — Formulaire « Booking & collab » (page /collaborer)
--  Ajoute le type de demande « booking » (booker un DJ).
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent. Tant qu'il n'est pas exécuté, le site enregistre
--  les demandes de booking en « autre » (préfixe [Booker un DJ]).
-- ============================================================

alter table public.join_requests drop constraint if exists join_requests_profile_check;

alter table public.join_requests add constraint join_requests_profile_check
  check (profile in ('booking', 'artiste', 'benevole', 'technique', 'communication', 'autre'));
