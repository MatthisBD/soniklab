// ============================================================
//  SONIKLAB — Types des liens
//  ⚠️ Les données ne vivent PLUS ici : elles sont en base (Supabase)
//  et s'éditent depuis l'espace admin (/admin).
//  Ce fichier ne garde que les types partagés par les composants.
// ============================================================

export type LinkItem = {
  label: string
  url: string
  note?: string
}

export type LinkGroup = {
  /** slug utilisé comme ancre #helloasso */
  id: string
  /** Numéro affiché type piste de vinyle : "01", "02"... */
  track: string
  title: string
  tagline: string
  /** clé d'icône (voir AppIcon.vue) */
  icon: string
  links: LinkItem[]
}
