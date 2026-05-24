// ============================================================
//  SONIKLAB — Liens de l'asso
//  👉 C'EST ICI QU'ON ÉDITE LES RACCOURCIS.
//  Remplace simplement les `url: '#'` par les vraies adresses.
//  Tu peux ajouter / retirer des liens librement.
// ============================================================

export type LinkItem = {
  label: string
  url: string
  note?: string
}

export type LinkGroup = {
  id: string
  /** Numéro affiché type piste de vinyle : "01", "02"... */
  track: string
  title: string
  tagline: string
  /** clé d'icône (voir AppIcon.vue) */
  icon: string
  links: LinkItem[]
}

export const linkGroups: LinkGroup[] = [
  {
    id: 'helloasso',
    track: '01',
    title: 'HelloAsso',
    tagline: 'Adhésions · billetterie · dons',
    icon: 'ticket',
    links: [
      { label: 'Adhérer à SONIKLAB', url: '#', note: 'devenir membre' },
      { label: 'Billetterie des soirées', url: '#', note: 'événements à venir' },
      { label: 'Faire un don', url: '#', note: 'soutenir le collectif' },
    ],
  },
  {
    id: 'gestion',
    track: '02',
    title: 'Gestion & To-Do',
    tagline: "L'organisation interne du collectif",
    icon: 'checklist',
    links: [
      { label: 'To-Do du collectif', url: '#', note: 'tâches en cours' },
      { label: 'Planning des dates', url: '#', note: 'qui joue quand' },
      { label: 'Compta / budget', url: '#' },
    ],
  },
  {
    id: 'reseaux',
    track: '03',
    title: 'Réseaux',
    tagline: 'On se suit, on partage, on poste',
    icon: 'broadcast',
    links: [
      { label: 'Instagram', url: '#' },
      { label: 'SoundCloud', url: '#', note: 'nos sets' },
      { label: 'Facebook', url: '#' },
      { label: 'YouTube', url: '#' },
    ],
  },
  {
    id: 'docs',
    track: '04',
    title: 'Docs partagés',
    tagline: 'Les fichiers, le drive, le matos',
    icon: 'folder',
    links: [
      { label: 'Google Drive', url: '#', note: 'tous les fichiers' },
      { label: 'Agenda partagé', url: '#' },
      { label: 'Inventaire matériel', url: '#', note: 'le matos du van' },
    ],
  },
]

/** Bandeau défilant — les mots-clés de l'asso */
export const tickerWords = [
  'TECHNO',
  'FÊTE DE LA MUSIQUE',
  'GUINGUETTES',
  'BARS',
  'SOUNDSYSTEM',
  'LIVE',
  'DJ SET',
  'OPEN AIR',
  'COLLECTIF',
]
