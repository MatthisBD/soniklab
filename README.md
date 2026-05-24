# SONIKLAB — Le QG 🎛️

Le **hub de raccourcis** du collectif techno SONIKLAB. Pas un site vitrine :
un point d'entrée unique vers tous les outils de l'asso (HelloAsso, to-do,
réseaux, drive…), dans une identité noir & blanc gravée, façon affiche
sérigraphiée / pochette de vinyle.

Construit avec **Nuxt 4**, **Tailwind CSS v4** (plugin Vite officiel) et **Sass**.

---

## 🚀 Lancer le site

```bash
npm install      # une seule fois
npm run dev      # serveur de dev → http://localhost:3000
```

Autres commandes :

```bash
npm run build    # build de production
npm run preview  # prévisualiser le build
npm run generate # version 100 % statique (déployable sur Netlify, GitHub Pages, etc.)
```

---

## ✏️ Modifier les liens (le plus important)

**Tout se passe dans un seul fichier :** [`app/data/links.ts`](app/data/links.ts)

Chaque raccourci ressemble à ça :

```ts
{ label: 'Adhérer à SONIKLAB', url: '#', note: 'devenir membre' },
```

- Remplace `url: '#'` par la vraie adresse, ex. `url: 'https://www.helloasso.com/...'`
- `label` = le texte affiché, `note` = petite légende optionnelle (en gris)
- Tu peux **ajouter, retirer ou réordonner** les liens librement.

Tant qu'un lien garde `url: '#'`, il s'affiche avec un badge **« à brancher »**
pour qu'on sache lesquels restent à compléter.

Les 4 groupes (HelloAsso / Gestion / Réseaux / Docs) et le bandeau défilant
se modifient au même endroit.

---

## 🎨 Identité & structure

| Élément | Fichier |
|---|---|
| Couleurs, typos, animations (grain, scanlines, vinyle, equalizer, glitch, marquee) | `app/assets/css/main.css` |
| Données des liens | `app/data/links.ts` |
| Page principale | `app/pages/index.vue` |
| Composants (Vinyl, Equalizer, Marquee, LinkCard, AppIcon) | `app/components/` |
| Logo | `public/soniklab-logo.jpeg` |
| Config (meta, polices Google, Tailwind) | `nuxt.config.ts` |

Palette : `void` (noir), `bone` (blanc cassé), `ash`/`smoke` (gris), `grave`/`line`
(surfaces & bordures). Typos : **Anton** (titres), **Space Grotesk** (texte),
**Space Mono** (étiquettes).

Les animations respectent `prefers-reduced-motion` (elles se coupent pour les
personnes sensibles au mouvement).
