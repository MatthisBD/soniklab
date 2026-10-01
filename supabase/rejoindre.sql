-- ============================================================
--  SONIKLAB — Formulaire « Nous rejoindre » (page /rejoindre)
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent. Réutilise public.is_admin().
--
--  Tout le monde peut ENVOYER une demande ; seuls les admins peuvent
--  les LIRE / traiter / supprimer (données personnelles → privées).
-- ============================================================

create table if not exists public.join_requests (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 3 and 200 and email like '%_@_%'),
  phone      text check (phone is null or char_length(phone) <= 40),
  profile    text not null default 'autre'
             check (profile in ('artiste', 'benevole', 'technique', 'communication', 'autre')),
  links      text check (links is null or char_length(links) <= 500),
  message    text not null check (char_length(message) between 1 and 3000),
  status     text not null default 'new' check (status in ('new', 'contacted', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists join_requests_created_idx on public.join_requests(created_at desc);

alter table public.join_requests enable row level security;

-- Envoi public : uniquement de nouvelles demandes (pas de statut forcé).
drop policy if exists join_requests_insert on public.join_requests;
create policy join_requests_insert on public.join_requests
  for insert to anon, authenticated with check (status = 'new');

-- Lecture / traitement / suppression : admins uniquement.
drop policy if exists join_requests_admin on public.join_requests;
create policy join_requests_admin on public.join_requests
  for all using (public.is_admin()) with check (public.is_admin());
