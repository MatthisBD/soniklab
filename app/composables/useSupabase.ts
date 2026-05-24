import type { SupabaseClient } from '@supabase/supabase-js'

/** Accès au client Supabase partagé (fourni par le plugin). */
export function useSupabase(): SupabaseClient {
  return useNuxtApp().$supabase as SupabaseClient
}

// ---- Types tels que consommés par les composants d'affichage ----
export type LinkView = {
  id: string
  label: string
  url: string
  note?: string
  position: number
}

export type LinkGroupView = {
  /** id de base (uuid) — utilisé pour l'édition admin */
  dbId: string
  /** slug — utilisé comme ancre #helloasso et clé d'affichage */
  id: string
  track: string
  title: string
  tagline: string
  icon: string
  position: number
  links: LinkView[]
}

/** Récupère les groupes et leurs liens, triés par position. */
export async function fetchLinkGroups(supabase: SupabaseClient): Promise<LinkGroupView[]> {
  const { data, error } = await supabase
    .from('link_groups')
    .select('id, slug, track, title, tagline, icon, position, links(id, label, url, note, position)')
    .order('position')
    .order('position', { referencedTable: 'links' })

  if (error) throw error

  return (data ?? []).map((g: any) => ({
    dbId: g.id,
    id: g.slug,
    track: g.track,
    title: g.title,
    tagline: g.tagline,
    icon: g.icon,
    position: g.position,
    links: (g.links ?? []).map((l: any) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      note: l.note ?? undefined,
      position: l.position,
    })),
  }))
}

/** Récupère les mots du bandeau défilant, triés. */
export async function fetchTickerWords(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('ticker_words')
    .select('word, position')
    .order('position')

  if (error) throw error
  return (data ?? []).map((w: any) => w.word)
}
