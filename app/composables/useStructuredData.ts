import type { SiteSettings, SonikEvent } from './useShowcase'

// ============================================================
//  Données structurées (schema.org, JSON-LD) pour Google :
//  « SONIKLAB est une organisation, voici son site, son logo, son
//  Instagram, son HelloAsso… et ses prochaines dates ».
//  Aide Google à relier le site aux réseaux de l'asso et peut
//  afficher les dates en résultat enrichi.
// ============================================================

export function buildJsonLd(site: string, s: SiteSettings, upcoming: SonikEvent[]) {
  const url = new URL('', site).href
  const name = s.legal_name?.trim() || 'SONIKLAB'

  const organization = {
    '@type': 'Organization',
    '@id': `${url}#organisation`,
    name,
    url,
    logo: new URL('soniklab-logo.jpeg', site).href,
    description: s.hero_text,
    // Ville du siège (mentions légales) : aide pour les recherches locales.
    address: { '@type': 'PostalAddress', addressLocality: 'Saint-Nazaire', addressCountry: 'FR' },
    areaServed: 'Saint-Nazaire',
    ...(s.contact_email.trim() && { email: s.contact_email.trim() }),
    sameAs: [s.instagram_url, s.helloasso_url, s.soundcloud_url].map((u) => u.trim()).filter(Boolean),
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${url}#site`,
    name,
    url,
    inLanguage: 'fr-FR',
    publisher: { '@id': organization['@id'] },
  }

  // Google exige un lieu pour un événement : on ne publie que les dates qui en ont un.
  const events = upcoming
    .filter((e) => e.venue?.trim() || e.city?.trim())
    .map((e) => ({
      '@type': 'MusicEvent',
      name: e.title,
      startDate: e.starts_on,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: e.venue?.trim() || e.city!.trim(),
        address: {
          '@type': 'PostalAddress',
          ...(e.city?.trim() && { addressLocality: e.city.trim() }),
          addressCountry: 'FR',
        },
      },
      ...(e.description?.trim() && { description: e.description.trim() }),
      ...(e.cover_url && { image: [e.cover_url] }),
      url: e.ticket_url || new URL('evenements/', site).href,
      organizer: { '@id': organization['@id'] },
    }))

  return { '@context': 'https://schema.org', '@graph': [organization, website, ...events] }
}

/** JSON sûr à injecter dans une balise <script> (pas de « </script> » possible). */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
