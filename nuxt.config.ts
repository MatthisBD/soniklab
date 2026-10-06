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
const shareText = 'Artistes, soirées et sound system : la vitrine du collectif techno SONIKLAB, à Saint-Nazaire.'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Génération 100 % statique dans .output/public.
  // github_pages ajoute .nojekyll ; sur Cloudflare Pages, le preset statique
  // suffit (404.html est servi automatiquement pour les URL inconnues).
  nitro: {
    preset: onGithubPages ? 'github_pages' : 'static',
    // Fichiers pour les moteurs de recherche, générés au build (server/routes/)
    prerender: { routes: ['/sitemap.xml', '/robots.txt'] },
  },

  // Ancienne adresse du formulaire (on ne « recrute » pas : c'est du booking / collab)
  routeRules: {
    '/rejoindre': { redirect: { to: '/collaborer', statusCode: 301 } },
  },

  runtimeConfig: {
    public: {
      // Adresse publique (canonique, plan du site, données structurées Google).
      siteUrl,
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
      title: 'SONIKLAB — Collectif & soirées techno à Saint-Nazaire',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'SONIKLAB, association et collectif techno de Saint-Nazaire : soirées techno en bars, guinguettes et open airs, nos DJs, notre sound system, booking et collaborations.',
        },
        { name: 'theme-color', content: '#0a0a0a' },
        // Aperçu de partage (image 1200×630 dans public/og-image.png)
        { property: 'og:site_name', content: 'SONIKLAB' },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'SONIKLAB — Collectif techno à Saint-Nazaire' },
        { property: 'og:description', content: shareText },
        { property: 'og:image', content: `${siteUrl}og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'SONIKLAB — le son qui rassemble' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${siteUrl}og-image.png` },
      ],
      link: [
        // Icônes : vinyle SONIKLAB (public/favicon.svg, décliné en PNG/ICO)
        { rel: 'icon', type: 'image/svg+xml', href: `${baseURL}favicon.svg` },
        { rel: 'icon', type: 'image/x-icon', href: `${baseURL}favicon.ico`, sizes: '48x48' },
        { rel: 'apple-touch-icon', href: `${baseURL}apple-touch-icon.png` },
        { rel: 'manifest', href: `${baseURL}site.webmanifest` },
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
