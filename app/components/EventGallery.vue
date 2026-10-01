<script setup lang="ts">
import { type EventMedia, type SonikEvent, formatDate } from '~/composables/useShowcase'
import { embedUrl } from '~/composables/useMedia'

// Fiche d'un événement en plein écran : infos + affiche + galerie photos / vidéos.
// Un clic sur une image l'ouvre en grand (zoom), ← / → pour naviguer, Échap pour fermer.
const props = defineProps<{ event: SonikEvent | null }>()
const emit = defineEmits<{ close: [] }>()

const index = ref(0)
const zoom = ref(false)

// L'affiche passe en premier (sauf si elle fait déjà partie de la galerie) :
// la fiche n'est jamais vide, et le flyer se voit en grand.
const items = computed<EventMedia[]>(() => {
  const ev = props.event
  if (!ev) return []
  const cover =
    ev.cover_url && !ev.media.some((m) => m.url === ev.cover_url)
      ? [{ id: 'cover', event_id: ev.id, kind: 'image' as const, url: ev.cover_url, caption: 'Affiche', position: -1 }]
      : []
  return [...cover, ...ev.media]
})
const current = computed(() => items.value[index.value] ?? null)
const place = computed(() => [props.event?.venue, props.event?.city].filter(Boolean).join(' — '))
const hasGallery = computed(() => !!props.event?.media.length)

function go(step: number) {
  const n = items.value.length
  if (n) index.value = (index.value + step + n) % n
  // le zoom ne concerne que les images
  if (current.value?.kind !== 'image') zoom.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') zoom.value ? (zoom.value = false) : emit('close')
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}

// Ouverture / fermeture : remise à zéro, clavier, et page de fond bloquée.
watch(
  () => props.event,
  (ev) => {
    index.value = 0
    zoom.value = false
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
          <div class="mx-auto max-w-5xl px-5 py-6 md:py-10" @click.self="emit('close')">
            <!-- en-tête -->
            <header class="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
              <div class="min-w-0">
                <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">
                  {{ formatDate(event.starts_on) }}<template v-if="event.hours"> · {{ event.hours }}</template><template v-if="place"> · {{ place }}</template>
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
              <!-- média courant, dans son format d'origine -->
              <div
                class="relative flex min-h-[40vh] w-full items-center justify-center overflow-hidden border border-line bg-ink"
                @touchstart.passive="onTouchStart"
                @touchend.passive="onTouchEnd"
              >
                <button
                  v-if="current.kind === 'image'"
                  :key="current.id"
                  type="button"
                  class="group/zoom relative block cursor-zoom-in"
                  aria-label="Voir en grand"
                  @click="zoom = true"
                >
                  <img
                    :src="current.url"
                    :alt="current.caption || event.title"
                    class="max-h-[72vh] w-auto max-w-full object-contain"
                  />
                  <span
                    class="absolute bottom-3 right-3 bg-void/80 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-bone opacity-70 transition-opacity group-hover/zoom:opacity-100"
                  >
                    ⤢ plein écran
                  </span>
                </button>
                <video
                  v-else-if="current.kind === 'video'"
                  :key="current.id"
                  :src="current.url"
                  controls
                  playsinline
                  preload="metadata"
                  class="max-h-[72vh] w-full bg-ink"
                />
                <div v-else-if="current.kind === 'embed' && embedUrl(current.url)" :key="current.id" class="aspect-video w-full">
                  <iframe
                    :src="embedUrl(current.url)!"
                    :title="current.caption || event.title"
                    class="h-full w-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen
                  />
                </div>
                <a
                  v-else
                  :href="current.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="grooves flex aspect-video w-full flex-col items-center justify-center gap-3 transition-colors hover:text-smoke"
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
                <span v-if="items.length > 1" class="shrink-0 tracking-widest">
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
                  <img v-if="m.kind === 'image'" :src="m.url" alt="" loading="lazy" class="h-full w-full object-cover" />
                  <span v-else class="grooves flex h-full w-full items-center justify-center">
                    <AppIcon name="play" class="h-6 w-6" />
                  </span>
                </button>
              </div>
            </template>

            <p
              v-if="!hasGallery"
              class="mt-6 border border-dashed border-line px-4 py-4 text-center font-mono text-xs uppercase tracking-widest text-ash"
            >
              Les photos de la soirée arrivent bientôt.
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

          <!-- ============ ZOOM plein écran ============ -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            leave-active-class="transition duration-150 ease-in"
            leave-to-class="opacity-0"
          >
            <div
              v-if="zoom && current?.kind === 'image'"
              class="fixed inset-0 z-[80] flex cursor-zoom-out items-center justify-center bg-black/95 p-2 sm:p-6"
              @click.self="zoom = false"
              @touchstart.passive="onTouchStart"
              @touchend.passive="onTouchEnd"
            >
              <img
                :key="current.id"
                :src="current.url"
                :alt="current.caption || event.title"
                class="max-h-full max-w-full object-contain"
                @click="zoom = false"
              />
              <button
                type="button"
                class="absolute right-3 top-3 border border-line bg-void/70 p-2 text-bone transition-colors hover:bg-bone hover:text-void"
                aria-label="Fermer le plein écran"
                @click="zoom = false"
              >
                <AppIcon name="close" class="h-5 w-5" />
              </button>
              <template v-if="items.length > 1">
                <button
                  type="button"
                  class="absolute left-3 top-1/2 -translate-y-1/2 border border-line bg-void/70 p-2 text-bone transition-colors hover:bg-bone hover:text-void"
                  aria-label="Précédent"
                  @click="go(-1)"
                >
                  <AppIcon name="prev" class="h-5 w-5" />
                </button>
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 border border-line bg-void/70 p-2 text-bone transition-colors hover:bg-bone hover:text-void"
                  aria-label="Suivant"
                  @click="go(1)"
                >
                  <AppIcon name="next" class="h-5 w-5" />
                </button>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
