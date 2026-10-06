-- ============================================================
--  SONIKLAB — Prix d'entrée des événements
--  Ajoute la colonne « entry » (texte libre : « Gratuit »,
--  « 5 € », « Prix libre »…), affichée sur les cartes des dates
--  et envoyée à Google (champ « offers » des données structurées).
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent. Les règles RLS de la table events s'appliquent
--  telles quelles (lecture publique, écriture admin).
-- ============================================================

alter table public.events add column if not exists entry text;

-- Recharge le cache de l'API pour que la colonne soit visible tout de suite.
notify pgrst, 'reload schema';
