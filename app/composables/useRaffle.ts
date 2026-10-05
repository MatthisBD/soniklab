import type { SupabaseClient } from '@supabase/supabase-js'
import { type SiteSettings, formatDate } from './useShowcase'

// ============================================================
//  Tombolas (page /tombola + admin → onglet « Tombola »).
//  Cf. supabase/tombola.sql. Rubrique privée tant que le réglage
//  « raffle_public » est vide. Pas de paiement sur le site : les
//  tickets se vendent en soirée ou via un formulaire HelloAsso, et
//  les admins saisissent les ventes → la base attribue les numéros.
// ============================================================

/** Une formule de prix : « 5 tickets pour 20 € ». */
export type RafflePack = { tickets: number; price: number }

export type RafflePrize = {
  id: string
  raffle_id: string
  name: string
  description: string | null
  value_eur: number | null
  photo_url: string | null
  position: number
  winner_ticket: number | null
  winner_entry_id: string | null
  winner_label: string | null
  drawn_at: string | null
}

export type Raffle = {
  id: string
  title: string
  description: string | null
  packs: RafflePack[]
  ticket_url: string | null
  /** date ISO « AAAA-MM-JJ » */
  draw_on: string | null
  draw_place: string | null
  max_tickets: number | null
  /** autorisation du maire (« authorization » est un mot réservé en SQL) */
  permit: string | null
  rules: string | null
  sales_open: boolean
  show_sold: boolean
  visible: boolean
  created_at: string
  prizes: RafflePrize[]
}

export const RAFFLE_CHANNELS = [
  { id: 'especes', label: 'Espèces' },
  { id: 'helloasso', label: 'HelloAsso' },
  { id: 'carte', label: 'Carte / TPE' },
  { id: 'virement', label: 'Virement' },
  { id: 'offert', label: 'Offert' },
  { id: 'autre', label: 'Autre' },
] as const

export type RaffleChannel = (typeof RAFFLE_CHANNELS)[number]['id']

export type RaffleEntry = {
  id: string
  raffle_id: string
  name: string
  email: string | null
  phone: string | null
  tickets: number
  amount: number
  channel: RaffleChannel
  first_ticket: number
  note: string | null
  created_at: string
}

/** Formules proposées par défaut à la création d'une tombola. */
export const DEFAULT_PACKS: RafflePack[] = [
  { tickets: 1, price: 5 },
  { tickets: 2, price: 10 },
  { tickets: 5, price: 20 },
]

export const channelLabel = (id: string) => RAFFLE_CHANNELS.find((c) => c.id === id)?.label ?? id

// ---------------- Calculs ----------------

/** Formules valides, triées du plus petit au plus gros paquet. */
export function cleanPacks(packs: unknown): RafflePack[] {
  if (!Array.isArray(packs)) return []
  return packs
    .map((p: any) => ({ tickets: Math.round(Number(p?.tickets)), price: Number(p?.price) }))
    .filter((p) => p.tickets >= 1 && Number.isFinite(p.price) && p.price >= 0)
    .sort((a, b) => a.tickets - b.tickets || a.price - b.price)
}

export const unitPrice = (p: RafflePack) => p.price / p.tickets

/** Prix du ticket « de base » : celui de la plus petite formule. */
export function basePrice(packs: RafflePack[]): number | null {
  const first = cleanPacks(packs)[0]
  return first ? unitPrice(first) : null
}

/** Réduction d'une formule par rapport au ticket de base, en % arrondi (0 si aucune). */
export function packDiscount(pack: RafflePack, packs: RafflePack[]): number {
  const base = basePrice(packs)
  if (!base) return 0
  const pct = Math.round((1 - unitPrice(pack) / base) * 100)
  return pct > 0 ? pct : 0
}

/** Montant correspondant à un nombre de tickets : la formule exacte si elle existe, sinon au prix de base. */
export function priceFor(tickets: number, packs: RafflePack[]): number {
  const exact = cleanPacks(packs).find((p) => p.tickets === tickets)
  if (exact) return exact.price
  const base = basePrice(packs) ?? 0
  return Math.round(tickets * base * 100) / 100
}

/** Prix affiché au public : « 20 € », « 4,50 € » (pas de « ,00 » inutile). */
export function formatPrice(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v)
}

/** 42 → « 0042 » (largeur fixe : au moins 4 chiffres). */
export function ticketNo(n: number, width = 4): string {
  return String(n).padStart(width, '0')
}

/** « 0012 → 0016 » ou « 0012 » pour une vente d'un seul ticket. */
export function ticketRange(e: Pick<RaffleEntry, 'first_ticket' | 'tickets'>): string {
  const last = e.first_ticket + e.tickets - 1
  return e.tickets > 1 ? `${ticketNo(e.first_ticket)} → ${ticketNo(last)}` : ticketNo(e.first_ticket)
}

export const hasTicket = (e: RaffleEntry, n: number) => n >= e.first_ticket && n < e.first_ticket + e.tickets

/** Valeur totale des lots (ceux dont la valeur est renseignée). */
export const prizesValue = (r: Raffle) => r.prizes.reduce((sum, p) => sum + Number(p.value_eur ?? 0), 0)

export const isDrawn = (r: Raffle) => r.prizes.length > 0 && r.prizes.every((p) => p.winner_ticket !== null)
export const anyDrawn = (r: Raffle) => r.prizes.some((p) => p.winner_ticket !== null)

/**
 * La tombola à mettre en avant (accueil, /liens) : publiée, ventes ouvertes,
 * pas encore tirée — la plus proche du tirage. null si la rubrique est privée.
 */
export function liveRaffle(list: Raffle[], s: SiteSettings): Raffle | null {
  if (!s.raffle_public?.trim()) return null
  return (
    list
      .filter((r) => r.visible && r.sales_open && !anyDrawn(r))
      .sort((a, b) => (a.draw_on ?? '9999').localeCompare(b.draw_on ?? '9999'))[0] ?? null
  )
}

/** Jours restants avant le tirage (0 = aujourd'hui, négatif = passé, null = pas de date). */
export function daysUntil(iso: string | null, todayIso: string): number | null {
  if (!iso) return null
  const [y1, m1, d1] = iso.split('-').map(Number)
  const [y2, m2, d2] = todayIso.split('-').map(Number)
  return Math.round((Date.UTC(y1!, m1! - 1, d1!) - Date.UTC(y2!, m2! - 1, d2!)) / 86_400_000)
}

/** « Lucas Martin » → « Lucas M. » (même règle que la fonction SQL raffle_short_name). */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[1]!.charAt(0).toUpperCase()}.` : (parts[0] ?? '')
}

// ---------------- Lecture ----------------

export async function fetchRaffles(supabase: SupabaseClient): Promise<Raffle[]> {
  const { data, error } = await supabase
    .from('raffles')
    .select('*, prizes:raffle_prizes(*)')
    .order('created_at', { ascending: false })
    .order('position', { referencedTable: 'raffle_prizes' })
  if (error) throw error
  return (data ?? []).map((r: any) => ({ ...r, packs: cleanPacks(r.packs), prizes: r.prizes ?? [] }))
}

/** Tickets vendus par tombola ({ id: nombre }), sans aucune donnée personnelle. */
export async function fetchRaffleStats(supabase: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('raffle_stats')
  if (error) throw error
  return Object.fromEntries((data ?? []).map((r: any) => [r.raffle_id, Number(r.sold)]))
}

/** Les tombolas publiées (même clé partout : /tombola, accueil, /liens). */
const rafflesFallback = (): Raffle[] => []
export function useRaffles() {
  return useShowcaseData('raffles', fetchRaffles, rafflesFallback)
}

const statsFallback = (): Record<string, number> => ({})
export function useRaffleStats() {
  return useShowcaseData('raffle-stats', fetchRaffleStats, statsFallback)
}

// ---------------- Admin ----------------

export async function fetchEntries(supabase: SupabaseClient, raffleId: string): Promise<RaffleEntry[]> {
  const { data, error } = await supabase
    .from('raffle_entries')
    .select('*')
    .eq('raffle_id', raffleId)
    .order('first_ticket', { ascending: false })
  if (error) throw error
  return (data ?? []).map((e: any) => ({ ...e, amount: Number(e.amount) }))
}

/** Tirage au sort côté serveur (hasard cryptographique, un ticket ne gagne qu'une fois). */
export async function drawPrize(supabase: SupabaseClient, prizeId: string): Promise<RafflePrize> {
  const { data, error } = await supabase.rpc('raffle_draw', { prize_id: prizeId })
  if (error) throw error
  return data as RafflePrize
}

/** Export des ventes (Excel FR : « ; » + BOM pour les accents). */
export function entriesCsv(entries: RaffleEntry[]): string {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Tickets', 'Nb tickets', 'Nom', 'Email', 'Téléphone', 'Montant (€)', 'Paiement', 'Date', 'Note']
  const rows = [...entries]
    .sort((a, b) => a.first_ticket - b.first_ticket)
    .map((e) => [
      ticketRange(e),
      e.tickets,
      e.name,
      e.email,
      e.phone,
      String(e.amount).replace('.', ','),
      channelLabel(e.channel),
      new Date(e.created_at).toLocaleString('fr-FR'),
      e.note,
    ])
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
}

/**
 * Règlement type, pré-rempli à partir de la fiche (à relire et compléter :
 * les « [à compléter] » sont à remplacer avant publication).
 */
export function rulesTemplate(r: Raffle, s: SiteSettings): string {
  const todo = '[à compléter]'
  const asso = s.legal_name?.trim() || 'SONIKLAB'
  const address = s.legal_address?.trim() || todo
  const packs = cleanPacks(r.packs)
    .map((p) => `${p.tickets} ticket${p.tickets > 1 ? 's' : ''} : ${formatPrice(p.price)}`)
    .join(' · ')
  const prizes = r.prizes.length
    ? r.prizes
        .map((p, i) => `  ${i + 1}. ${p.name}${p.value_eur ? ` (valeur indicative : ${formatPrice(Number(p.value_eur))})` : ''}`)
        .join('\n')
    : `  ${todo}`
  const when = r.draw_on ? formatDate(r.draw_on) : todo
  const where = r.draw_place?.trim() || todo
  const max = r.max_tickets ? `Nombre maximum de tickets : ${r.max_tickets}.` : ''
  const contact = s.contact_email?.trim() || todo
  const permit = r.permit?.trim().replace(/\.?$/, '.') || `Tombola autorisée par le maire de ${todo} (arrêté n° ${todo} du ${todo}).`

  return `Article 1 — Organisateur
L'association ${asso}, association loi 1901 dont le siège est situé ${address}, organise une tombola intitulée « ${r.title} » au profit de ses activités culturelles (organisation d'événements musicaux, matériel de son). ${permit}

Article 2 — Participation
La tombola est ouverte à toute personne majeure. Chaque ticket porte un numéro unique et donne une chance de gagner. Prix : ${packs || todo}. ${max}
Les tickets sont vendus lors des événements de l'association et, le cas échéant, en ligne via la plateforme indiquée sur soniklab.fr/tombola.

Article 3 — Lots
${prizes}
Les lots ne peuvent être ni échangés, ni remboursés, ni convertis en argent.

Article 4 — Tirage au sort
Le tirage aura lieu le ${when} — ${where}, en public. Il est réalisé par un générateur de hasard parmi l'ensemble des tickets vendus, lot par lot, dans l'ordre de la liste ci-dessus. Un même ticket ne peut gagner qu'un seul lot.

Article 5 — Résultats et remise des lots
Les numéros gagnants sont publiés sur soniklab.fr/tombola, accompagnés du prénom et de l'initiale du nom de chaque gagnant. Les gagnants sont contactés par l'association. Un lot non réclamé dans un délai de 30 jours après le tirage reste acquis à l'association.

Article 6 — Données personnelles
Le nom et les coordonnées des participants servent uniquement à la gestion de la tombola et à la remise des lots. Ils sont conservés au plus tard un an après le tirage, puis effacés. Droits d'accès, de rectification et d'effacement : ${contact}.

Article 7 — Acceptation
L'achat d'un ticket vaut acceptation du présent règlement.`
}
