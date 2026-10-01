import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
//  Vitrine publique : artistes, événements, collaborateurs et
//  textes du site. Les types reprennent les colonnes de la base
//  telles quelles (cf. supabase/vitrine.sql).
// ============================================================

export type ExternalLink = { label: string; url: string }

export type Artist = {
  id: string
  name: string
  role: string | null
  style: string | null
  bio: string | null
  photo_url: string | null
  links: ExternalLink[]
  visible: boolean
  position: number
}

export type Collaborator = {
  id: string
  name: string
  kind: string | null
  city: string | null
  description: string | null
  logo_url: string | null
  url: string | null
  visible: boolean
  position: number
}

export type MediaKind = 'image' | 'video' | 'embed' | 'link'

export type EventMedia = {
  id: string
  event_id: string
  kind: MediaKind
  url: string
  caption: string | null
  position: number
}

export type SonikEvent = {
  id: string
  title: string
  /** date ISO « AAAA-MM-JJ » */
  starts_on: string
  hours: string | null
  venue: string | null
  city: string | null
  description: string | null
  cover_url: string | null
  ticket_url: string | null
  visible: boolean
  media: EventMedia[]
}

// ---------------- Textes du site ----------------
// Valeurs par défaut : le site reste propre tant que rien n'est saisi dans l'admin.
export const SETTINGS_DEFAULTS = {
  hero_text:
    "Association qui fait danser les bars, les guinguettes et les open airs. Des DJs, un sound system maison et l'envie de partager le son.",
  about_intro:
    'SONIKLAB est une association de passionnés de musique électronique. On organise, on joue et on fait vivre la techno là où on ne l’attend pas toujours.',
  about_body:
    "Né d'une bande de potes et d'un sound system construit à la main, le collectif s'est fait une place dans les bars, les guinguettes, les fêtes de la musique et les open airs.\n\nOn programme nos artistes, on monte nos propres événements et on accompagne les lieux qui veulent accueillir de la techno : son, line-up, scéno, ambiance.",
  about_pillars:
    'Soirées & open airs | Des événements pensés de A à Z : lieu, line-up, son, lumière.\nSound system | Un système son construit par nos soins, prêt à poser où il faut.\nArtistes | On fait jouer et on met en avant les DJs et lives du collectif.\nCollaborations | Bars, guinguettes, assos : on co-construit des soirées avec les lieux.',
  booking_text:
    "Un bar, une guinguette, un festival, une asso ? On vient avec les DJs, le son et l'énergie. Écris-nous.",
  contact_email: '',
  instagram_url: '',
  soundcloud_url: '',
  helloasso_url: '',
}

export type SettingKey = keyof typeof SETTINGS_DEFAULTS
export type SiteSettings = Record<SettingKey, string>

/** Paragraphes séparés par une ligne vide. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** Lignes « Titre | description » → piliers de l'asso. */
export function pillars(text: string): { title: string; text: string }[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split('|')
      return { title: title!.trim(), text: rest.join('|').trim() }
    })
}

// ---------------- Lecture (publique) ----------------

export async function fetchArtists(supabase: SupabaseClient): Promise<Artist[]> {
  const { data, error } = await supabase.from('artists').select('*').order('position')
  if (error) throw error
  return (data ?? []).map((a: any) => ({ ...a, links: Array.isArray(a.links) ? a.links : [] }))
}

export async function fetchCollaborators(supabase: SupabaseClient): Promise<Collaborator[]> {
  const { data, error } = await supabase.from('collaborators').select('*').order('position')
  if (error) throw error
  return data ?? []
}

export async function fetchEvents(supabase: SupabaseClient): Promise<SonikEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, media:event_media(*)')
    .order('starts_on', { ascending: false })
    .order('position', { referencedTable: 'event_media' })
  if (error) throw error
  return (data ?? []).map((e: any) => ({ ...e, media: e.media ?? [] }))
}

export async function fetchSettings(supabase: SupabaseClient): Promise<SiteSettings> {
  const { data, error } = await supabase.from('site_settings').select('key, value')
  if (error) throw error
  const out: SiteSettings = { ...SETTINGS_DEFAULTS }
  for (const row of data ?? []) {
    if (row.key in out && row.value.trim()) out[row.key as SettingKey] = row.value
  }
  return out
}

// ---------------- Dates ----------------

/** Aujourd'hui au format « AAAA-MM-JJ » (heure locale). */
export function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** « 2026-06-21 » → { day: '21', month: 'JUIN', year: '2026', weekday: 'sam.' } */
export function dateParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  return {
    day: String(d).padStart(2, '0'),
    month: date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase(),
    year: String(y),
    weekday: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
  }
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ---------------- Données de la vitrine (pages publiques) ----------------

/**
 * Charge une donnée de la vitrine : rendue au build (le contenu est dans le
 * HTML, bon pour le référencement), puis rechargée dans le navigateur pour
 * refléter tout de suite les modifs faites dans l'admin.
 * En cas d'erreur (table absente…), on garde la valeur par défaut.
 */
export function useShowcaseData<T>(key: string, fetcher: (s: SupabaseClient) => Promise<T>, fallback: () => T) {
  const supabase = useSupabase()
  const result = useAsyncData(key, () => fetcher(supabase).catch(() => fallback()), {
    default: fallback,
  })
  onMounted(() => result.refresh())
  return result.data as Ref<T>
}

/**
 * « Aujourd'hui », figé au build puis mis à jour dans le navigateur
 * (évite un décalage d'hydratation si un événement est passé entre-temps).
 */
export function useToday() {
  const today = useState('today', isoToday)
  onMounted(() => (today.value = isoToday()))
  return today
}

// ---------------- Écritures (admin) ----------------
// Les règles RLS refusent toute écriture si le compte n'est pas admin.

export function useShowcaseAdmin() {
  const supabase = useSupabase()

  async function insertRow<T>(table: string, values: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.from(table).insert(values).select('*').single()
    if (error) throw error
    return data as T
  }

  async function updateRow(table: string, id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from(table).update(patch).eq('id', id)
    if (error) throw error
  }

  async function deleteRow(table: string, id: string) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw error
  }

  /** Met à jour les positions de plusieurs lignes (réordonnancement). */
  async function reorder(table: string, rows: { id: string; position: number }[]) {
    for (const r of rows) await updateRow(table, r.id, { position: r.position })
  }

  /** Échange un élément avec son voisin (↑ / ↓) puis enregistre les positions. */
  async function move<T extends { id: string; position: number }>(table: string, list: T[], idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= list.length) return
    ;[list[idx], list[target]] = [list[target]!, list[idx]!]
    list.forEach((x, i) => (x.position = i))
    await reorder(table, list.map((x) => ({ id: x.id, position: x.position })))
  }

  async function saveSettings(settings: SiteSettings) {
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value.trim(),
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('site_settings').upsert(rows)
    if (error) throw error
  }

  return { insertRow, updateRow, deleteRow, reorder, move, saveSettings }
}

/** Champs vides → null (pour ne pas stocker de chaînes vides en base). */
export function nullify<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) out[k] = typeof v === 'string' && !v.trim() ? null : v
  return out as T
}
