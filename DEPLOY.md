# Déploiement — SONIKLAB

Site statique (Nuxt 4 en mode `generate`), même principe que FitBudget :
**domaine chez OVH**, **DNS + hébergement gratuits chez Cloudflare**.
Seul le nom de domaine est payant (~7–10 €/an pour un `.fr`).

## État
- ✅ **GitHub Pages** (adresse actuelle) : https://matthisbd.github.io/soniklab/
- ✅ **Cloudflare** (compte `soniklab.asso@gmail.com`, Worker statique `soniklab`) :
  https://soniklab.soniklab.workers.dev — déployé à la main le 2 oct. 2026
- ⏳ Domaine **soniklab.fr** à acheter chez OVH, puis à brancher (étape 2).
- ⚠️ **soniklab.fr avec un K** — `soniclab.fr` (avec un C) est déjà pris.

> Note : contrairement à FitBudget (Cloudflare « Pages »), on utilise un
> **Worker 100 % statique** (`wrangler.jsonc`, sans script) : c'est la voie
> que Cloudflare recommande désormais (Pages est fondu dans Workers ; la
> commande `wrangler pages project create` tente même de transformer le projet
> en appli serveur — ne pas l'utiliser). Gratuit, HTTPS et domaine perso inclus.

## Comment ça marche
- `wrangler.jsonc` : envoie le dossier `.output/public` (sortie de
  `npm run generate`) ; les domaines perso y sont déclarés (`routes`).
- `SITE_URL` décide du chemin (`/soniklab/` sur github.io, `/` sur
  soniklab.fr) et des URL absolues de l'aperçu de partage (`og:image`).
  Voir le haut de `nuxt.config.ts`.
- `.github/workflows/deploy.yml` (à chaque `git push` sur `main`) :

| Secret `CLOUDFLARE_API_TOKEN` | Résultat |
|---|---|
| absent | site publié sur GitHub Pages (comme avant) |
| présent | site publié sur **Cloudflare** (`SITE_URL`) ; GitHub Pages ne sert plus qu'une **redirection** vers la nouvelle adresse (les anciens liens continuent de marcher) |

## Déployer à la main (depuis ce PC)
```bash
npx wrangler whoami        # doit afficher soniklab.asso@gmail.com
SITE_URL=https://soniklab.fr/ NODE_ENV=production npm run generate
npx wrangler deploy
```
⚠️ Arrêter `npm run dev` avant : sous Windows il verrouille `.output/` et la
génération échoue (`EBUSY`).

## Mise en place restante

### 1. Acheter le domaine — OVH
Commander `soniklab.fr`. Si possible, mettre **l'association comme titulaire**
(facilite un futur transfert vers un compte OVH de l'asso). Pas besoin
d'hébergement OVH.

### 2. Brancher le domaine (DNS délégué à Cloudflare)
1. Cloudflare (compte asso) → **Add a domain** → `soniklab.fr` → plan **Free**.
2. Cloudflare donne **2 serveurs de noms** (`xxx.ns.cloudflare.com`).
3. OVH → espace client → `soniklab.fr` → onglet **Serveurs DNS** → **Modifier**
   → remplacer les NS OVH par les 2 de Cloudflare (propagation : quelques
   minutes à 24 h ; Cloudflare envoie un mail quand le domaine est actif).
4. Une fois actif : décommenter le bloc `routes` de `wrangler.jsonc`
   (`soniklab.fr` + `www.soniklab.fr`) puis redéployer → Cloudflare crée
   les DNS et le certificat HTTPS tout seul.

### 3. Automatiser (chaque `git push` déploie sur soniklab.fr)
1. Cloudflare → My Profile → **API Tokens** → Create Token → modèle
   **« Edit Cloudflare Workers »** → compte `Soniklab.asso@gmail.com's Account`
   → créer.
2. Dans le dépôt GitHub :
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN       # coller le token (saisie masquée)
   gh secret set CLOUDFLARE_ACCOUNT_ID --body "caa0dbb8e982fa799c479e66b5020442"
   gh variable set SITE_URL --body "https://soniklab.fr/"
   ```
3. `git push` (ou relancer le workflow dans l'onglet Actions).

## Après la bascule
- Supabase : rien à changer (connexion email/mot de passe, pas d'URL de
  redirection ; l'API accepte toutes les origines).
- Rafraîchir l'aperçu de partage : Facebook **Sharing Debugger** sur
  `https://soniklab.fr/` (vaut pour Insta / WhatsApp / Messenger).
- Optionnel : adresse `contact@soniklab.fr` gratuite via **Cloudflare Email
  Routing** (redirige vers `soniklab.asso@gmail.com`).
