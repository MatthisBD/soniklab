<script setup lang="ts">
import {
  type Raffle,
  type RafflePrize,
  DEFAULT_PACKS,
  anyDrawn,
  cleanPacks,
  fetchRaffles,
  isDrawn,
  packDiscount,
  rulesTemplate,
  unitPrice,
} from '~/composables/useRaffle'
import { type SiteSettings, SETTINGS_DEFAULTS, fetchSettings, formatDate, nullify } from '~/composables/useShowcase'
import { formatEur } from '~/composables/useBudget'

// Tombolas : la rubrique reste privée (admins seulement) tant qu'on ne la
// rend pas publique ici. Une tombola = une fiche (texte, formules de prix,
// lots, règlement) + ses ventes et son tirage (AdminRaffleSales).
const supabase = useSupabase()
const db = useShowcaseAdmin()
const media = useMedia()
const { run, flash } = useFlash()

const list = ref<Raffle[]>([])
const open = ref<string | null>(null)
const SECTIONS = [
  { id: 'fiche', label: 'Fiche & lots' },
  { id: 'ventes', label: 'Ventes & tirage' },
] as const
const section = ref<(typeof SECTIONS)[number]['id']>('fiche')
const loading = ref(true)
const loadError = ref('')
const settings = ref<SiteSettings>({ ...SETTINGS_DEFAULTS })
const isPublic = computed(() => !!settings.value.raffle_public.trim())

// Champs enregistrés par « Enregistrer » (les lots, eux, s'enregistrent seuls).
const { mark, isDirty } = useDirty((r: Raffle) => [
  r.title, r.description, r.packs, r.ticket_url, r.draw_on, r.draw_place,
  r.max_tickets, r.permit, r.rules, r.sales_open, r.show_sold, r.visible,
])

onMounted(async () => {
  try {
    settings.value = await fetchSettings(supabase)
    list.value = await fetchRaffles(supabase)
    list.value.forEach(mark)
  } catch (e: any) {
    loadError.value = e.message ?? String(e)
  }
  loading.value = false
})

async function togglePublic() {
  const next = isPublic.value ? '' : 'on'
  if (next && !confirm('Rendre la rubrique Tombola publique ? « Tombola » apparaîtra dans le menu du site, avec les tombolas cochées « visible ».')) return
  const ok = await run(
    () => db.saveSetting('raffle_public', next),
    next ? 'Rubrique publique : « Tombola » est dans le menu du site.' : 'Rubrique repassée en privé.',
  )
  if (ok) settings.value.raffle_public = next
}

function toggle(r: Raffle) {
  open.value = open.value === r.id ? null : r.id
  section.value = 'fiche'
}

async function add() {
  await run(async () => {
    // Créée masquée : rien n'apparaît sur le site avant le premier « Enregistrer ».
    const row = await db.insertRow<Raffle>('raffles', { title: 'Nouvelle tombola', visible: false })
    const r: Raffle = { ...row, packs: cleanPacks(row.packs), prizes: [] }
    mark(r)
    r.visible = true // coché par défaut → publiée à l'enregistrement
    list.value.unshift(r)
    open.value = r.id
    section.value = 'fiche'
  }, 'Brouillon créé — remplis la fiche puis « Enregistrer ».')
}

async function save(r: Raffle) {
  const packs = cleanPacks(r.packs)
  if (!packs.length) {
    flash('Ajoute au moins une formule de prix (ex. 1 ticket = 5 €).')
    return
  }
  const max = Math.round(Number(r.max_tickets))
  const ok = await run(
    () =>
      db.updateRow('raffles', r.id, {
        ...nullify({
          description: r.description,
          ticket_url: r.ticket_url,
          draw_place: r.draw_place,
          permit: r.permit,
          rules: r.rules,
        }),
        title: r.title.trim() || 'Sans titre',
        packs,
        draw_on: r.draw_on || null,
        max_tickets: max > 0 ? max : null,
        sales_open: r.sales_open,
        show_sold: r.show_sold,
        visible: r.visible,
      }),
    `« ${r.title} » enregistrée.`,
  )
  if (ok) {
    r.packs = packs
    r.max_tickets = max > 0 ? max : null
    mark(r)
  }
}

async function remove(r: Raffle) {
  if (!confirm(`Supprimer « ${r.title} », ses lots ET toutes ses ventes ? Irréversible.`)) return
  await run(async () => {
    await db.deleteRow('raffles', r.id) // lots + ventes suivent (on delete cascade)
    await Promise.allSettled(r.prizes.map((p) => media.removeFile(p.photo_url)))
    list.value = list.value.filter((x) => x.id !== r.id)
  }, 'Tombola supprimée.')
}

/** Le tirage (côté serveur) ferme les ventes : on aligne la fiche sans perdre une saisie en cours. */
function onDrawn(r: Raffle) {
  const clean = !isDirty(r)
  r.sales_open = false
  if (clean) mark(r)
}

// ---------------- Formules ----------------
function addPack(r: Raffle) {
  const lastPack = r.packs.at(-1)
  r.packs.push(lastPack ? { tickets: lastPack.tickets * 2, price: lastPack.price * 2 } : { ...DEFAULT_PACKS[0]! })
}

// ---------------- Lots (enregistrés automatiquement) ----------------
async function addPrize(r: Raffle) {
  await run(async () => {
    const row = await db.insertRow<RafflePrize>('raffle_prizes', {
      raffle_id: r.id,
      name: r.prizes.length ? 'Nouveau lot' : 'Le gros lot',
      position: r.prizes.length,
    })
    r.prizes.push(row)
  }, 'Lot ajouté.')
}

function savePrize(p: RafflePrize) {
  const value = p.value_eur === null || String(p.value_eur) === '' ? null : Number(p.value_eur)
  return run(
    () =>
      db.updateRow('raffle_prizes', p.id, {
        ...nullify({ description: p.description, photo_url: p.photo_url }),
        name: p.name.trim() || 'Lot',
        value_eur: value !== null && Number.isFinite(value) ? value : null,
      }),
    'Lot enregistré.',
  )
}

async function removePrize(r: Raffle, idx: number) {
  const p = r.prizes[idx]!
  if (!confirm(`Retirer le lot « ${p.name} » ?`)) return
  await run(async () => {
    await db.deleteRow('raffle_prizes', p.id)
    await media.removeFile(p.photo_url)
    r.prizes.splice(idx, 1)
  }, 'Lot retiré.')
}

function fillRules(r: Raffle) {
  if (r.rules?.trim() && !confirm('Remplacer le règlement actuel par le règlement type ?')) return
  r.rules = rulesTemplate(r, settings.value)
  flash('Règlement type inséré : relis-le, remplace les [à compléter], puis « Enregistrer ».')
}

function status(r: Raffle) {
  if (isDrawn(r)) return 'tirée'
  if (anyDrawn(r)) return 'tirage en cours'
  return r.sales_open ? 'ventes ouvertes' : 'ventes closes'
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl uppercase tracking-wide">Tombolas</h2>
        <p class="font-mono text-xs text-ash">
          Mettre du matos en jeu plutôt que le vendre. Les tickets se vendent en soirée ou via HelloAsso,
          tu saisis les ventes ici, le site attribue les numéros et fait le tirage.
        </p>
      </div>
      <button class="adm-btn shrink-0" :disabled="!!loadError" @click="add">+ Tombola</button>
    </div>

    <p v-if="loadError" class="border border-red-500/40 px-4 py-3 font-mono text-xs text-red-400">
      Impossible de charger les tombolas ({{ loadError }}). As-tu exécuté
      <code>supabase/tombola.sql</code> dans le SQL Editor de Supabase ?
    </p>

    <!-- ============ RUBRIQUE PRIVÉE / PUBLIQUE ============ -->
    <div v-if="!loading && !loadError" class="adm-card flex flex-wrap items-center gap-4 p-4">
      <span
        class="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs uppercase tracking-widest"
        :class="isPublic ? 'border-bone bg-bone text-void' : 'border-line text-smoke'"
      >
        <AppIcon v-if="!isPublic" name="lock" class="h-3.5 w-3.5" />
        <span v-else class="inline-block h-2 w-2 animate-pulse rounded-full bg-void" />
        {{ isPublic ? 'Rubrique publique' : 'Rubrique privée' }}
      </span>
      <p class="min-w-0 flex-1 font-mono text-[0.7rem] text-ash">
        <template v-if="isPublic">« Tombola » est dans le menu du site ; les tombolas cochées « visible » sont publiques.</template>
        <template v-else>Seuls les admins voient la page /tombola et l'entrée « Tombola » du menu (avec un cadenas).</template>
      </p>
      <div class="flex gap-2">
        <NuxtLink to="/tombola" class="adm-btn">Voir la page →</NuxtLink>
        <button class="adm-btn" :class="!isPublic && 'border-bone text-bone'" @click="togglePublic">
          {{ isPublic ? 'Repasser en privé' : 'Rendre publique' }}
        </button>
      </div>
    </div>

    <!-- ============ RAPPEL LÉGAL ============ -->
    <details v-if="!loadError" class="adm-card group p-4">
      <summary class="cursor-pointer list-none font-mono text-xs uppercase tracking-widest text-smoke hover:text-bone">
        <span class="group-open:hidden">▸</span><span class="hidden group-open:inline">▾</span>
        Avant de lancer une tombola : les règles (à lire)
      </summary>
      <ul class="mt-3 list-[square] space-y-1.5 pl-5 text-sm text-smoke">
        <li>
          <strong class="text-bone">Autorisation du maire</strong> de la commune du siège, demandée 1 à 2 mois avant
          (formulaire Cerfa n° 11823*03). Note le n° d'arrêté dans « Autorisation ».
        </li>
        <li>
          Le bénéfice doit aller <strong class="text-bone">entièrement à l'asso</strong> (activités culturelles) : le
          matériel mis en jeu doit appartenir à l'asso ou lui être donné — pas de tombola pour revendre un objet perso.
        </li>
        <li>Lots = <strong class="text-bone">objets uniquement</strong>, jamais d'argent.</li>
        <li>Frais d'organisation + achat des lots : <strong class="text-bone">15 % maximum</strong> des sommes récoltées.</li>
        <li>Un <strong class="text-bone">règlement écrit</strong>, accessible à tous (bouton « Règlement type » ci-dessous).</li>
        <li>
          Vente en ligne : zone grise juridique. Pas de paiement sur le site ; si vente en ligne, passer par un
          formulaire <strong class="text-bone">HelloAsso</strong> (une formule = un tarif) et le signaler à la mairie dans
          la demande. Tirage <strong class="text-bone">en public</strong> (soirée, live).
        </li>
      </ul>
    </details>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>
    <p v-else-if="!loadError && !list.length" class="font-mono text-sm text-ash">Aucune tombola pour l'instant.</p>

    <!-- ============ TOMBOLAS ============ -->
    <article v-for="r in list" :key="r.id" class="adm-card">
      <button type="button" class="flex w-full flex-wrap items-center gap-3 p-3 text-left" @click="toggle(r)">
        <span
          class="shrink-0 border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest"
          :class="r.sales_open && !anyDrawn(r) ? 'border-bone text-bone' : 'border-line text-ash'"
        >
          {{ status(r) }}
        </span>
        <span class="min-w-0 truncate font-display text-xl uppercase tracking-wide">{{ r.title }}</span>
        <span v-if="r.draw_on" class="shrink-0 font-mono text-xs text-ash">tirage le {{ formatDate(r.draw_on) }}</span>
        <span v-if="!r.visible" class="shrink-0 border border-ash/40 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-ash">masquée</span>
        <span v-if="isDirty(r)" class="shrink-0 border border-bone px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-bone">non enregistré</span>
        <span class="ml-auto shrink-0 font-mono text-xs text-ash">{{ open === r.id ? '▲' : '▼' }}</span>
      </button>

      <div v-if="open === r.id" class="border-t border-line">
        <nav class="flex gap-1 px-4 pt-3">
          <button
            v-for="s in SECTIONS"
            :key="s.id"
            type="button"
            class="border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
            :class="section === s.id ? 'border-bone bg-bone text-void' : 'border-line text-smoke hover:border-bone'"
            @click="section = s.id"
          >
            {{ s.label }}
          </button>
        </nav>

        <!-- ================= FICHE ================= -->
        <div v-if="section === 'fiche'" class="space-y-5 p-4">
          <div class="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label class="block">
              <span class="adm-label">Titre</span>
              <input v-model="r.title" placeholder="ex. Tombola de printemps — un DDJ-SX2 à gagner" class="adm-input" />
            </label>
            <label class="block">
              <span class="adm-label">Date du tirage</span>
              <input v-model="r.draw_on" type="date" class="adm-input [color-scheme:dark]" />
            </label>
          </div>
          <label class="block">
            <span class="adm-label">Présentation</span>
            <textarea
              v-model="r.description"
              rows="3"
              placeholder="Pourquoi cette tombola, à quoi va servir l'argent (nouveaux caissons, prochaine open air…)"
              class="adm-input"
            />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="adm-label">Lieu / déroulé du tirage</span>
              <input v-model="r.draw_place" placeholder="ex. en direct à la soirée de la Guinguette" class="adm-input" />
            </label>
            <label class="block">
              <span class="adm-label">Lien de vente en ligne (optionnel)</span>
              <input v-model="r.ticket_url" placeholder="https://www.helloasso.com/…" class="adm-input font-mono text-xs" />
            </label>
          </div>

          <!-- formules de prix -->
          <div class="space-y-2 border-t border-line pt-4">
            <div class="flex items-baseline gap-2">
              <h3 class="font-display text-xl uppercase tracking-wide">Formules</h3>
              <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">1 ticket = 1 numéro = 1 chance</span>
            </div>
            <div v-for="(p, pi) in r.packs" :key="pi" class="flex flex-wrap items-center gap-2">
              <input v-model.number="p.tickets" type="number" min="1" class="w-20 border border-line bg-void px-2 py-1.5 text-sm outline-none focus:border-bone" />
              <span class="font-mono text-xs text-ash">ticket{{ p.tickets > 1 ? 's' : '' }} pour</span>
              <input v-model.number="p.price" type="number" min="0" step="0.5" class="w-24 border border-line bg-void px-2 py-1.5 text-sm outline-none focus:border-bone" />
              <span class="font-mono text-xs text-ash">€</span>
              <span v-if="p.tickets > 0" class="font-mono text-[0.7rem] text-smoke">
                soit {{ formatEur(unitPrice(p)) }} / ticket
                <template v-if="packDiscount(p, r.packs)"> · −{{ packDiscount(p, r.packs) }} %</template>
              </span>
              <button title="Retirer" class="ml-auto px-2 text-xs text-red-400 hover:text-red-300" @click="r.packs.splice(pi, 1)">✕</button>
            </div>
            <button class="adm-btn" @click="addPack(r)">+ Formule</button>
            <p class="font-mono text-[0.65rem] text-ash">
              Gros lot ? Monte le prix du ticket (ex. 10 €). Si tu vends sur HelloAsso, crée un tarif par formule.
            </p>
          </div>

          <!-- lots -->
          <div class="space-y-3 border-t border-line pt-4">
            <div class="flex items-baseline gap-2">
              <h3 class="font-display text-xl uppercase tracking-wide">Lots</h3>
              <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">
                enregistrés automatiquement · tirés dans cet ordre
              </span>
            </div>
            <div v-for="(p, pi) in r.prizes" :key="p.id" class="space-y-3 border border-line bg-void p-3">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs text-ash">Lot {{ pi + 1 }}</span>
                <span v-if="p.winner_ticket !== null" class="bg-bone px-1.5 font-mono text-[0.6rem] uppercase text-void">tiré</span>
                <span class="ml-auto flex gap-1">
                  <button title="Monter" class="adm-btn px-2" @click="run(() => db.move('raffle_prizes', r.prizes, pi, -1))">↑</button>
                  <button title="Descendre" class="adm-btn px-2" @click="run(() => db.move('raffle_prizes', r.prizes, pi, 1))">↓</button>
                  <button title="Retirer" class="adm-btn-danger px-2" @click="removePrize(r, pi)">✕</button>
                </span>
              </div>
              <div class="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <label class="block">
                  <span class="adm-label">Nom du lot</span>
                  <input v-model="p.name" placeholder="ex. Contrôleur Pioneer DDJ-SX2" class="adm-input" @change="savePrize(p)" />
                </label>
                <label class="block">
                  <span class="adm-label">Valeur indicative (€)</span>
                  <input v-model.number="p.value_eur" type="number" min="0" step="1" class="adm-input" @change="savePrize(p)" />
                </label>
              </div>
              <label class="block">
                <span class="adm-label">Description</span>
                <textarea
                  v-model="p.description"
                  rows="2"
                  placeholder="état, ce qui est fourni (câbles, flight case…)"
                  class="adm-input"
                  @change="savePrize(p)"
                />
              </label>
              <AdminMediaField v-model="p.photo_url" label="Photo" :folder="`raffles/${r.id}`" @uploaded="savePrize(p)" />
            </div>
            <button class="adm-btn" @click="addPrize(r)">+ Lot</button>
          </div>

          <!-- règlement & légal -->
          <div class="space-y-3 border-t border-line pt-4">
            <label class="block">
              <span class="adm-label">Autorisation</span>
              <input
                v-model="r.permit"
                placeholder="ex. Tombola autorisée par arrêté du maire de Saint-Nazaire n° … du …"
                class="adm-input"
              />
            </label>
            <label class="block">
              <span class="flex items-baseline justify-between gap-2">
                <span class="adm-label">Règlement</span>
                <button
                  type="button"
                  class="font-mono text-[0.6rem] uppercase tracking-widest text-ash hover:text-bone"
                  @click="fillRules(r)"
                >
                  règlement type
                </button>
              </span>
              <textarea v-model="r.rules" rows="8" class="adm-input font-mono text-xs" />
              <span class="mt-1 block font-mono text-[0.65rem] text-ash">
                Le règlement type reprend la fiche, les lots et les mentions légales (Textes & réseaux) : remplace
                les [à compléter] avant de publier.
              </span>
            </label>
            <label class="block sm:w-1/2">
              <span class="adm-label">Nombre max de tickets (optionnel)</span>
              <input v-model.number="r.max_tickets" type="number" min="1" placeholder="illimité" class="adm-input" />
            </label>
          </div>

          <div class="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
            <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
              <input v-model="r.visible" type="checkbox" class="accent-bone" />
              Visible sur le site
            </label>
            <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
              <input v-model="r.sales_open" type="checkbox" class="accent-bone" />
              Ventes ouvertes
            </label>
            <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
              <input v-model="r.show_sold" type="checkbox" class="accent-bone" />
              Afficher le nombre de tickets vendus
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <button
              class="adm-btn"
              :class="isDirty(r) && 'border-bone bg-bone text-void hover:bg-transparent'"
              @click="save(r)"
            >
              Enregistrer la tombola
            </button>
            <button class="adm-btn-danger" @click="remove(r)">Supprimer</button>
            <span class="font-mono text-[0.65rem] uppercase tracking-widest" :class="isDirty(r) ? 'text-bone' : 'text-ash'">
              {{ isDirty(r) ? '● modifications non enregistrées' : '✓ tout est enregistré' }}
            </span>
          </div>
        </div>

        <!-- ================= VENTES & TIRAGE ================= -->
        <div v-else class="p-4">
          <AdminRaffleSales :raffle="r" @drawn="onDrawn(r)" />
        </div>
      </div>
    </article>
  </section>
</template>
