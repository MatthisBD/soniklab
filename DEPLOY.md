# Déploiement — SONIKLAB

Site statique (Nuxt 4 en mode `generate`), même recette que FitBudget :
**domaine chez OVH**, **DNS + hébergement gratuits chez Cloudflare (Pages)**.
Seul le nom de domaine est payant (~7–10 €/an pour un `.fr`).

## État
- ✅ En ligne aujourd'hui sur **GitHub Pages** : https://matthisbd.github.io/soniklab/
- ⏳ Cible : **https://soniklab.fr** (Cloudflare Pages, projet `soniklab`)
- ⚠️ Acheter **soniklab.fr avec un K** — `soniclab.fr` (avec un C) appartient
  déjà à quelqu'un d'autre.

## Comment ça marche
Le workflow `.github/workflows/deploy.yml` se lance à chaque `git push` sur
`main` et choisit tout seul :

| Secret `CLOUDFLARE_API_TOKEN` | Résultat |
|---|---|
| absent | site publié sur GitHub Pages (comme avant) |
| présent | site publié sur **Cloudflare Pages** (`SITE_URL`), et GitHub Pages ne sert plus qu'une **redirection** vers la nouvelle adresse (les anciens liens partagés continuent de marcher) |

La variable `SITE_URL` décide aussi du chemin (`/soniklab/` sur github.io,
`/` sur soniklab.fr) et des URL absolues de l'aperçu de partage (`og:image`).
Voir le haut de `nuxt.config.ts`.

## Mise en place (une seule fois)

### 1. Acheter le domaine — OVH
Commander `soniklab.fr`. Rien d'autre à configurer chez OVH pour l'instant
(pas besoin d'hébergement OVH).

### 2. Créer le projet Cloudflare Pages
```bash
npx wrangler login                       # ouvre le navigateur (compte Cloudflare)
npx wrangler whoami                      # note l'« Account ID »
npx wrangler pages project create soniklab --production-branch main
SITE_URL=https://soniklab.fr/ NODE_ENV=production npm run generate
npx wrangler pages deploy .output/public --project-name soniklab --branch main
```
→ le site répond sur `https://soniklab.pages.dev`.

### 3. Brancher le domaine (DNS délégué à Cloudflare)
1. Cloudflare Dashboard → **Add a site** → `soniklab.fr` → plan **Free**.
2. Cloudflare donne **2 serveurs de noms** (`xxx.ns.cloudflare.com`).
3. OVH → espace client → `soniklab.fr` → onglet **Serveurs DNS** → **Modifier**
   → remplacer les NS OVH par les 2 de Cloudflare. (Propagation : de quelques
   minutes à 24 h.)
4. Cloudflare → Workers & Pages → `soniklab` → **Custom domains** → ajouter
   `soniklab.fr` puis `www.soniklab.fr`. DNS + certificat HTTPS automatiques.

### 4. Automatiser (chaque `git push` déploie sur soniklab.fr)
1. Cloudflare → My Profile → **API Tokens** → Create Token → modèle
   **« Edit Cloudflare Workers »** (inclut Pages) → limiter au compte → créer.
2. Dans le dépôt GitHub :
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN          # coller le token (saisie masquée)
   gh secret set CLOUDFLARE_ACCOUNT_ID --body "<account id>"
   gh variable set SITE_URL --body "https://soniklab.fr/"
   ```
3. `git push` (ou relancer le workflow dans l'onglet Actions).

## Après la bascule
- Supabase : rien à changer (connexion email/mot de passe, pas d'URL de
  redirection ; l'API accepte toutes les origines).
- Rafraîchir l'aperçu de partage : Facebook **Sharing Debugger** sur
  `https://soniklab.fr/` (vaut pour Insta / WhatsApp / Messenger).
- Optionnel : e-mail `contact@soniklab.fr` gratuit via **Cloudflare Email
  Routing** (redirige vers `soniklab.asso@gmail.com`).
