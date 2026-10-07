<script setup lang="ts">
import { type RafflePrize, drawPrize, formatPrice, ticketNo } from '~/composables/useRaffle'

// Écran de tirage au sort plein écran (admin), pensé pour être projeté ou
// filmé en live : le tambour de chiffres tourne, puis s'arrête chiffre par
// chiffre sur le ticket gagnant. Le tirage lui-même se fait côté serveur
// (raffle_draw) : l'animation ne fait que révéler le résultat.
const props = defineProps<{
  raffleTitle: string
  /** Le lot à tirer (null = écran fermé). */
  prize: RafflePrize | null
  /** Rang du lot dans la liste (1, 2…). */
  rank: number
  /** Tickets encore en jeu pour ce lot. */
  pool: number
  /** Nombre de chiffres affichés (ex. 4 → 0042). */
  width: number
  /** Reste-t-il un lot à tirer après celui-ci ? */
  hasNext: boolean
}>()
const emit = defineEmits<{ drawn: [prize: RafflePrize]; next: []; close: [] }>()

const supabase = useSupabase()
const root = ref<HTMLElement | null>(null)

type Phase = 'idle' | 'spinning' | 'landing' | 'done'
const phase = ref<Phase>('idle')
const result = ref<RafflePrize | null>(null)
const stopped = ref<boolean[]>([])
const error = ref('')

const digits = computed(() =>
  result.value?.winner_ticket ? ticketNo(result.value.winner_ticket, props.width).split('').map(Number) : Array(props.width).fill(0),
)
const busy = computed(() => phase.value === 'spinning' || phase.value === 'landing')

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function launch() {
  if (!props.prize || phase.value !== 'idle') return
  error.value = ''
  stopped.value = Array(props.width).fill(false)
  phase.value = 'spinning'
  const started = Date.now()
  try {
    const won = await drawPrize(supabase, props.prize.id)
    // Le résultat est enregistré : on prévient tout de suite la page admin.
    emit('drawn', won)
    // Un minimum de suspense, même si le serveur répond vite.
    await wait(Math.max(0, 2600 - (Date.now() - started)))
    result.value = won
    phase.value = 'landing'
    for (let i = 0; i < props.width; i++) {
      await wait(i === 0 ? 50 : 700)
      stopped.value[i] = true
    }
    await wait(1300)
    phase.value = 'done'
  } catch (e: any) {
    phase.value = 'idle'
    error.value = e.message ?? String(e)
  }
}

function stripStyle(i: number) {
  if (!stopped.value[i]) return { transform: 'translateY(0)' }
  // 2 tours complets puis le chiffre : la bande décélère jusqu'au numéro.
  return {
    transform: `translateY(${-(20 + digits.value[i]!) * 1.3}em)`,
    transition: 'transform 1.1s cubic-bezier(0.18, 0.9, 0.3, 1.12)',
  }
}

function close() {
  if (busy.value) return
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  emit('close')
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  else root.value?.requestFullscreen().catch(() => {})
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && !document.fullscreenElement) close()
  else if ((e.key === ' ' || e.key === 'Enter') && phase.value === 'idle') {
    e.preventDefault()
    launch()
  }
}

// Nouveau lot (ou ouverture) : remise à zéro du tambour.
watch(
  () => props.prize?.id,
  (id) => {
    phase.value = 'idle'
    result.value = null
    stopped.value = []
    error.value = ''
    if (!import.meta.client) return
    document.documentElement.style.overflow = id ? 'hidden' : ''
    window.removeEventListener('keydown', onKey)
    if (id) window.addEventListener('keydown', onKey)
  },
)
onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="opacity-0"
      >
        <div
          v-if="prize"
          ref="root"
          class="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-void text-bone"
          role="dialog"
          aria-modal="true"
          :aria-label="`Tirage au sort : ${prize.name}`"
        >
          <!-- vinyle géant en fond -->
          <div
            class="pointer-events-none fixed left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
            aria-hidden="true"
          >
            <Vinyl />
          </div>

          <header class="relative flex items-center justify-between gap-4 border-b border-line px-5 py-3">
            <p class="truncate font-mono text-xs uppercase tracking-[0.25em] text-ash">
              // tirage au sort — {{ raffleTitle }}
            </p>
            <div class="flex shrink-0 gap-2">
              <button type="button" class="adm-btn" title="Plein écran (pour projeter / filmer)" @click="toggleFullscreen">
                ⤢ Plein écran
              </button>
              <button type="button" class="adm-btn" :disabled="busy" aria-label="Fermer" @click="close">
                <AppIcon name="close" class="h-4 w-4" />
              </button>
            </div>
          </header>

          <main class="relative flex flex-1 flex-col items-center justify-center gap-8 px-5 py-10 text-center">
            <!-- le lot -->
            <div class="flex flex-col items-center gap-4">
              <div v-if="prize.photo_url" class="h-32 w-32 overflow-hidden border border-line bg-ink sm:h-40 sm:w-40">
                <img :src="prize.photo_url" alt="" class="h-full w-full object-cover" />
              </div>
              <p class="font-mono text-xs uppercase tracking-[0.3em] text-ash">
                Lot n° {{ rank }}<template v-if="prize.value_eur"> · valeur {{ formatPrice(Number(prize.value_eur)) }}</template>
              </p>
              <h2 class="max-w-4xl font-display text-5xl uppercase leading-[1.12] tracking-wide sm:text-7xl">
                {{ prize.name }}
              </h2>
            </div>

            <!-- le tambour -->
            <div class="flex items-center gap-3 font-mono font-bold text-bone" style="font-size: clamp(3.2rem, 13vw, 9rem)">
              <span class="font-mono text-[0.25em] uppercase tracking-widest text-ash">N°</span>
              <span class="flex gap-[0.08em]" aria-hidden="true">
                <span v-for="(d, i) in digits" :key="i" class="draw-cell">
                  <span
                    class="draw-strip"
                    :class="{ spinning: (phase === 'spinning' || phase === 'landing') && !stopped[i] }"
                    :style="stripStyle(i)"
                  >
                    <span v-for="n in 30" :key="n">{{ (n - 1) % 10 }}</span>
                  </span>
                </span>
              </span>
            </div>

            <!-- avant / pendant / après -->
            <div class="flex min-h-64 flex-col items-center gap-4">
              <template v-if="phase === 'idle'">
                <button
                  type="button"
                  class="group inline-flex items-center gap-3 bg-bone px-8 py-4 font-mono text-base uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
                  @click="launch"
                >
                  🎲 Lancer le tirage
                </button>
                <p class="font-mono text-xs uppercase tracking-widest text-ash">
                  {{ pool }} ticket{{ pool > 1 ? 's' : '' }} en jeu · barre d'espace pour lancer
                </p>
                <p v-if="error" class="font-mono text-sm text-red-400">{{ error }}</p>
              </template>

              <template v-else-if="phase !== 'done'">
                <p class="flicker font-mono text-sm uppercase tracking-[0.3em] text-smoke">ça tourne…</p>
                <div class="h-10 w-56"><Equalizer :bars="32" /></div>
              </template>

              <template v-else-if="result">
                <p class="font-mono text-xs uppercase tracking-[0.3em] text-ash">
                  ticket gagnant n° {{ ticketNo(result.winner_ticket!) }}
                </p>
                <p v-if="result.winner_label" class="flicker font-display text-6xl uppercase tracking-wide sm:text-8xl">
                  {{ result.winner_label }}
                </p>
                <p class="font-mono text-sm uppercase tracking-widest text-smoke">Bravo ! 🎉</p>
                <div class="mt-2 flex flex-wrap justify-center gap-3">
                  <button
                    v-if="hasNext"
                    type="button"
                    class="inline-flex items-center gap-2 bg-bone px-6 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
                    @click="emit('next')"
                  >
                    Lot suivant <AppIcon name="arrow" class="h-4 w-4" />
                  </button>
                  <button type="button" class="adm-btn px-6 py-3 text-sm" @click="close">Fermer</button>
                </div>
              </template>
            </div>
          </main>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
