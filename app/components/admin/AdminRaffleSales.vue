<script setup lang="ts">
import {
  type Raffle,
  type RaffleChannel,
  type RaffleEntry,
  type RafflePrize,
  RAFFLE_CHANNELS,
  anyDrawn,
  channelLabel,
  entriesCsv,
  fetchEntries,
  formatPrice,
  hasTicket,
  priceFor,
  shortName,
  ticketNo,
  ticketRange,
} from '~/composables/useRaffle'
import { formatEur } from '~/composables/useBudget'

// Ventes de tickets + tirage au sort d'une tombola (admin).
// Les tickets se vendent en soirée (espèces, carte) ou en ligne (HelloAsso) :
// chaque vente saisie ici reçoit des numéros attribués par la base.
const props = defineProps<{ raffle: Raffle }>()
const emit = defineEmits<{ drawn: [] }>()

const supabase = useSupabase()
const db = useShowcaseAdmin()
const { run, flash } = useFlash()

const entries = ref<RaffleEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  await run(async () => (entries.value = await fetchEntries(supabase, props.raffle.id)))
  loading.value = false
})

// ---------------- Totaux ----------------
const sold = computed(() => entries.value.reduce((n, e) => n + e.tickets, 0))
const revenue = computed(() => entries.value.reduce((n, e) => n + Number(e.amount), 0))
const byChannel = computed(() =>
  RAFFLE_CHANNELS.map((c) => {
    const list = entries.value.filter((e) => e.channel === c.id)
    return { ...c, tickets: list.reduce((n, e) => n + e.tickets, 0), amount: list.reduce((n, e) => n + Number(e.amount), 0) }
  }).filter((c) => c.tickets),
)
const remaining = computed(() => (props.raffle.max_tickets ? props.raffle.max_tickets - sold.value : null))
const lastTicket = computed(() => entries.value.reduce((m, e) => Math.max(m, e.first_ticket + e.tickets - 1), 0))
const width = computed(() => Math.max(4, String(lastTicket.value).length))
const drawn = computed(() => anyDrawn(props.raffle))

// ---------------- Nouvelle vente ----------------
const packs = computed(() => props.raffle.packs)
const pick = ref<number | 'custom'>(0) // index de la formule, ou « autre »
const form = reactive({
  name: '',
  email: '',
  phone: '',
  tickets: 1,
  amount: 0,
  channel: 'especes' as RaffleChannel,
  note: '',
})

// La formule choisie remplit le nombre de tickets et le montant (modifiable en « autre »).
watch(
  [pick, packs],
  () => {
    if (pick.value === 'custom') return
    const p = packs.value[pick.value] ?? packs.value[0]
    if (p) {
      form.tickets = p.tickets
      form.amount = form.channel === 'offert' ? 0 : p.price
    }
  },
  { immediate: true },
)
watch(
  () => form.channel,
  (c) => (form.amount = c === 'offert' ? 0 : priceFor(form.tickets, packs.value)),
)
function onCustomTickets() {
  form.tickets = Math.max(1, Math.round(Number(form.tickets) || 1))
  if (form.channel !== 'offert') form.amount = priceFor(form.tickets, packs.value)
}

const last = ref<RaffleEntry | null>(null)
const saving = ref(false)

async function addSale() {
  if (!form.name.trim()) {
    flash('Indique au moins un nom (pour prévenir la personne si elle gagne).')
    return
  }
  saving.value = true
  const ok = await run(async () => {
    const row = await db.insertRow<RaffleEntry>('raffle_entries', {
      raffle_id: props.raffle.id,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      tickets: form.tickets,
      amount: Number(form.amount) || 0,
      channel: form.channel,
      note: form.note.trim() || null,
    })
    row.amount = Number(row.amount)
    entries.value.unshift(row)
    last.value = row
  })
  saving.value = false
  if (ok && last.value) {
    flash(`Tickets n° ${ticketRange(last.value)} pour ${last.value.name}.`)
    // On garde formule + paiement : pratique pour enchaîner les ventes en soirée.
    Object.assign(form, { name: '', email: '', phone: '', note: '' })
  }
}

async function removeSale(e: RaffleEntry) {
  if (props.raffle.prizes.some((p) => p.winner_ticket !== null && hasTicket(e, p.winner_ticket))) {
    flash('Cette vente contient un ticket gagnant : annule d’abord le tirage du lot.')
    return
  }
  if (!confirm(`Supprimer la vente de « ${e.name} » (tickets ${ticketRange(e)}) ? Ces numéros ne seront pas réattribués.`)) return
  const ok = await run(() => db.deleteRow('raffle_entries', e.id), 'Vente supprimée.')
  if (ok) {
    entries.value = entries.value.filter((x) => x.id !== e.id)
    if (last.value?.id === e.id) last.value = null
  }
}

// ---------------- Recherche ----------------
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return entries.value
  const n = /^\d+$/.test(q) ? Number(q) : null
  return entries.value.filter(
    (e) =>
      (n !== null && hasTicket(e, n)) ||
      [e.name, e.email, e.phone, e.note].some((v) => v?.toLowerCase().includes(q)),
  )
})

const winningTickets = computed(
  () => new Set(props.raffle.prizes.map((p) => p.winner_ticket).filter((t): t is number => t !== null)),
)
const isWinner = (e: RaffleEntry) => [...winningTickets.value].some((t) => hasTicket(e, t))

// ---------------- Export & RGPD ----------------
function exportCsv() {
  const blob = new Blob([entriesCsv(entries.value)], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  const slug = props.raffle.title.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  a.download = `tombola-${slug || 'ventes'}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function anonymize() {
  if (!confirm('Effacer les noms et coordonnées de tous les participants ? Les numéros, montants et gagnants affichés restent. Irréversible.')) return
  const ok = await run(async () => {
    const { error } = await supabase
      .from('raffle_entries')
      .update({ name: 'Anonyme', email: null, phone: null, note: null })
      .eq('raffle_id', props.raffle.id)
    if (error) throw error
  }, 'Participants anonymisés.')
  if (ok) entries.value.forEach((e) => Object.assign(e, { name: 'Anonyme', email: null, phone: null, note: null }))
}

// ---------------- Tirage ----------------
/** Tickets encore en jeu (vendus, et pas déjà gagnants). */
const pool = computed(() => sold.value - winningTickets.value.size)
const undrawn = computed(() => props.raffle.prizes.filter((p) => p.winner_ticket === null))
const winnerOf = (p: RafflePrize) =>
  p.winner_ticket === null ? null : (entries.value.find((e) => hasTicket(e, p.winner_ticket!)) ?? null)

const stage = ref<RafflePrize | null>(null) // lot affiché sur l'écran de tirage
const stageRank = computed(() => (stage.value ? props.raffle.prizes.indexOf(stage.value) + 1 : 0))

function openStage(p?: RafflePrize) {
  if (!entries.value.length) {
    flash('Aucun ticket vendu : rien à tirer.')
    return
  }
  stage.value = p ?? undrawn.value[0] ?? null
}

function onDrawn(won: RafflePrize) {
  const p = props.raffle.prizes.find((x) => x.id === won.id)
  if (p) Object.assign(p, won)
  emit('drawn') // le serveur a aussi fermé les ventes
}

// Tirage « à la main » (ex. tickets papier tirés dans un chapeau).
const manual = reactive<Record<string, string>>({})
async function setWinner(p: RafflePrize) {
  const n = Number(manual[p.id])
  const e = entries.value.find((x) => hasTicket(x, n))
  if (!Number.isInteger(n) || !e) {
    flash(`Le ticket n° ${manual[p.id] || '?'} n'a pas été vendu.`)
    return
  }
  if (winningTickets.value.has(n)) {
    flash(`Le ticket n° ${ticketNo(n)} a déjà gagné un lot.`)
    return
  }
  const patch = { winner_ticket: n, winner_entry_id: e.id, winner_label: shortName(e.name), drawn_at: new Date().toISOString() }
  const ok = await run(async () => {
    await db.updateRow('raffle_prizes', p.id, patch)
    await db.updateRow('raffles', props.raffle.id, { sales_open: false })
  }, `Lot « ${p.name} » : ticket n° ${ticketNo(n)} (${patch.winner_label}).`)
  if (ok) {
    Object.assign(p, patch)
    manual[p.id] = ''
    emit('drawn')
  }
}

async function undraw(p: RafflePrize) {
  if (!confirm(`Annuler le tirage du lot « ${p.name} » ? Le ticket n° ${ticketNo(p.winner_ticket!)} redevient « en jeu ».`)) return
  const patch = { winner_ticket: null, winner_entry_id: null, winner_label: null, drawn_at: null }
  const ok = await run(() => db.updateRow('raffle_prizes', p.id, patch), 'Tirage annulé.')
  if (ok) Object.assign(p, patch)
}

function saveLabel(p: RafflePrize) {
  return run(() => db.updateRow('raffle_prizes', p.id, { winner_label: p.winner_label?.trim() || null }), 'Nom affiché enregistré.')
}

const when = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
</script>

<template>
  <div class="space-y-6">
    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>

    <template v-else>
      <!-- ============ TOTAUX ============ -->
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="border border-line bg-void p-4">
          <p class="adm-label">Tickets vendus</p>
          <p class="font-display text-4xl leading-none">
            {{ sold }}<span v-if="raffle.max_tickets" class="text-xl text-ash"> / {{ raffle.max_tickets }}</span>
          </p>
          <p v-if="remaining !== null" class="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-ash">
            {{ remaining > 0 ? `${remaining} restant${remaining > 1 ? 's' : ''}` : 'complet' }}
          </p>
        </div>
        <div class="border border-line bg-void p-4">
          <p class="adm-label">Recettes</p>
          <p class="font-display text-4xl leading-none">{{ formatEur(revenue) }}</p>
          <p class="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-ash">
            {{ entries.length }} vente{{ entries.length > 1 ? 's' : '' }}
          </p>
        </div>
        <div class="border border-line bg-void p-4">
          <p class="adm-label">Par moyen de paiement</p>
          <p v-if="!byChannel.length" class="font-mono text-xs text-ash">—</p>
          <p v-for="c in byChannel" :key="c.id" class="flex justify-between gap-2 font-mono text-xs text-smoke">
            <span>{{ c.label }} · {{ c.tickets }} t.</span><span>{{ formatEur(c.amount) }}</span>
          </p>
        </div>
      </div>

      <!-- ============ NOUVELLE VENTE ============ -->
      <form v-if="!drawn" class="space-y-4 border border-line bg-void p-4" @submit.prevent="addSale">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="font-display text-xl uppercase tracking-wide">Nouvelle vente</h3>
          <span v-if="!raffle.sales_open" class="font-mono text-[0.65rem] uppercase tracking-widest text-ash">
            ventes closes sur le site — tu peux encore saisir une vente faite avant
          </span>
        </div>

        <fieldset>
          <legend class="adm-label">Formule</legend>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(p, i) in packs"
              :key="i"
              type="button"
              class="border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
              :class="pick === i ? 'border-bone bg-bone text-void' : 'border-line text-smoke hover:border-bone'"
              @click="pick = i"
            >
              {{ p.tickets }} ticket{{ p.tickets > 1 ? 's' : '' }} · {{ formatPrice(p.price) }}
            </button>
            <button
              type="button"
              class="border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
              :class="pick === 'custom' ? 'border-bone bg-bone text-void' : 'border-line text-smoke hover:border-bone'"
              @click="pick = 'custom'"
            >
              Autre
            </button>
          </div>
        </fieldset>

        <div v-if="pick === 'custom'" class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="adm-label">Nombre de tickets</span>
            <input v-model.number="form.tickets" type="number" min="1" max="1000" class="adm-input" @change="onCustomTickets" />
          </label>
          <label class="block">
            <span class="adm-label">Montant payé (€)</span>
            <input v-model.number="form.amount" type="number" min="0" step="0.01" class="adm-input" />
          </label>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="adm-label">Nom *</span>
            <input v-model="form.name" maxlength="120" placeholder="Prénom Nom" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Email</span>
            <input v-model="form.email" type="email" maxlength="200" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Téléphone</span>
            <input v-model="form.phone" type="tel" maxlength="40" class="adm-input" />
          </label>
        </div>

        <fieldset>
          <legend class="adm-label">Paiement</legend>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="c in RAFFLE_CHANNELS"
              :key="c.id"
              class="cursor-pointer border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
              :class="form.channel === c.id ? 'border-bone bg-bone text-void' : 'border-line text-smoke hover:border-bone'"
            >
              <input v-model="form.channel" type="radio" :value="c.id" class="sr-only" />
              {{ c.label }}
            </label>
          </div>
        </fieldset>

        <label class="block">
          <span class="adm-label">Note (optionnel)</span>
          <input v-model="form.note" maxlength="500" placeholder="ex. vendu par Matthis à la Guinguette, n° de commande HelloAsso…" class="adm-input" />
        </label>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            :disabled="saving"
            class="inline-flex items-center gap-2 bg-bone px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {{ saving ? '…' : `Enregistrer · ${form.tickets} ticket${form.tickets > 1 ? 's' : ''} · ${formatEur(Number(form.amount) || 0)}` }}
          </button>
          <span class="font-mono text-[0.65rem] text-ash">Les numéros sont attribués automatiquement, à la suite.</span>
        </div>

        <!-- dernière vente : les numéros à noter sur les tickets papier / à donner à la personne -->
        <p v-if="last" class="border border-bone px-4 py-3 font-mono text-sm">
          ✓ {{ last.name }} → ticket{{ last.tickets > 1 ? 's' : '' }}
          <strong class="text-lg">n° {{ ticketRange(last) }}</strong>
        </p>
      </form>
      <p v-else class="border border-line bg-void px-4 py-3 font-mono text-xs text-ash">
        Le tirage a eu lieu : les ventes sont figées (annule les tirages pour en ajouter).
      </p>

      <!-- ============ TIRAGE ============ -->
      <div class="space-y-3 border border-line bg-void p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-display text-xl uppercase tracking-wide">Tirage au sort</h3>
            <p class="font-mono text-[0.65rem] text-ash">
              Hasard tiré par le serveur parmi les {{ pool }} ticket{{ pool > 1 ? 's' : '' }} en jeu · un ticket ne gagne
              qu'un lot · à faire en public (soirée, live Insta). Tirer un lot ferme les ventes.
            </p>
          </div>
          <button v-if="undrawn.length && entries.length" class="adm-btn border-bone text-bone" @click="openStage()">
            🎲 Écran de tirage
          </button>
        </div>

        <p v-if="!raffle.prizes.length" class="font-mono text-xs text-ash">Ajoute d'abord les lots (onglet « Fiche & lots »).</p>

        <div
          v-for="(p, i) in raffle.prizes"
          :key="p.id"
          class="flex flex-wrap items-center gap-3 border-t border-line pt-3"
        >
          <span class="font-mono text-xs text-ash">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="min-w-0 flex-1 truncate font-display text-lg uppercase tracking-wide">{{ p.name }}</span>

          <template v-if="p.winner_ticket !== null">
            <span class="bg-bone px-2 py-0.5 font-mono text-sm text-void">n° {{ ticketNo(p.winner_ticket) }}</span>
            <input
              v-model="p.winner_label"
              title="Nom affiché publiquement"
              placeholder="nom affiché (vide = numéro seul)"
              class="w-40 border border-line bg-void px-2 py-1 font-mono text-xs outline-none focus:border-bone"
              @change="saveLabel(p)"
            />
            <span v-if="winnerOf(p)" class="flex flex-wrap gap-x-3 font-mono text-[0.7rem] text-smoke">
              <span>{{ winnerOf(p)!.name }}</span>
              <CopyText v-if="winnerOf(p)!.email" :text="winnerOf(p)!.email!" class="hover:text-bone" />
              <CopyText v-if="winnerOf(p)!.phone" :text="winnerOf(p)!.phone!" class="hover:text-bone" />
            </span>
            <button class="adm-btn-danger" @click="undraw(p)">Annuler</button>
          </template>

          <template v-else>
            <button class="adm-btn" :disabled="!entries.length" @click="openStage(p)">🎲 Tirer</button>
            <form class="flex gap-1" @submit.prevent="setWinner(p)">
              <input
                v-model="manual[p.id]"
                inputmode="numeric"
                placeholder="n° tiré à la main"
                class="w-36 border border-line bg-void px-2 py-1 font-mono text-xs outline-none focus:border-bone"
              />
              <button type="submit" class="adm-btn px-2" :disabled="!manual[p.id]">OK</button>
            </form>
          </template>
        </div>
      </div>

      <!-- ============ LISTE DES VENTES ============ -->
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h3 class="font-display text-xl uppercase tracking-wide">Ventes</h3>
          <div class="flex flex-wrap gap-2">
            <input
              v-model="query"
              placeholder="nom, email, ou n° de ticket"
              class="w-56 border border-line bg-void px-3 py-1.5 font-mono text-xs outline-none focus:border-bone"
            />
            <button class="adm-btn" :disabled="!entries.length" @click="exportCsv">Exporter (CSV)</button>
            <button v-if="drawn" class="adm-btn" :disabled="!entries.length" @click="anonymize">Anonymiser (RGPD)</button>
          </div>
        </div>

        <p v-if="!entries.length" class="font-mono text-sm text-ash">Aucune vente pour l'instant.</p>
        <p v-else-if="!shown.length" class="font-mono text-sm text-ash">Aucun résultat.</p>

        <div v-if="shown.length" class="divide-y divide-line border border-line">
          <div
            v-for="e in shown"
            :key="e.id"
            class="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2"
            :class="isWinner(e) && 'bg-bone/10'"
          >
            <span class="w-32 shrink-0 font-mono text-sm text-bone">
              <span v-if="isWinner(e)" title="ticket gagnant">★ </span>{{ ticketRange(e) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm">{{ e.name }}</span>
              <span class="flex flex-wrap gap-x-3 font-mono text-[0.65rem] text-ash">
                <CopyText v-if="e.email" :text="e.email" class="hover:text-bone" />
                <CopyText v-if="e.phone" :text="e.phone" class="hover:text-bone" />
                <span v-if="e.note" class="italic">{{ e.note }}</span>
              </span>
            </span>
            <span class="shrink-0 font-mono text-xs text-smoke">
              {{ e.tickets }} t. · {{ formatEur(e.amount) }} · {{ channelLabel(e.channel) }}
            </span>
            <span class="shrink-0 font-mono text-[0.65rem] text-ash">{{ when(e.created_at) }}</span>
            <button title="Supprimer la vente" class="shrink-0 px-1 text-xs text-red-400 hover:text-red-300" @click="removeSale(e)">✕</button>
          </div>
        </div>
      </div>
    </template>

    <RaffleDraw
      :raffle-title="raffle.title"
      :prize="stage"
      :rank="stageRank"
      :pool="pool"
      :width="width"
      :has-next="undrawn.length > 0"
      @drawn="onDrawn"
      @next="openStage()"
      @close="stage = null"
    />
  </div>
</template>
