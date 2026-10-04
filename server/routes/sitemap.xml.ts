// Plan du site pour les moteurs de recherche (généré au build, cf. nitro.prerender).
// Pages publiques uniquement : le QG, le budget et l'admin sont en noindex.
const PAGES = ['', 'asso/', 'evenements/', 'collaborer/', 'liens/', 'mentions-legales/']

export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl as string
  const urls = PAGES.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
