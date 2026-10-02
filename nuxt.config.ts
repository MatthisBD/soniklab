// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Adresse publique du site, fournie par le workflow de déploiement :
//   - Cloudflare Pages + domaine : SITE_URL=https://soniklab.fr/
//   - GitHub Pages (historique)  : https://matthisbd.github.io/soniklab/ (défaut)
// Les aperçus de partage (Insta, WhatsApp…) exigent des URL ABSOLUES.
const siteUrl = process.env.SITE_URL || 'https://matthisbd.github.io/soniklab/'
const onGithubPages = siteUrl.includes('github.io')

// Chemin de base déduit de l'adresse : "/soniklab/" sur github.io, "/" sur
// soniklab.fr. En dev (npm run dev) on garde toujours la racine "/".
const baseURL = process.env.NODE_ENV === 'production' ? new URL(siteUrl).pathname : '/'
const shareText = 'Artistes, soirées et sound system : la vitrine du collectif techno SONIKLAB.'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Génération 100 % statique dans .output/public.
  // github_pages ajoute .nojekyll ; sur Cloudflare Pages, le preset statique
  // suffit (404.html est servi automatiquement pour les URL inconnues).
  nitro: { preset: onGithubPages ? 'github_pages' : 'static' },

  runtimeConfig: {
    public: {
      // Connexion Supabase. La clé "publishable" est PUBLIQUE par conception :
      // ce sont les règles RLS (côté base) qui protègent réellement les données.
      // Surchargeable via les variables NUXT_PUBLIC_SUPABASE_URL / _KEY.
      supabaseUrl: 'https://yrrmxnivgwjvrasrfqzp.supabase.co',
      supabaseKey: 'sb_publishable_z7OMx2M5uM0OMn3iSXN-ow_nZTNkiUp',
    },
  },

  // Tailwind v4 via le plugin Vite officiel
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'SONIKLAB — Collectif techno',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'SONIKLAB, association et collectif techno : nos artistes, nos soirées en bars, guinguettes et open airs, nos collaborateurs.',
        },
        { name: 'theme-color', content: '#0a0a0a' },
        // Aperçu de partage (image 1200×630 dans public/og-image.png)
        { property: 'og:site_name', content: 'SONIKLAB' },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'SONIKLAB — Collectif techno' },
        { property: 'og:description', content: shareText },
        { property: 'og:image', content: `${siteUrl}og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'SONIKLAB — le son qui rassemble' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${siteUrl}og-image.png` },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: `${baseURL}favicon.ico` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap',
        },
      ],
    },
  },
})
