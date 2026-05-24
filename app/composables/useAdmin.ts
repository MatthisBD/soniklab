import type { LinkGroupView, LinkView } from './useSupabase'

/**
 * Opérations d'écriture réservées aux admins.
 * Les règles RLS côté base refusent toute écriture si le compte n'est pas admin.
 */
export function useAdmin() {
  const supabase = useSupabase()

  // ---------------- Groupes ----------------
  async function saveGroup(g: LinkGroupView) {
    const { error } = await supabase
      .from('link_groups')
      .update({
        slug: g.id,
        track: g.track,
        title: g.title,
        tagline: g.tagline,
        icon: g.icon,
        position: g.position,
      })
      .eq('id', g.dbId)
    if (error) throw error
  }

  async function addGroup(position: number) {
    const { data, error } = await supabase
      .from('link_groups')
      .insert({
        slug: `groupe-${Date.now()}`,
        title: 'Nouveau groupe',
        track: String(position + 1).padStart(2, '0'),
        tagline: '',
        icon: 'folder',
        position,
      })
      .select('id, slug, track, title, tagline, icon, position')
      .single()
    if (error) throw error
    return data
  }

  async function deleteGroup(dbId: string) {
    // Les liens du groupe sont supprimés en cascade (FK on delete cascade).
    const { error } = await supabase.from('link_groups').delete().eq('id', dbId)
    if (error) throw error
  }

  // ---------------- Liens ----------------
  async function saveLink(l: LinkView) {
    const { error } = await supabase
      .from('links')
      .update({
        label: l.label,
        url: l.url,
        note: l.note?.trim() ? l.note.trim() : null,
        position: l.position,
      })
      .eq('id', l.id)
    if (error) throw error
  }

  async function addLink(groupDbId: string, position: number) {
    const { data, error } = await supabase
      .from('links')
      .insert({ group_id: groupDbId, label: 'Nouveau lien', url: '#', position })
      .select('id, label, url, note, position')
      .single()
    if (error) throw error
    return data
  }

  async function deleteLink(id: string) {
    const { error } = await supabase.from('links').delete().eq('id', id)
    if (error) throw error
  }

  /** Met à jour les positions de plusieurs liens d'un coup (réordonnancement). */
  async function reorderLinks(links: { id: string; position: number }[]) {
    for (const l of links) {
      const { error } = await supabase.from('links').update({ position: l.position }).eq('id', l.id)
      if (error) throw error
    }
  }

  // ---------------- Bandeau défilant ----------------
  async function saveTicker(words: string[]) {
    // Remplacement complet : on vide puis on réinsère dans l'ordre.
    const { error: delErr } = await supabase
      .from('ticker_words')
      .delete()
      .gte('position', -1) // condition toujours vraie → supprime tout
    if (delErr) throw delErr

    const rows = words
      .map((w) => w.trim())
      .filter(Boolean)
      .map((word, position) => ({ word, position }))

    if (rows.length) {
      const { error: insErr } = await supabase.from('ticker_words').insert(rows)
      if (insErr) throw insErr
    }
  }

  return {
    saveGroup,
    addGroup,
    deleteGroup,
    saveLink,
    addLink,
    deleteLink,
    reorderLinks,
    saveTicker,
  }
}
