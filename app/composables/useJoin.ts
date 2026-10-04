import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
//  Formulaire « Booking & collab » (page /collaborer).
//  On ne recrute pas : on y demande un DJ pour une soirée ou on
//  propose une collaboration ponctuelle (cf. supabase/rejoindre.sql
//  + supabase/collaborer.sql). Envoi public, lecture admin.
// ============================================================

export const JOIN_PROFILES = [
  {
    id: 'booking',
    label: 'Booker un DJ',
    hint: 'un bar, une soirée, un festival, un événement privé…',
    linkLabel: "Le lieu ou l'événement (optionnel)",
    linkPlaceholder: "site, Insta, page de l'événement…",
    messagePlaceholder: 'La date, le lieu, le type de soirée, le nombre de personnes, ton budget…',
  },
  {
    id: 'artiste',
    label: 'Jouer avec nous',
    hint: 'DJ, live, VJ : une date ensemble, un plateau partagé, un B2B',
    linkLabel: 'Ton SoundCloud / tes sets',
    linkPlaceholder: 'https://soundcloud.com/…',
    messagePlaceholder: 'Qui tu es, ton style, le genre de date que tu imagines…',
  },
  {
    id: 'technique',
    label: 'Son & technique',
    hint: 'sono, lumière, matos, construction de caissons',
    linkLabel: 'Un lien (optionnel)',
    linkPlaceholder: 'site, Insta…',
    messagePlaceholder: 'Ce que tu proposes ou ce dont tu as besoin…',
  },
  {
    id: 'communication',
    label: 'Visuels & médias',
    hint: 'photo, vidéo, aftermovie, graphisme, flyers',
    linkLabel: 'Ton portfolio / Insta (optionnel)',
    linkPlaceholder: 'https://…',
    messagePlaceholder: 'Ton projet, ce que tu fais, tes idées…',
  },
  {
    id: 'autre',
    label: 'Autre projet',
    hint: 'une asso, un lieu, une idée un peu folle…',
    linkLabel: 'Un lien (optionnel)',
    linkPlaceholder: 'site, Insta…',
    messagePlaceholder: 'Raconte-nous ton projet…',
  },
  // Fermé par défaut (réglage join_closed_profiles), affiché grisé en dernier.
  {
    id: 'benevole',
    label: 'Bénévole',
    hint: 'bar, accueil, montage…',
    linkLabel: 'Un lien (optionnel)',
    linkPlaceholder: '',
    messagePlaceholder: 'Tes dispos, ce que tu aimes faire…',
  },
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
  const row = {
    name: d.name.trim(),
    email: d.email.trim(),
    phone: d.phone?.trim() || null,
    profile: d.profile as string,
    links: d.links?.trim() || null,
    message: d.message.trim(),
  }
  let { error } = await supabase.from('join_requests').insert(row)
  // Sécurité : si la base ne connaît pas encore ce type (supabase/collaborer.sql
  // pas exécuté → « check_violation »), on l'enregistre en « autre » avec le
  // type en tête du message, pour ne jamais perdre une demande.
  if (error?.code === '23514' && row.profile !== 'autre') {
    ;({ error } = await supabase.from('join_requests').insert({
      ...row,
      profile: 'autre',
      message: `[${profileLabel(row.profile)}] ${row.message}`,
    }))
  }
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
