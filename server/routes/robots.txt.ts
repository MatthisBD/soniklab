// robots.txt : tout est ouvert aux moteurs, et on leur indique le plan du site.
// (Le QG, le budget et l'admin portent déjà une balise « noindex ».)
export default defineEventHandler((event) => {
  const site = useRuntimeConfig().public.siteUrl as string
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap.xml', site).href}
`
})
