-- ============================================================
--  SONIKLAB — Vitrine publique (artistes, événements, collabs,
--  textes du site) + stockage des médias + QG rendu privé.
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent : peut être relancé sans casser l'existant.
--  Réutilise la fonction existante public.is_admin() (rôle dans app_metadata).
-- ============================================================

-- ---------- Tables ----------

-- Les artistes du collectif (DJ, live…).
create table if not exists public.artists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Nouvel artiste',
  role       text,                                   -- ex. « DJ », « Live », « B2B »
  style      text,                                   -- ex. « techno industrielle »
  bio        text,
  photo_url  text,
  links      jsonb not null default '[]'::jsonb,     -- [{ "label": "SoundCloud", "url": "https://…" }]
  visible    boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

-- Avec qui on bosse : bars, guinguettes, assos, festivals…
create table if not exists public.collaborators (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Nouveau collaborateur',
  kind        text,                                  -- ex. « Bar », « Guinguette », « Asso »
  city        text,
  description text,
  logo_url    text,
  url         text,
  visible     boolean not null default true,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

-- Événements passés ET à venir (la date décide de l'onglet).
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Nouvel événement',
  starts_on   date not null default current_date,
  hours       text,                                  -- ex. « 18h → 2h »
  venue       text,
  city        text,
  description text,
  cover_url   text,
  ticket_url  text,                                  -- billetterie / page de l'event
  visible     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Photos / vidéos d'un événement.
create table if not exists public.event_media (
  id        uuid primary key default gen_random_uuid(),
  event_id  uuid not null references public.events(id) on delete cascade,
  kind      text not null default 'image' check (kind in ('image', 'video', 'embed', 'link')),
  url       text not null,
  caption   text,
  position  int not null default 0
);

create index if not exists event_media_event_idx on public.event_media(event_id);
create index if not exists events_starts_on_idx on public.events(starts_on);

-- Textes éditables du site (clé → valeur). Les valeurs par défaut sont dans le code.
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------- RLS ----------
-- Lecture publique (seulement ce qui est « visible »), écriture admin uniquement.

alter table public.artists       enable row level security;
alter table public.collaborators enable row level security;
alter table public.events        enable row level security;
alter table public.event_media   enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists artists_read on public.artists;
create policy artists_read on public.artists
  for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists artists_admin on public.artists;
create policy artists_admin on public.artists
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists collaborators_read on public.collaborators;
create policy collaborators_read on public.collaborators
  for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists collaborators_admin on public.collaborators;
create policy collaborators_admin on public.collaborators
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists events_read on public.events;
create policy events_read on public.events
  for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists events_admin on public.events;
create policy events_admin on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- Un média n'est lisible que si son événement l'est (la sous-requête passe
-- elle-même par la RLS de events).
drop policy if exists event_media_read on public.event_media;
create policy event_media_read on public.event_media
  for select to anon, authenticated
  using (exists (select 1 from public.events e where e.id = event_media.event_id));
drop policy if exists event_media_admin on public.event_media;
create policy event_media_admin on public.event_media
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists site_settings_read on public.site_settings;
create policy site_settings_read on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists site_settings_admin on public.site_settings;
create policy site_settings_admin on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Stockage des médias (photos, vidéos, logos) ----------
-- Bucket public en lecture (URL directes), upload réservé aux admins.
-- 50 Mo max par fichier (limite du plan gratuit) ; les photos sont de toute
-- façon redimensionnées dans le navigateur avant l'envoi.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ---------- Le QG devient privé ----------
-- Les raccourcis internes (drive, to-do, HelloAsso…) ne sont plus lisibles
-- publiquement : on remplace toutes les politiques de link_groups / links
-- par une seule politique « admins uniquement ».
-- (ticker_words reste public : le bandeau défile sur la vitrine.)

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('link_groups', 'links')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy link_groups_admin on public.link_groups
  for all using (public.is_admin()) with check (public.is_admin());
create policy links_admin on public.links
  for all using (public.is_admin()) with check (public.is_admin());
