import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
//  Formulaire « Nous rejoindre » (cf. supabase/rejoindre.sql).
//  Envoi public, lecture réservée aux admins.
// ============================================================

export const JOIN_PROFILES = [
  { id: 'artiste', label: 'Artiste', hint: 'DJ, live, VJ…' },
  { id: 'benevole', label: 'Bénévole', hint: 'bar, accueil, montage…' },
  { id: 'technique', label: 'Son & technique', hint: 'sono, lumière, construction' },
  { id: 'communication', label: 'Com & visuels', hint: 'graphisme, photo, vidéo, réseaux' },
  { id: 'autre', label: 'Autre', hint: 'une idée, un lieu, une collab…' },
] as const

export type JoinProfile = (typeof JOIN_PROFILES)[number]['id']
export type JoinStatus = 'new' | 'contacted' | 'archived'

export type JoinRequest = {
  id: string
  name: string
  email: string
  phone: string | null
  profile: JoinProfile
  links: string | null
  message: string
  status: JoinStatus
  created_at: string
}

export type JoinDraft = Pick<JoinRequest, 'name' | 'email' | 'phone' | 'profile' | 'links' | 'message'>

export const profileLabel = (id: string) => JOIN_PROFILES.find((p) => p.id === id)?.label ?? id

/** « benevole,technique » → ['benevole', 'technique'] (réglage join_closed_profiles). */
export function parseClosedProfiles(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Envoi public. Pas de .select() : un visiteur n'a pas le droit de relire. */
export async function submitJoinRequest(supabase: SupabaseClient, d: JoinDraft) {
  const { error } = await supabase.from('join_requests').insert({
    name: d.name.trim(),
    email: d.email.trim(),
    phone: d.phone?.trim() || null,
    profile: d.profile,
    links: d.links?.trim() || null,
    message: d.message.trim(),
  })
  if (error) throw error
}

// ---------------- Admin ----------------

export async function fetchJoinRequests(supabase: SupabaseClient): Promise<JoinRequest[]> {
  const { data, error } = await supabase
    .from('join_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Nombre de demandes pas encore traitées (badge admin / QG). 0 en cas d'erreur. */
export async function countNewJoinRequests(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from('join_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
  return error ? 0 : (count ?? 0)
}
