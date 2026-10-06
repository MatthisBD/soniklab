import { type SiteSettings, type SonikEvent, entryLabel, isFreeEntry } from './useShowcase'

// ============================================================
//  Données structurées (schema.org, JSON-LD) pour Google :
//  « SONIKLAB est une organisation, voici son site, son logo, son
//  Instagram, son HelloAsso… et ses prochaines dates ».
//  Aide Google à relier le site aux réseaux de l'asso et peut
//  afficher les dates en résultat enrichi.
// ============================================================

const pad = (n: number) => String(n).padStart(2, '0')

/** « 2026-10-16 » + 1 jour → « 2026-10-17 » (soirée qui finit après minuit). */
function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d! + 1)).toISOString().slice(0, 10)
}

/** Décalage horaire de Paris ce jour-là (« +02:00 » l'été, « +01:00 » l'hiver). */
function parisOffset(iso: string): string {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
      .formatToParts(new Date(`${iso}T12:00:00Z`))
      .find((p) => p.type === 'timeZoneName')?.value
    return name?.match(/[+-]\d{2}:\d{2}/)?.[0] ?? ''
  } catch {
    return ''
  }
}

/**
 * Horaires saisis librement dans l'admin (« 21h30 -> 1h30 », « 16H - 00H »,
 * « 22:00-02:00 »…) → heures de début et de fin, si on les reconnaît.
 */
function parseHours(hours: string | null): { start?: [number, number]; end?: [number, number] } {
  const times = [...(hours ?? '').matchAll(/(\d{1,2})\s*[hH:]\s*(\d{2})?/g)]
    .map((m) => [Number(m[1]), Number(m[2] ?? 0)] as [number, number])
    .filter(([h, min]) => h <= 23 && min <= 59)
  return { start: times[0], end: times[1] }
}

/** Dates de début / fin au format attendu par Google (ISO 8601, heure de Paris). */
function eventDates(e: SonikEvent): { startDate: string; endDate?: string } {
  const { start, end } = parseHours(e.hours)
  // Pas d'horaire lisible : événement « à la journée ».
  if (!start) return { startDate: e.starts_on, endDate: e.starts_on }
  const at = (day: string, [h, m]: [number, number]) => `${day}T${pad(h)}:${pad(m)}${parisOffset(day)}`
  const startDate = at(e.starts_on, start)
  if (!end) return { startDate }
  // Fin plus tôt que le début (« 21h30 -> 1h30 ») : ça se termine le lendemain.
  const endDay = end[0] * 60 + end[1] <= start[0] * 60 + start[1] ? nextDay(e.starts_on) : e.starts_on
  return { startDate, endDate: at(endDay, end) }
}

/** « de 21h30 à 1h30 » (repris des horaires saisis), pour la description de secours. */
function hoursText(e: SonikEvent): string {
  const { start, end } = parseHours(e.hours)
  const t = ([h, m]: [number, number]) => `${h}h${m ? pad(m) : ''}`
  if (start && end) return `de ${t(start)} à ${t(end)}`
  if (start) return `à partir de ${t(start)}`
  return ''
}

/** Prix d'entrée en euros (0 si gratuit), ou null si on ne sait pas le lire (« Prix libre »). */
function entryPrice(entry: string | null | undefined): number | null {
  if (!entry?.trim()) return null
  if (isFreeEntry(entry)) return 0
  const n = entry.match(/\d+(?:[.,]\d+)?/)?.[0]
  return n ? Number(n.replace(',', '.')) : null
}

export function buildJsonLd(site: string, s: SiteSettings, upcoming: SonikEvent[]) {
  const url = new URL('', site).href
  const name = s.legal_name?.trim() || 'SONIKLAB'
  const fallbackImage = new URL('og-image.png', site).href

  const organization = {
    '@type': 'Organization',
    '@id': `${url}#organisation`,
    name,
    url,
    logo: new URL('soniklab-logo.jpeg', site).href,
    description: s.hero_text,
    // Ville du siège (mentions légales) : aide pour les recherches locales.
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Saint-Nazaire',
      postalCode: '44600',
      addressRegion: 'Pays de la Loire',
      addressCountry: 'FR',
    },
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

  // Les soirées sont jouées par les DJs du collectif : SONIKLAB est l'artiste
  // à l'affiche (tant qu'on ne saisit pas de line-up par date).
  const collective = { '@type': 'PerformingGroup', name, url }

  // Google exige un lieu pour un événement : on ne publie que les dates qui en ont un.
  const events = upcoming
    .filter((e) => e.venue?.trim() || e.city?.trim())
    .map((e) => {
      const venue = e.venue?.trim()
      const city = e.city?.trim()
      const place = [venue, city].filter(Boolean).join(', ')
      // Sans texte saisi dans l'admin, on résume ce qu'affiche la carte de l'événement.
      const description =
        e.description?.trim() ||
        [`${e.title} avec le collectif techno ${name}`, place, hoursText(e), entryLabel(e.entry).toLowerCase()]
          .filter(Boolean)
          .join(' — ') + '.'
      const price = entryPrice(e.entry)
      const eventsPage = new URL('evenements/', site).href
      // Affiche, puis photos de la galerie ; à défaut, l'image de partage du site.
      const images = [e.cover_url, ...e.media.filter((m) => m.kind === 'image').map((m) => m.url)].filter(
        (u): u is string => !!u,
      )
      return {
        '@type': 'MusicEvent',
        name: e.title,
        ...eventDates(e),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: venue || city!,
          address: {
            '@type': 'PostalAddress',
            ...(city && { addressLocality: city }),
            addressCountry: 'FR',
          },
        },
        description,
        image: images.length ? images.slice(0, 3) : [fallbackImage],
        performer: collective,
        url: e.ticket_url || eventsPage,
        // Prix d'entrée (admin → champ « Entrée ») et/ou billetterie : Google
        // peut afficher « Gratuit », le prix ou le lien « Billets ».
        ...(price === 0 && { isAccessibleForFree: true }),
        ...((price !== null || e.ticket_url) && {
          offers: {
            '@type': 'Offer',
            url: e.ticket_url || eventsPage,
            ...(price !== null && { price, priceCurrency: 'EUR' }),
            availability: 'https://schema.org/InStock',
            ...(e.created_at && { validFrom: e.created_at }),
          },
        }),
        organizer: { '@type': 'Organization', name, url },
      }
    })

  return { '@context': 'https://schema.org', '@graph': [organization, website, ...events] }
}

/** JSON sûr à injecter dans une balise <script> (pas de « </script> » possible). */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, '\u003c')
}
