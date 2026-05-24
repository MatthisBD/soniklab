// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

// Le site est servi sous /soniklab/ sur github.io.
// En dev (npm run dev) on garde la racine "/".
const baseURL = process.env.NODE_ENV === 'production' ? '/soniklab/' : '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Génération 100 % statique pour GitHub Pages
  // (crée .nojekyll + 404.html dans .output/public)
  nitro: { preset: 'github_pages' },

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
      title: 'SONIKLAB — Le QG',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            "SONIKLAB — collectif techno. Le hub de raccourcis de l'asso : HelloAsso, gestion, réseaux et docs partagés.",
        },
        { name: 'theme-color', content: '#0a0a0a' },
        { property: 'og:title', content: 'SONIKLAB — Le QG' },
        { property: 'og:description', content: "Le hub de l'asso techno SONIKLAB." },
        { property: 'og:image', content: `${baseURL}soniklab-logo.jpeg` },
        { property: 'og:type', content: 'website' },
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
