<script setup lang="ts">
import { type SonikEvent, formatDate } from '~/composables/useShowcase'
import { embedUrl } from '~/composables/useMedia'

// Fiche d'un événement en plein écran : infos + galerie photos / vidéos.
const props = defineProps<{ event: SonikEvent | null }>()
const emit = defineEmits<{ close: [] }>()

const index = ref(0)
const items = computed(() => props.event?.media ?? [])
const current = computed(() => items.value[index.value] ?? null)
const place = computed(() => [props.event?.venue, props.event?.city].filter(Boolean).join(' — '))

function go(step: number) {
  const n = items.value.length
  if (n) index.value = (index.value + step + n) % n
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}

// Ouverture / fermeture : remise à zéro, clavier, et page de fond bloquée.
watch(
  () => props.event,
  (ev) => {
    index.value = 0
    if (!import.meta.client) return
    document.documentElement.style.overflow = ev ? 'hidden' : ''
    if (ev) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
)
onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})

// Swipe gauche / droite sur mobile.
let touchX = 0
function onTouchStart(e: TouchEvent) {
  touchX = e.touches[0]!.clientX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0]!.clientX - touchX
  if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
}
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
          v-if="event"
          class="fixed inset-0 z-[70] overflow-y-auto bg-void/95 text-bone backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          :aria-label="event.title"
          @click.self="emit('close')"
        >
          <div class="mx-auto max-w-5xl px-5 py-6 md:py-10">
            <!-- en-tête -->
            <header class="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
              <div class="min-w-0">
                <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">
                  {{ formatDate(event.starts_on) }}<template v-if="place"> · {{ place }}</template>
                </p>
                <h2 class="mt-2 font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
                  {{ event.title }}
                </h2>
              </div>
              <button
                type="button"
                class="shrink-0 border border-line p-2 text-smoke transition-colors hover:border-bone hover:bg-bone hover:text-void"
                aria-label="Fermer"
                @click="emit('close')"
              >
                <AppIcon name="close" class="h-5 w-5" />
              </button>
            </header>

            <p v-if="event.description" class="mb-6 max-w-3xl whitespace-pre-line text-smoke">
              {{ event.description }}
            </p>

            <template v-if="current">
              <!-- média courant -->
              <div
                class="relative flex aspect-video w-full items-center justify-center overflow-hidden border border-line bg-ink"
                @touchstart.passive="onTouchStart"
                @touchend.passive="onTouchEnd"
              >
                <img
                  v-if="current.kind === 'image'"
                  :key="current.id"
                  :src="current.url"
                  :alt="current.caption || event.title"
                  class="h-full w-full object-contain"
                />
                <video
                  v-else-if="current.kind === 'video'"
                  :key="current.id"
                  :src="current.url"
                  controls
                  playsinline
                  preload="metadata"
                  class="h-full w-full bg-ink"
                />
                <iframe
                  v-else-if="current.kind === 'embed' && embedUrl(current.url)"
                  :key="current.id"
                  :src="embedUrl(current.url)!"
                  :title="current.caption || event.title"
                  class="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowfullscreen
                />
                <a
                  v-else
                  :href="current.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="grooves flex h-full w-full flex-col items-center justify-center gap-3 transition-colors hover:text-smoke"
                >
                  <AppIcon name="play" class="h-14 w-14" />
                  <span class="font-mono text-xs uppercase tracking-widest">Voir la vidéo ↗</span>
                </a>

                <template v-if="items.length > 1">
                  <button
                    type="button"
                    class="absolute left-2 top-1/2 -translate-y-1/2 border border-line bg-void/70 p-2 transition-colors hover:bg-bone hover:text-void"
                    aria-label="Précédent"
                    @click="go(-1)"
                  >
                    <AppIcon name="prev" class="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    class="absolute right-2 top-1/2 -translate-y-1/2 border border-line bg-void/70 p-2 transition-colors hover:bg-bone hover:text-void"
                    aria-label="Suivant"
                    @click="go(1)"
                  >
                    <AppIcon name="next" class="h-5 w-5" />
                  </button>
                </template>
              </div>

              <div class="mt-3 flex items-baseline justify-between gap-4 font-mono text-xs text-ash">
                <span class="truncate">{{ current.caption }}</span>
                <span class="shrink-0 tracking-widest">
                  {{ String(index + 1).padStart(2, '0') }} / {{ String(items.length).padStart(2, '0') }}
                </span>
              </div>

              <!-- miniatures -->
              <div v-if="items.length > 1" class="mt-4 flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="(m, i) in items"
                  :key="m.id"
                  type="button"
                  class="relative h-16 w-24 shrink-0 overflow-hidden border transition-opacity"
                  :class="i === index ? 'border-bone opacity-100' : 'border-line opacity-50 hover:opacity-90'"
                  @click="index = i"
                >
                  <img v-if="m.kind === 'image'" :src="m.url" alt="" loading="lazy" class="h-full w-full object-cover grayscale" />
                  <span v-else class="grooves flex h-full w-full items-center justify-center">
                    <AppIcon name="play" class="h-6 w-6" />
                  </span>
                </button>
              </div>
            </template>

            <p v-else class="border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
              Les photos arrivent bientôt.
            </p>

            <a
              v-if="event.ticket_url"
              :href="event.ticket_url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-6 inline-flex items-center gap-2 border border-line px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
            >
              Page de l'événement
              <AppIcon name="arrow" class="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
