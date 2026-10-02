<script setup lang="ts">
import type { Artist } from '~/composables/useShowcase'
import { linkIcon } from '~/composables/useMedia'

// Fiche artiste agrandie, par-dessus la page (fond flouté) :
// photo, bio complète et liens. Fermeture : croix, Échap ou clic à côté.
const props = defineProps<{ artist: Artist | null; track?: string }>()
const emit = defineEmits<{ close: [] }>()

const subtitle = computed(() => [props.artist?.role, props.artist?.style].filter(Boolean).join(' · '))
const initials = computed(() =>
  (props.artist?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join(''),
)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

// Ouverture / fermeture : clavier et page de fond bloquée.
watch(
  () => props.artist,
  (a) => {
    if (!import.meta.client) return
    document.documentElement.style.overflow = a ? 'hidden' : ''
    if (a) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
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
          v-if="artist"
          class="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-void/70 p-4 backdrop-blur-md sm:items-center sm:p-8"
          role="dialog"
          aria-modal="true"
          :aria-label="artist.name"
          @click.self="emit('close')"
        >
          <article
            class="relative my-auto grid w-full max-w-4xl overflow-hidden border border-line bg-grave text-bone shadow-2xl md:grid-cols-[1fr_1.15fr]"
          >
            <button
              type="button"
              class="absolute right-3 top-3 z-10 border border-line bg-void/80 p-2 text-smoke transition-colors hover:border-bone hover:bg-bone hover:text-void"
              aria-label="Fermer"
              @click="emit('close')"
            >
              <AppIcon name="close" class="h-5 w-5" />
            </button>

            <!-- visuel -->
            <div class="relative aspect-[4/5] max-h-[70vh] w-full overflow-hidden border-b border-line bg-ink md:h-full md:max-h-none md:border-b-0 md:border-r">
              <img
                v-if="artist.photo_url"
                :src="artist.photo_url"
                :alt="artist.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="grooves flex h-full w-full items-center justify-center">
                <span class="flex h-36 w-36 items-center justify-center rounded-full bg-bone font-display text-5xl text-void">
                  {{ initials }}
                </span>
              </div>
              <span
                v-if="track"
                class="absolute left-3 top-3 bg-void/80 px-1.5 py-0.5 font-mono text-[0.65rem] tracking-widest text-bone"
              >
                {{ track }}
              </span>
            </div>

            <!-- infos -->
            <div class="flex flex-col p-6 sm:p-8">
              <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// au line-up</p>
              <h2 class="mt-2 pr-10 font-display text-5xl uppercase leading-[0.95] tracking-wide">
                {{ artist.name }}
              </h2>
              <p v-if="subtitle" class="mt-3 font-mono text-xs uppercase tracking-widest text-smoke">
                {{ subtitle }}
              </p>

              <p v-if="artist.bio" class="mt-6 whitespace-pre-line leading-relaxed text-smoke">{{ artist.bio }}</p>

              <div v-if="artist.links.length" class="mt-auto flex flex-wrap gap-2 pt-8">
                <a
                  v-for="l in artist.links"
                  :key="l.url"
                  :href="l.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 border border-line px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors hover:border-bone hover:bg-bone hover:text-void"
                >
                  <AppIcon :name="linkIcon(l.url)" class="h-4 w-4" />
                  {{ l.label || 'Écouter' }}
                </a>
              </div>
            </div>
          </article>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
