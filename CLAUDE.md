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
│  │  ├─ index.vue            # la page d'accueil (hero, liens, footer, reveal)
│  │  └─ admin.vue            # ⭐ espace admin (connexion + édition du contenu)
│  ├─ plugins/supabase.ts     # init du client Supabase (useSupabase())
│  ├─ composables/
│  │  ├─ useSupabase.ts       # accès client + lecture des données
│  │  ├─ useAuth.ts           # connexion / rôle admin / mot de passe
│  │  └─ useAdmin.ts          # écritures (CRUD groupes, liens, bandeau)
│  └─ components/
│     ├─ AppIcon.vue          # icônes SVG inline (ticket, checklist, broadcast, folder, arrow)
│     ├─ Vinyl.vue            # disque vinyle animé
│     ├─ Equalizer.vue        # barres de waveform animées
│     ├─ Marquee.vue          # bandeau défilant
│     └─ LinkCard.vue         # carte d'un groupe de liens (effet d'inversion)
├─ public/soniklab-logo.jpeg  # le logo
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

## 8. Déploiement — GitHub Pages (EN LIGNE ✅)

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

### Sécurité (RLS) — important
- **Lecture publique** (`anon` + `authenticated`) sur les 3 tables.
- **Écriture réservée aux admins** : politiques `for all` gardées par la fonction
  `public.is_admin()`, qui teste `app_metadata.role = 'admin'` dans le JWT.
  `app_metadata` n'est **pas** modifiable par l'utilisateur (≠ `user_metadata`)
  → c'est le bon endroit pour stocker un rôle d'autorisation.
- Conséquence : même un visiteur connecté sans le rôle admin ne peut **rien**
  écrire. Vérifié de bout en bout (lecture OK, écriture anonyme refusée 42501,
  écriture admin OK).

### Espace admin (`app/pages/admin.vue`)
- Connexion email/mot de passe (Supabase Auth, session en localStorage).
- Éditeur CRUD : groupes, liens (avec réordonnancement ↑/↓), bandeau défilant,
  + changement de mot de passe.
- Composables : `useAuth.ts` (connexion, rôle, mot de passe) et `useAdmin.ts`
  (écritures).

### Gérer les comptes admin
- Le 1er admin a été créé directement en base (`auth.users` + `auth.identities`,
  email confirmé, `raw_app_meta_data.role = 'admin'`).
- **Ajouter un admin** : créer un utilisateur (dashboard Supabase →
  Authentication → Add user) puis exécuter en SQL :
  ```sql
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
  where email = 'nouvel-admin@exemple.fr';
  ```
- L'inscription publique n'a pas besoin d'être désactivée : un compte sans le
  rôle admin n'a aucun droit d'écriture (RLS).

---

## 9. Décisions & historique (pour le futur)
- **Style** : monochrome gravé dérivé du logo (pas de couleur). Validé par le client (« incroyable »).
- **shadcn-vue** : écarté volontairement (cf. §4).
- **Accessibilité vs animation** : priorité donnée à l'animation (cf. §3).
- **GitHub Pages** : `baseURL`/preset ajoutés, site mis en ligne sous `/soniklab/`.
- **Back-end (mai 2026)** : choix **Supabase + Pages** plutôt qu'un hébergeur
  full-stack → reste gratuit, pas de serveur à gérer, tout se fait côté
  navigateur (la clé publique + RLS suffisent). Données migrées de `links.ts`
  vers la base.
- **Autorisation** : rôle admin dans `app_metadata` (sûr), politiques RLS
  gardées par `is_admin()`.

## 10. TODO / pistes
- [ ] Renseigner les vraies URLs des liens **via l'admin** (côté client).
- [x] Déployer sur GitHub Pages (repo + workflow auto).
- [x] Back-end Supabase + espace admin (édition du contenu sans toucher au code).
- [ ] Changer le mot de passe admin temporaire (depuis `/admin` → « Mon compte »).
- [ ] Optionnel : réglages fins d'animation (vitesse vinyle/bandeau, intensité du grain).
- [ ] Optionnel : favicon aux couleurs SONIKLAB (actuellement favicon Nuxt par défaut).
