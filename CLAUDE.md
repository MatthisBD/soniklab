# SONIKLAB — Le QG 🎛️

> Doc de reprise du projet. À lire en début de session pour récupérer tout le
> contexte : le brief, les choix esthétiques, la stack, la structure et l'état
> d'avancement.

---

## 1. C'est quoi ce projet ?

Un site pour l'association **SONIKLAB**, un **collectif musical orienté techno**
(qui joue à la fête de la musique, dans des guinguettes, des bars, des open
airs…).

**Ce n'est PAS un site vitrine.** C'est un **hub de raccourcis interne** « pour
les copains et nous » : un point d'entrée unique qui regroupe tous les liens
vers les outils de l'asso (HelloAsso, la to-do, les réseaux, le drive…). On
arrive, on clique, on va sur le bon outil.

> **Évolution (mai 2026) :** le site est désormais **en ligne sur GitHub Pages**
> (https://matthisbd.github.io/soniklab/) et dispose d'un **back-end Supabase**
> + un **espace admin** (`/admin`). Les liens ne s'éditent plus dans le code
> mais depuis l'admin, et le site reflète les changements en direct.
> Voir §8 (déploiement) et §8 bis (back-end & admin).

> **Évolution (oct. 2026) — le site devient une VITRINE publique.**
> L'accueil `/` présente l'asso au public (artistes, prochaines dates,
> événements passés avec photos/vidéos, collaborateurs, booking). L'ancien hub
> de raccourcis (« Le repaire du soundsystem ») a déménagé sur **`/qg`**,
> réservé aux membres connectés, comme `/budget`. Un seul bouton
> **« Connexion »** en haut à droite, pour les membres. Voir §8 quater.

### Le brief d'origine (demande du client)
- Un site de **raccourcis / redirections** vers les autres outils de l'asso.
- Liens voulus : **HelloAsso**, **To-Do / gestion**, **réseaux sociaux**,
  **drive / docs partagés**.
- **Style original**, surtout PAS un style générique / « maison ». Doit coller
  au thème **association + musique + techno**.
- Animations : **« oui, bien animé »**.
- Stack imposée : **dernières versions de Nuxt + Tailwind + Sass** (+ `@types/node`).

---

## 2. Direction artistique

L'identité vient **directement du logo** (`public/soniklab-logo.jpeg`) :
vinyle central, line-array, foule en festival, le van de tournée, un voilier au
clair de lune (vibe guinguette), des waveforms partout, lettrage « SONIKLAB » au
pinceau, le tout en **noir & blanc gravé**.

On a donc fait un site **monochrome, façon affiche sérigraphiée / pochette de
vinyle, underground** :

- **Palette N&B** : noir profond, blanc cassé, gris cendre. Aucune couleur vive
  (fidèle au logo).
- **Cartes qui s'inversent** au survol (noir ↔ blanc), comme une affiche.
- Motifs **vinyle** et **waveform** récurrents.

### Tokens de design (définis dans `app/assets/css/main.css` via `@theme`)
| Token | Rôle |
|---|---|
| `void` `#0a0a0a` | fond noir |
| `ink` `#060606` | noir le plus profond (surfaces) |
| `bone` `#f3f1ea` | blanc cassé (texte / inversions) |
| `ash` `#8a8a85` / `smoke` `#b9b9b2` | gris (légendes, texte secondaire) |
| `grave` `#16161a` / `line` `#2a2a2e` | surfaces de cartes & bordures |

**Typos (Google Fonts, chargées dans `nuxt.config.ts`)** :
- **Anton** → titres (impact, condensé, vibe affiche)
- **Space Grotesk** → texte courant
- **Space Mono** → étiquettes / numéros de « piste » / mono

---

## 3. Animations en place

Toutes définies en CSS dans `app/assets/css/main.css` :

| Animation | Où | Détail |
|---|---|---|
| **Vinyle qui tourne** (`spin-slow`) | fond du hero | disque SVG, rotation 8 s |
| **Égaliseurs** (`eq`) | sous le logo + footer | barres de waveform, hauteurs/délais pseudo-aléatoires mais déterministes (pas de mismatch SSR) |
| **Bandeau défilant** (`marquee`) | sous le hero | mots-clés de l'asso, pause au survol |
| **Grain + scanlines** | overlay global | vibe sérigraphie / CRT |
| **Glitch** (`glitch-x`) | titres au survol | clip-path qui jitter |
| **Flicker** (néon) | badge « collectif techno » | scintillement |
| **Reveal au scroll** | sections | apparition en cascade (IntersectionObserver dans `index.vue`) |

⚠️ **Point important (déjà traité) :** au départ ces animations étaient coupées
sous `prefers-reduced-motion: reduce`. Or l'option Windows « Afficher les
animations » désactivée déclenche ce mode → le site paraissait figé. **Choix
assumé :** on laisse tourner les animations de marque quoi qu'il arrive (c'est
l'identité du site) ; le bloc `@media (prefers-reduced-motion)` ne neutralise
plus que l'animation d'entrée au scroll (pour qu'aucun contenu ne reste
invisible). Voir le commentaire dans `main.css`.

---

## 4. Stack technique

| Outil | Version | Notes |
|---|---|---|
| **Nuxt** | 4.4.6 | structure `app/`, SSR + génération statique |
| **Vue** | 3.5.x | |
| **Tailwind CSS** | v4.3 | via le plugin Vite officiel `@tailwindcss/vite` (pas de `tailwind.config.js`, tout en `@theme` dans le CSS) |
| **Sass** | 1.10x | dispo (dev dependency) |
| **@types/node** | 25.x | |
| **@supabase/supabase-js** | 2.x | back-end : base de données + auth (cf. §8 bis) |

> `shadcn-vue` a été **volontairement écarté** : son design system « neutre »
> se battrait avec l'identité 100 % custom. Pour un hub de liens il n'apporte
> rien. À ré-ajouter seulement si on veut un jour des formulaires/modales tout
> faits.

---

## 5. Structure du projet

```
soniklab/
├─ app/
│  ├─ app.vue                 # shell : grain + scanlines + <NuxtPage/>
│  ├─ assets/css/main.css     # ⭐ thème (couleurs, typos) + TOUTES les animations
│  ├─ data/links.ts           # types partagés (les DONNÉES sont en base, cf. §8 bis)
│  ├─ pages/
│  │  ├─ index.vue            # ⭐ VITRINE publique (hero, artistes, dates, archives, collabs, booking)
│  │  ├─ asso.vue             # page « L'asso » (qui on est, ce qu'on fait)
│  │  ├─ evenements.vue       # tous les événements (à venir + archives par année)
│  │  ├─ qg.vue               # 🔒 le QG : raccourcis internes (ex-accueil)
│  │  ├─ admin.vue            # 🔒 espace admin à onglets (cf. components/admin/)
│  │  └─ budget.vue           # 🔒 budget des caissons
│  ├─ plugins/supabase.ts     # init du client Supabase (useSupabase())
│  ├─ composables/
│  │  ├─ useSupabase.ts       # accès client + lecture liens QG / bandeau
│  │  ├─ useShowcase.ts       # ⭐ vitrine : types, lectures, textes par défaut, CRUD admin
│  │  ├─ useMedia.ts          # upload Storage (photos réduites en WebP) + liens YouTube/Vimeo
│  │  ├─ useAuth.ts           # connexion / rôle admin / mot de passe
│  │  ├─ useAdmin.ts          # écritures QG (groupes, liens, bandeau)
│  │  ├─ useFlash.ts          # message de confirmation partagé des outils internes
│  │  ├─ useReveal.ts         # apparition au scroll (.reveal), auto pour le contenu async
│  │  ├─ useVisitCounter.ts   # compteur de visiteurs (filtre anti-robots, cf. §8 quater)
│  │  └─ useBudget.ts         # budget caissons : lecture + calculs + CRUD
│  └─ components/
│     ├─ SiteHeader.vue / SiteFooter.vue  # barre + pied des pages publiques
│     ├─ SectionHead.vue      # titre de section (kicker + titre)
│     ├─ ArtistCard.vue · CollabCard.vue · UpcomingEvent.vue · PastEventCard.vue
│     ├─ EventGallery.vue     # fiche événement plein écran + galerie (clavier, swipe)
│     ├─ AuthGate.vue         # 🔒 portail connexion → droits → contenu (QG, budget, admin)
│     ├─ ToolHeader.vue       # en-tête des pages internes (QG · Budget · Admin)
│     ├─ admin/               # un composant par onglet de l'admin + AdminMediaField
│     ├─ VisitCounter.vue     # compteur rétro à rouleaux du pied de page
│     ├─ AppIcon.vue          # icônes SVG inline
│     ├─ Vinyl.vue · Equalizer.vue · Marquee.vue · LinkCard.vue
├─ public/soniklab-logo.jpeg  # le logo
├─ supabase/budget-caissons.sql # SQL des tables budget (à coller dans le dashboard)
├─ supabase/vitrine.sql       # SQL vitrine + bucket médias + QG privé (✅ exécuté)
├─ supabase/rejoindre.sql     # SQL du formulaire « Nous rejoindre » (à coller, idempotent)
├─ supabase/visites.sql       # SQL du compteur de visiteurs (✅ exécuté)
├─ public/og-image.png        # image d'aperçu de partage 1200×630 (Insta, WhatsApp…)
├─ .github/workflows/deploy.yml # déploiement auto sur GitHub Pages
├─ nuxt.config.ts             # meta, polices, Tailwind, baseURL, config Supabase
└─ CLAUDE.md                  # ce fichier
```

---

## 6. Lancer le site

```bash
npm install      # une seule fois
npm run dev      # dev → http://localhost:3000
```

> Si une animation semble figée après une modif de CSS : **rafraîchissement
> forcé `Ctrl + F5`** (cache navigateur).

Autres commandes :
```bash
npm run build     # build de production
npm run preview   # prévisualiser le build
npm run generate  # version 100 % statique
```

---

## 7. ✏️ Modifier les liens (le plus fréquent)

**Ça ne se passe plus dans le code, mais dans l'espace admin :**
👉 https://matthisbd.github.io/soniklab/admin

On se connecte (email + mot de passe), puis on édite les groupes, les liens
(label, URL, note, ordre) et le bandeau défilant. Les changements apparaissent
**immédiatement** sur le site (lecture en direct depuis Supabase, aucun
redéploiement nécessaire).

Tant qu'un lien garde `url: '#'`, il affiche un badge **« à brancher »** sur le
site pour repérer ce qui reste à compléter.

> Le fichier `app/data/links.ts` ne contient plus que les **types** TypeScript
> partagés par les composants. Les données vivent en base (cf. §8 bis).

---

## 8. Déploiement — https://soniklab.fr (EN LIGNE ✅ depuis le 2 oct. 2026)

> **Le site vit sur https://soniklab.fr** (+ `www`) : domaine OVH (titulaire :
> Matthis, à passer à l'asso plus tard), DNS + hébergement Cloudflare (compte
> `soniklab.asso@gmail.com`), Worker 100 % statique décrit par `wrangler.jsonc`
> (PAS `wrangler pages project create`, qui convertit le projet en appli
> serveur). Chaque `git push` sur `main` → GitHub Actions → `wrangler deploy`
> (secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`, variable
> `SITE_URL`). L'ancienne adresse github.io ne sert plus qu'une **redirection**
> vers soniklab.fr. Détails : **`DEPLOY.md`**. La section ci-dessous décrit
> l'ancien fonctionnement GitHub Pages (toujours utilisé pour la redirection). Le workflow
> bascule tout seul sur Cloudflare dès que le secret `CLOUDFLARE_API_TOKEN`
> existe ; GitHub Pages sert alors une redirection vers la nouvelle adresse.
> `SITE_URL` (variable du dépôt) pilote baseURL, preset Nitro et og:image.

- **URL publique : https://matthisbd.github.io/soniklab/**
- Dépôt : https://github.com/MatthisBD/soniklab (public).
- **Déploiement automatique** : `.github/workflows/deploy.yml` se déclenche à
  chaque `push` sur `main` → build (`npm run generate`) + publication sur Pages.
  Pour mettre le site à jour : `git push`, puis ~1-2 min.

Config dans `nuxt.config.ts` :
- `nitro.preset: 'github_pages'` → site statique dans `.output/public`
  (avec `.nojekyll` + `404.html`).
- `baseURL` = `/soniklab/` en **production**, `/` en **dev**.
- Les fichiers de `public/` (logo, favicon) sont préfixés par ce `baseURL`
  (voir `logoSrc` dans `index.vue` et les `head.link` dans `nuxt.config.ts`).

Détails du workflow :
- Utilise `npm install` (et non `npm ci`) : le lockfile généré sous Windows ne
  contient pas les binaires natifs Linux (`@emnapi/*`) requis par le runner.
- Pages a été activé en mode « GitHub Actions » (`build_type=workflow`).
- **Aucun secret à configurer** : l'URL et la clé publique Supabase sont dans la
  config (la clé `publishable` est publique par conception).

> Si on déploie ailleurs (Netlify, domaine racine…), remettre `baseURL = '/'`
> et adapter/retirer le preset `github_pages`.

---

## 8 bis. Back-end Supabase & espace admin

### Projet Supabase
- Ref : **`yrrmxnivgwjvrasrfqzp`** · région **eu-west-3** (Paris) · plan gratuit.
- URL + clé publique dans `runtimeConfig.public` (`nuxt.config.ts`),
  surchargeables via `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_KEY`.
- Client initialisé dans `app/plugins/supabase.ts`, accès via `useSupabase()`.

### Tables
| Table | Colonnes clés |
|---|---|
| `link_groups` | slug, track, title, tagline, icon, position |
| `links` | group_id → link_groups, label, url, note, position |
| `ticker_words` | word, position |
| `budget_categories` | name, note, units, position |
| `budget_cost_lines` | category_id → budget_categories, label, mode (`unit`\|`surface`), quantity, width_cm, height_cm, unit_price, unit_label, optional, included, position |
| `budget_revenue_lines` | category_id → budget_categories, label, quantity, unit_price, position |

> Le SQL de création des 3 tables `budget_*` (+ RLS) est dans
> `supabase/budget-caissons.sql` — à coller **une fois** dans le SQL Editor du
> dashboard. Sert la **page interne `/budget`** (estimation du coût des caissons,
> avec/sans HP, lignes de recette). Voir §8 ter.

### Sécurité (RLS) — important
- **Lecture publique** (`anon` + `authenticated`) sur `ticker_words` et les tables vitrine (§8 quater).
  ⚠️ `link_groups` / `links` (le QG) sont **privées** depuis `supabase/vitrine.sql`.
- **Tables `budget_*` : PRIVÉES** — lecture **et** écriture réservées aux admins
  (politiques `for all` gardées par `is_admin()`). Un non-admin ne voit rien.
- **Écriture réservée aux admins** : politiques `for all` gardées par la fonction
  `public.is_admin()`, qui teste `app_metadata.role = 'admin'` dans le JWT.
  `app_metadata` n'est **pas** modifiable par l'utilisateur (≠ `user_metadata`)
  → c'est le bon endroit pour stocker un rôle d'autorisation.
- Conséquence : même un visiteur connecté sans le rôle admin ne peut **rien**
  écrire. Vérifié de bout en bout (lecture OK, écriture anonyme refusée 42501,
  écriture admin OK).

### Espace admin (`app/pages/admin.vue`)
Trois états :
1. **Non connecté** : formulaire **email / mot de passe**.
2. **Connecté mais pas admin** : message « compte créé, en attente de droits » +
   déconnexion (état de garde, ne devrait pas arriver puisqu'il n'y a plus
   d'inscription publique).
3. **Admin** : éditeur CRUD (groupes, liens avec réordonnancement ↑/↓, bandeau)
   + changement de mot de passe.

- Auth Supabase, session en localStorage (site statique → pas de cookies SSR).
- Composables : `useAuth.ts` (connexion email, rôle, mot de passe) et
  `useAdmin.ts` (écritures).
- Le fond animé (grain) est **désactivé sur `/admin`** (cf. `app/app.vue`).
- Le titre **SONIKLAB** de l'admin renvoie au site.
- **Accès** : bouton « Connexion » en haut à droite de la vitrine → `/qg`
  (devient « Espace membres » une fois connecté). Les liens QG/budget/admin du
  footer ne s'affichent que si `auth.isAdmin` est vrai.

### Comptes admin (accès réservé)
- **Connexion email/mot de passe uniquement.** Google a été retiré de l'UI ;
  il n'y a plus d'inscription publique. (Le provider Google peut rester
  configuré dans le dashboard, c'est sans incidence ; on peut le désactiver
  pour faire le ménage.)
- **Deux comptes admin** créés directement en base (email confirmé,
  `raw_app_meta_data.role = 'admin'`) :
  - `matthis.bd.pro@gmail.com`
  - `soniklab.asso@gmail.com` (compte de l'asso)
- **Sécurité (vérifiée)** : le rôle admin est dans `app_metadata` (côté serveur,
  non modifiable par l'utilisateur). Testé : un non-admin ne peut rien écrire
  (42501), et `updateUser({ data: { role: 'admin' } })` n'écrit que dans
  `user_metadata` → sans effet, écriture toujours refusée.
- **Ajouter un admin** :
  ```sql
  -- créer le compte (adapter email + mot de passe), puis il est admin direct
  do $$
  declare uid uuid := gen_random_uuid();
    e text := 'nouvel-admin@exemple.fr'; p text := 'MotDePasseFort!';
  begin
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      e, extensions.crypt(p, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb, '{}'::jsonb,
      now(), now(), '', '', '', '');
    insert into auth.identities (provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at)
    values (uid, uid, jsonb_build_object('sub', uid::text, 'email', e, 'email_verified', true),
      'email', now(), now(), now());
  end $$;
  ```
- **Promouvoir un compte existant** : `update auth.users set raw_app_meta_data =
  raw_app_meta_data || '{"role":"admin"}' where email = '…';`
- **Mot de passe oublié** (volontairement PAS de réinitialisation publique sur
  le site) : SQL Editor du dashboard Supabase, avec un mot de passe
  temporaire, puis le changer aussitôt dans `/admin` → « Mon compte » (le SQL
  reste dans l'historique de l'éditeur) :
  ```sql
  update auth.users
  set encrypted_password = extensions.crypt('Temporaire!', extensions.gen_salt('bf')),
      updated_at = now()
  where email = '…';
  ```

---

## 8 ter. Page budget caissons (`/budget`) — interne

Outil interne « pour nous » d'estimation du coût des caissons (enceintes) que
l'asso construit et parfois revend. **Réservé aux admins** (mêmes 3 états que
`/admin` : connexion → en attente de droits → outil). Aucun accès n'est montré
aux visiteurs : les liens « Budget » (top bar + footer de l'accueil, en-tête de
l'admin) ne s'affichent que si `auth.isAdmin`.

- **Catégories** = types de caisson. Chacune a un nom, une note, un nombre
  d'unités à produire.
- **Lignes de coût** (matériaux) en deux modes :
  - `surface` : largeur × hauteur (cm) × quantité × **prix au m²** → m² auto ;
  - `unit` : quantité × **prix unitaire** (+ étiquette d'unité libre).
  - Chaque ligne peut être **optionnelle** et **incluse ou non** (ex. le HP :
    parfois déjà dispo, parfois à acheter) → bascule le total en direct.
- **Lignes de recette** : « on revend telle chose » (quantité × prix).
- **Récap par catégorie** (computed) : coût/caisson (dont optionnel),
  investissement total (= coût × unités), recettes, **solde** (recettes −
  investissement).
- Composable `app/composables/useBudget.ts` : `fetchBudget()`, fonctions de
  calcul **pures** (`lineCost`, `unitCost`, `totalCost`, `totalRevenue`,
  `balance`, `formatEur`) + CRUD admin. Page `app/pages/budget.vue`.
- Le grain animé est coupé sur `/budget` (comme `/admin`, cf. `app/app.vue`).

## 8 quater. Vitrine publique (oct. 2026)

### Pages
| Route | Public ? | Contenu |
|---|---|---|
| `/` | ✅ | hero, artistes, prochaines dates, archives (6 dernières), collabs, teaser asso, **sound system** (`#materiel`, masqué si vide), booking |
| `/asso` | ✅ | intro, histoire, « ce qu'on fait » (piliers), appel à l'action |
| `/evenements` | ✅ | à venir + archives groupées par année, galerie au clic |
| `/collaborer` | ✅ | formulaire « Booking & collab » (menu : « Booking ») : booker un DJ, jouer avec nous, son & technique, visuels & médias, autre projet, bénévole (fermé). **On ne recrute pas** : pas de « rejoindre ». `/rejoindre` redirige ici (routeRules) |
| `/mentions-legales` | ✅ | éditeur (infos asso réglables dans admin → Textes & réseaux → « Mentions légales » : `legal_*`), hébergeurs (Cloudflare, Supabase UE, OVH), propriété intellectuelle (logo/nom protégés), RGPD (formulaire, droits, CNIL), cookies (aucun pistage ; compteur anonyme, Google Fonts, YouTube nocookie). Ancre `#donnees` liée depuis le formulaire. Lien dans le pied de page avec « © SONIKLAB · tous droits réservés » |
| `/liens` | ✅ | « link in bio » (bio Instagram, QR codes) : prochaine date, don HelloAsso, réseaux, liens libres, contact, pages du site |
| `/qg` · `/budget` · `/admin` | 🔒 | via `AuthGate` (admins uniquement), `noindex` |

### Données (cf. `supabase/vitrine.sql`)
| Table | Rôle |
|---|---|
| `artists` | nom, rôle, style, bio, photo, `links` (jsonb `[{label,url}]`), visible, position |
| `collaborators` | nom, type, ville, description, logo, url, visible, position |
| `events` | titre, `starts_on` (date → « à venir » si ≥ aujourd'hui, sinon archive), horaires, lieu, ville, description, cover, ticket_url, visible |
| `event_media` | event_id, kind (`image`\|`video`\|`embed`\|`link`), url, caption, position |
| `join_requests` | demandes du formulaire `/collaborer` (admin → onglet « Demandes ») : nom, email, tél., profil, liens, message, status (`new`\|`contacted`\|`archived`). **Envoi public, lecture admin** (SQL : `supabase/rejoindre.sql`) |
| `gear_items` | matériel / sound system : nom, type, caractéristiques (retours à la ligne gardés), photo, visible, position. Affiché sur l'accueil et sous le formulaire `/collaborer` (`GearGrid.vue`) ; admin → onglet « Matériel » ; intro = réglage `gear_intro` (SQL : `supabase/materiel.sql`) |
| `site_visits` | compteur de visiteurs : `day`, `visitors` (personnes distinctes ce jour), `new_visitors` (premières venues). **Aucune donnée perso.** Le public passe par les RPC `visit_total()` / `register_visit(first_time)` ; détail lisible des admins seuls (SQL : `supabase/visites.sql`) |
| `site_settings` | clé → texte (accroche, textes de l'asso, booking, email, Instagram, SoundCloud, HelloAsso = bouton « Faire un don », `extra_links` = liens libres « Libellé \| URL » par ligne pour /liens). Valeurs par défaut dans `SETTINGS_DEFAULTS` (useShowcase.ts) : vide = défaut |

- **RLS** : lecture publique des lignes `visible` (les admins voient tout),
  écriture admin. `site_settings` et `ticker_words` en lecture publique.
- **QG privé** : le script remplace les politiques de `link_groups` / `links`
  par « admins uniquement » (lecture comprise).
- **Médias** : bucket Storage public `media` (upload admin uniquement, 50 Mo
  max). Les photos sont **réduites dans le navigateur** (≤ 1600 px, WebP) avant
  l'envoi. Vidéos lourdes → les mettre sur YouTube/Vimeo et coller le lien
  (intégration auto en iframe). Supprimer une ligne supprime aussi ses fichiers.
- **Chargement** : `useShowcaseData()` = rendu au build (contenu dans le HTML,
  bon pour le SEO) **puis** rechargé dans le navigateur au montage → les
  modifs de l'admin sont visibles tout de suite sans redéployer. En cas
  d'erreur (table absente), on retombe sur la valeur par défaut / état vide.

### Admin (onglets, `?tab=`)
Artistes · Événements (+ galerie : upload multiple, liens vidéo, légendes,
« ★ » = couverture) · Collabs · Matériel · Demandes (badge = nouvelles demandes,
aussi rappelé sur le QG) · Textes & réseaux (+ bandeau) · Liens du QG ·
Mon compte. Les éléments masqués (`visible = false`) restent éditables.
- **Brouillons** : « + Artiste / Événement / Collab » crée la ligne MASQUÉE ;
  elle n'est publiée qu'au clic sur « Enregistrer » (case « Visible » cochée
  par défaut). Indicateur « non enregistré » via `useDirty()`.
- **Fiche événement** (`EventGallery`) : l'affiche (`cover_url`) est le 1er
  élément de la galerie, images au format d'origine, clic = plein écran.

### Compteur de visiteurs (pied de page)
`VisitCounter.vue` (rouleaux de chiffres qui défilent quand le pied de page
apparaît) + `useVisitCounter.ts`, lancé depuis `app.vue` sur les pages
publiques seulement. Total = personnes distinctes depuis la mise en place
(oct. 2026, pas d'historique avant). Tri humains / robots côté navigateur :
comptage en JS, user-agents de robots + `navigator.webdriver` écartés, ~5 s
d'onglet visible ou vraie interaction exigées, une fois par navigateur
(repère `soniklab:visit` en localStorage), membres connectés exclus pour
toujours (repère `member`), jamais compté en local (dev / preview). Tant que
la RPC échoue (SQL pas exécuté), le compteur reste invisible.

### Référencement (SEO)
- `server/routes/sitemap.xml.ts` et `robots.txt.ts` : générés au build
  (`nitro.prerender.routes`) à partir de `runtimeConfig.public.siteUrl`.
  **Nouvelle page publique → l'ajouter à `PAGES` dans sitemap.xml.ts.**
- `app.vue` : balise **canonique** + `og:url` sur chaque page (format avec
  « / » final) → www.soniklab.fr et soniklab.fr ne sont pas vus en doublon.
- `useStructuredData.ts` : JSON-LD sur l'accueil (Organization + WebSite +
  MusicEvent des prochaines dates ayant un lieu) ; `sameAs` = Instagram,
  HelloAsso, SoundCloud renseignés dans l'admin.
- Côté humains : Google Search Console (propriété « Domaine » soniklab.fr,
  vérif. auto via Cloudflare) + envoi du sitemap ; liens entrants (bio Insta,
  champ « site web » HelloAsso, partenaires).

## 9. Décisions & historique (pour le futur)
- **Style** : monochrome gravé dérivé du logo. Validé par le client (« incroyable »).
  **Oct. 2026 : les PHOTOS restent en couleur** (artistes, affiches, galeries,
  logos de collabs) à la demande du client — l'interface reste N&B, la couleur
  vient du contenu. Ne pas remettre de filtre `grayscale`.
- **shadcn-vue** : écarté volontairement (cf. §4).
- **Accessibilité vs animation** : priorité donnée à l'animation (cf. §3).
- **GitHub Pages** : `baseURL`/preset ajoutés, site mis en ligne sous `/soniklab/`.
- **Back-end (mai 2026)** : choix **Supabase + Pages** plutôt qu'un hébergeur
  full-stack → reste gratuit, pas de serveur à gérer, tout se fait côté
  navigateur (la clé publique + RLS suffisent). Données migrées de `links.ts`
  vers la base.
- **Autorisation** : rôle admin dans `app_metadata` (sûr), politiques RLS
  gardées par `is_admin()`.
- **Vitrine (oct. 2026)** : l'accueil devient public, le hub part sur `/qg`
  (privé). Tous les comptes sont des membres de l'asso = admins ; pas
  d'inscription publique. Pas de routes dynamiques (`/evenements/[id]`) : sur
  GitHub Pages statique elles tomberaient en 404 au chargement direct → la
  fiche événement est une modale (`EventGallery`).
- **Aperçu de partage** : `public/og-image.png` (généré en HTML + Chrome
  headless). Les URL `og:image` doivent être ABSOLUES (`siteUrl` dans
  `nuxt.config.ts`), sinon Insta/WhatsApp n'affichent rien. Après un
  changement, forcer le rafraîchissement du cache via le « Sharing Debugger »
  de Facebook (vaut aussi pour Insta/WhatsApp).
- **Types de demande fermés** (`/collaborer`) : réglage `join_closed_profiles`
  (site_settings, ids séparés par des virgules, défaut `benevole`) — grisés,
  barrés, non sélectionnables. Basculé depuis admin → Demandes. Valeur vide
  autorisée (= tout ouvert, cf. `EMPTY_ALLOWED` dans useShowcase.ts).
- **vue-tsc 3.3.x** signale à tort `Cannot find name 'g'` dans
  `evenements.vue` (v-for imbriqué) : régression de l'outil. Vérifier les types
  avec `npx -p vue-tsc@3.1 -p typescript@5 vue-tsc --noEmit -p .nuxt/tsconfig.app.json`.
- **Formulaire « Booking & collab »** (`/collaborer`) : anti-spam par champ piège + délai de 3 s
  (pas de captcha). Données perso visibles des seuls admins (RLS).
- **CSS** : `overflow-x: clip` (et non `hidden`) sur `html`/`body` — `hidden`
  sur les deux faisait de `body` un conteneur de défilement et cassait le
  header `sticky`.

## 10. TODO / pistes
- [x] Exécuter `supabase/vitrine.sql` (tables vitrine, bucket `media`, QG privé).
- [x] Exécuter `supabase/rejoindre.sql` (table `join_requests` du formulaire).
- [ ] **Exécuter `supabase/materiel.sql`** (table `gear_items` du sound system),
      puis ajouter le matos dans admin → « Matériel ».
- [ ] **Exécuter `supabase/collaborer.sql`** (ajoute le type « booking »). En
      attendant, les demandes de booking sont enregistrées en « autre » avec
      le préfixe « [Booker un DJ] » dans le message (rien n'est perdu).
- [x] Exécuter `supabase/visites.sql` (compteur de visiteurs du pied de page).
- [ ] Piste : courbe des visites par jour dans l'admin (`site_visits`).
- [x] Passer sur **soniklab.fr** (OVH + Cloudflare, déploiement auto) — 2 oct. 2026.
- [ ] Optionnel : passer le titulaire du domaine OVH au nom de l'asso
      (onglet « Contact management ») le jour où l'asso a son compte OVH.
- [ ] **Compléter les mentions légales** dans l'admin (Textes & réseaux) :
      adresse du siège, n° RNA, directeur·rice de la publication, téléphone
      (sinon « à compléter » s'affiche sur /mentions-legales). Si on change un
      traitement de données (nouvel outil, nouveau formulaire…), mettre à jour
      la page et sa date `UPDATED`.
- [ ] **Google Search Console** : ajouter soniklab.fr (compte de l'asso),
      envoyer `https://soniklab.fr/sitemap.xml`, demander l'indexation de
      l'accueil. Idem Bing Webmaster Tools (import depuis Search Console).
- [ ] Optionnel : règle de redirection Cloudflare www → soniklab.fr
      (Rules → Redirect Rules → modèle « Redirect from WWW to root »).
- [ ] Piste : héberger les polices sur le site (au lieu de Google Fonts) pour
      ne plus transmettre l'IP des visiteurs à Google.
- [ ] Piste protection : dépôt de la marque SONIKLAB (nom + logo) à l'INPI.
- [ ] **Nouveau logo** en cours chez un graphiste (l'actuel est en partie
      généré par IA → non protégeable par le droit d'auteur). À réception :
      remplacer `public/soniklab-logo.jpeg`, régénérer `public/og-image.png`
      (HTML + Chrome headless, cf. §9) et faire signer au graphiste une
      cession de droits au profit de l'asso.
- [ ] Remplir la vitrine via l'admin : artistes, événements + photos, collabs,
      email / Instagram / HelloAsso (onglet « Textes & réseaux »).
- [x] Formulaire « Nous rejoindre » + image de partage (og:image).
- [ ] Pistes : lecteur SoundCloud intégré sur les cartes artistes, page mentions
      légales, notification mail à chaque candidature (Edge Function / webhook).
      Press kit : écarté — on partage le drive aux artistes (logo moins exposé).
- [ ] Renseigner les vraies URLs des liens **via l'admin** (côté client).
- [ ] **Exécuter `supabase/budget-caissons.sql`** dans le dashboard Supabase
      (crée les tables `budget_*` requises par la page `/budget`).
- [x] Page interne `/budget` : estimation du coût des caissons (admin only).
- [x] Déployer sur GitHub Pages (repo + workflow auto).
- [x] Back-end Supabase + espace admin (édition du contenu sans toucher au code).
- [ ] Changer les mots de passe temporaires des 2 comptes admin
      (`matthis.bd.pro` et `soniklab.asso`) depuis `/admin` → « Mon compte ».
- [ ] Optionnel : désactiver le provider Google + l'inscription email dans le
      dashboard Supabase (verrouillage total ; déjà sûr grâce au RLS).
- [ ] Optionnel : réglages fins d'animation (vitesse vinyle/bandeau, intensité du grain).
- [x] Favicon SONIKLAB : vinyle (`public/favicon.svg`, décliné en `favicon.ico`
      16/32/48, `apple-touch-icon.png`, `icon-192/512.png` + `site.webmanifest`),
      PNG générés via Chrome headless depuis le SVG.
