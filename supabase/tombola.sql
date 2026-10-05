-- ============================================================
--  SONIKLAB — Tombolas (page /tombola + admin → onglet « Tombola »)
--  À coller dans le SQL Editor du dashboard Supabase, une fois.
--  Idempotent. Réutilise public.is_admin().
--
--  - raffles        : la tombola (texte, formules de prix, tirage…)
--  - raffle_prizes  : les lots (+ gagnant une fois tiré)
--  - raffle_entries : les ventes de tickets (DONNÉES PERSO → admins seuls)
--
--  Rubrique PRIVÉE tant que le réglage site_settings « raffle_public »
--  est vide : le public ne lit alors aucune tombola, même « visible ».
--  Les numéros de tickets sont attribués par la base (pas de doublon),
--  et le tirage au sort se fait côté serveur (raffle_draw).
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.raffles (
  id            uuid primary key default gen_random_uuid(),
  title         text not null default 'Nouvelle tombola',
  description   text,
  -- formules : [{ "tickets": 1, "price": 5 }, { "tickets": 5, "price": 20 }…]
  packs         jsonb not null default '[{"tickets":1,"price":5},{"tickets":2,"price":10},{"tickets":5,"price":20}]'
                check (jsonb_typeof(packs) = 'array'),
  ticket_url    text,                    -- lien de vente en ligne (formulaire HelloAsso…)
  draw_on       date,                    -- date du tirage
  draw_place    text,                    -- ex. « en direct à la soirée de la Guinguette »
  max_tickets   int check (max_tickets is null or max_tickets > 0),
  permit        text,                    -- autorisation du maire, ex. « Autorisation du maire de Saint-Nazaire n° … du … »
  rules         text,                    -- règlement
  sales_open    boolean not null default true,
  show_sold     boolean not null default false,  -- afficher le nombre de tickets vendus
  visible       boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.raffle_prizes (
  id          uuid primary key default gen_random_uuid(),
  raffle_id   uuid not null references public.raffles(id) on delete cascade,
  name        text not null default 'Nouveau lot',
  description text,
  value_eur   numeric(10, 2) check (value_eur is null or value_eur >= 0),
  photo_url   text,
  position    int not null default 0,
  -- gagnant (rempli par raffle_draw ou à la main par un admin)
  winner_ticket   int,
  winner_entry_id uuid,
  winner_label    text,                  -- affiché publiquement : « Lucas M. »
  drawn_at        timestamptz
);

create table if not exists public.raffle_entries (
  id           uuid primary key default gen_random_uuid(),
  raffle_id    uuid not null references public.raffles(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  email        text check (email is null or char_length(email) <= 200),
  phone        text check (phone is null or char_length(phone) <= 40),
  tickets      int not null check (tickets between 1 and 1000),
  amount       numeric(10, 2) not null default 0 check (amount >= 0),
  channel      text not null default 'especes'
               check (channel in ('especes', 'helloasso', 'carte', 'virement', 'offert', 'autre')),
  first_ticket int,                      -- n° du 1er ticket, attribué par le trigger ci-dessous
  note         text check (note is null or char_length(note) <= 500),
  created_at   timestamptz not null default now()
);

-- Le gagnant pointe vers sa vente (ajouté après coup : les deux tables doivent exister).
alter table public.raffle_prizes drop constraint if exists raffle_prizes_winner_entry_fkey;
alter table public.raffle_prizes add constraint raffle_prizes_winner_entry_fkey
  foreign key (winner_entry_id) references public.raffle_entries(id) on delete set null;

create index if not exists raffle_prizes_raffle_idx on public.raffle_prizes(raffle_id);
create index if not exists raffle_prizes_winner_entry_idx on public.raffle_prizes(winner_entry_id);
create index if not exists raffle_entries_raffle_idx on public.raffle_entries(raffle_id, first_ticket);

-- ---------- Rubrique publique ou privée ----------
-- « raffle_public » non vide dans site_settings = rubrique visible du public.
create or replace function public.raffles_public()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.site_settings where key = 'raffle_public' and value <> ''
  );
$$;

-- ---------- RLS ----------

alter table public.raffles enable row level security;
alter table public.raffle_prizes enable row level security;
alter table public.raffle_entries enable row level security;

drop policy if exists raffles_read on public.raffles;
create policy raffles_read on public.raffles
  for select to anon, authenticated
  using ((visible and (select public.raffles_public())) or (select public.is_admin()));
drop policy if exists raffles_admin on public.raffles;
create policy raffles_admin on public.raffles
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- Un lot n'est lisible que si sa tombola l'est (la sous-requête passe par la RLS de raffles).
drop policy if exists raffle_prizes_read on public.raffle_prizes;
create policy raffle_prizes_read on public.raffle_prizes
  for select to anon, authenticated
  using (exists (select 1 from public.raffles r where r.id = raffle_prizes.raffle_id));
drop policy if exists raffle_prizes_admin on public.raffle_prizes;
create policy raffle_prizes_admin on public.raffle_prizes
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- Les ventes (noms, emails, téléphones) : admins uniquement, lecture comprise.
drop policy if exists raffle_entries_admin on public.raffle_entries;
create policy raffle_entries_admin on public.raffle_entries
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Numérotation des tickets ----------
-- Chaque vente reçoit une plage de numéros qui se suivent (ex. 12 → 16).
-- Verrou par tombola : deux ventes saisies en même temps ne peuvent pas
-- recevoir les mêmes numéros. Une fois attribués, les numéros sont figés.
create or replace function public.raffle_entries_number()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  cap  int;
  sold bigint;
  nxt  int;
begin
  if tg_op = 'UPDATE' then
    if new.raffle_id <> old.raffle_id
       or new.tickets <> old.tickets
       or new.first_ticket is distinct from old.first_ticket then
      raise exception 'Les numéros de tickets ne se modifient pas : supprime la vente et saisis-la à nouveau.';
    end if;
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.raffle_id::text, 0));

  if exists (select 1 from public.raffle_prizes
             where raffle_id = new.raffle_id and winner_ticket is not null) then
    raise exception 'Le tirage a déjà eu lieu : on ne peut plus ajouter de tickets.';
  end if;

  select max_tickets into cap from public.raffles where id = new.raffle_id;
  select coalesce(sum(tickets), 0), coalesce(max(first_ticket + tickets), 1)
    into sold, nxt
    from public.raffle_entries where raffle_id = new.raffle_id;

  if cap is not null and sold + new.tickets > cap then
    raise exception 'Plus que % ticket(s) disponible(s) sur %.', greatest(cap - sold, 0), cap;
  end if;

  new.first_ticket := nxt;
  return new;
end $$;

drop trigger if exists raffle_entries_number on public.raffle_entries;
create trigger raffle_entries_number
  before insert or update on public.raffle_entries
  for each row execute function public.raffle_entries_number();

-- ---------- Tickets vendus (public, sans aucune donnée perso) ----------
create or replace function public.raffle_stats()
returns table (raffle_id uuid, sold bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, coalesce(sum(e.tickets), 0)::bigint
  from public.raffles r
  left join public.raffle_entries e on e.raffle_id = r.id
  where (r.visible and public.raffles_public()) or public.is_admin()
  group by r.id;
$$;

-- « Lucas Martin » → « Lucas M. » (nom affiché publiquement pour un gagnant).
create or replace function public.raffle_short_name(full_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when array_length(p, 1) > 1 then p[1] || ' ' || upper(left(p[2], 1)) || '.'
    else p[1]
  end
  from (select regexp_split_to_array(trim(full_name), '\s+') as p) s;
$$;

-- ---------- Tirage au sort d'un lot (admins) ----------
-- Tire un ticket au hasard parmi tous les tickets vendus qui n'ont pas déjà
-- gagné (un ticket = une chance, un ticket ne gagne qu'un lot). Hasard
-- cryptographique (pgcrypto). Ferme les ventes de la tombola.
create or replace function public.raffle_draw(prize_id uuid)
returns public.raffle_prizes
language plpgsql
security definer
set search_path = ''
as $$
declare
  p    public.raffle_prizes;
  e    public.raffle_entries;
  pool int[];
  idx  int;
  pick int;
begin
  if not public.is_admin() then
    raise exception 'Réservé aux admins.' using errcode = '42501';
  end if;

  select * into p from public.raffle_prizes where id = prize_id for update;
  if not found then
    raise exception 'Lot introuvable.';
  end if;
  if p.winner_ticket is not null then
    raise exception 'Ce lot a déjà été tiré.';
  end if;

  -- même verrou que la numérotation : aucune vente ne peut s'intercaler
  perform pg_advisory_xact_lock(hashtextextended(p.raffle_id::text, 0));
  update public.raffles set sales_open = false where id = p.raffle_id;

  select array_agg(g.n order by g.n) into pool
  from public.raffle_entries en
  cross join lateral generate_series(en.first_ticket, en.first_ticket + en.tickets - 1) as g(n)
  where en.raffle_id = p.raffle_id
    and not exists (
      select 1 from public.raffle_prizes w
      where w.raffle_id = p.raffle_id and w.winner_ticket = g.n
    );

  if pool is null then
    raise exception 'Aucun ticket en jeu pour ce lot.';
  end if;

  -- 7 octets aléatoires → entier uniforme (biais du modulo négligeable)
  idx := 1 + ((('x' || encode(extensions.gen_random_bytes(7), 'hex'))::bit(56)::bigint
               % array_length(pool, 1))::int);
  pick := pool[idx];

  select * into e from public.raffle_entries
  where raffle_id = p.raffle_id and pick between first_ticket and first_ticket + tickets - 1;

  update public.raffle_prizes
     set winner_ticket = pick,
         winner_entry_id = e.id,
         winner_label = public.raffle_short_name(e.name),
         drawn_at = now()
   where id = prize_id
  returning * into p;

  return p;
end $$;

revoke all on function public.raffle_stats() from public;
revoke all on function public.raffle_draw(uuid) from public;
grant execute on function public.raffle_stats() to anon, authenticated;
grant execute on function public.raffle_draw(uuid) to authenticated;
