<script setup lang="ts">
import type { GearItem } from '~/composables/useShowcase'

// Grille du matériel (sound system, platines, lumière…) : accueil et page Booking.
// Clic sur une photo → affichage en grand (Échap ou clic pour fermer).
withDefaults(defineProps<{ items: GearItem[]; compact?: boolean }>(), { compact: false })

const zoomed = ref<GearItem | null>(null)

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') zoomed.value = null
}
watch(zoomed, (g) => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = g ? 'hidden' : ''
  if (g) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    class="grid gap-4"
    :class="compact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'"
  >
    <article
      v-for="g in items"
      :key="g.id"
      class="group reveal flex flex-col border border-line bg-grave transition-colors duration-300 hover:border-bone"
    >
      <button
        type="button"
        class="relative aspect-[4/3] w-full overflow-hidden border-b border-line bg-ink"
        :class="g.photo_url ? 'cursor-zoom-in' : 'cursor-default'"
        :aria-label="g.photo_url ? `Voir ${g.name} en grand` : g.name"
        :disabled="!g.photo_url"
        @click="zoomed = g"
      >
        <img
          v-if="g.photo_url"
          :src="g.photo_url"
          :alt="g.name"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span v-else class="grooves flex h-full w-full items-center justify-center text-ash">
          <AppIcon name="broadcast" class="h-10 w-10" />
        </span>
      </button>
      <div :class="compact ? 'p-3' : 'p-5'">
        <p v-if="g.kind" class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">{{ g.kind }}</p>
        <h3
          class="font-display uppercase leading-tight tracking-wide"
          :class="compact ? 'text-lg' : 'mt-1 text-2xl'"
        >
          {{ g.name }}
        </h3>
        <p
          v-if="g.details"
          class="whitespace-pre-line text-smoke"
          :class="compact ? 'mt-1 line-clamp-3 text-xs' : 'mt-2 text-sm'"
        >
          {{ g.details }}
        </p>
      </div>
    </article>
  </div>

  <!-- photo en grand -->
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="zoomed?.photo_url"
        class="fixed inset-0 z-[80] flex cursor-zoom-out flex-col items-center justify-center gap-3 bg-black/95 p-3 sm:p-8"
        role="dialog"
        aria-modal="true"
        :aria-label="zoomed.name"
        @click="zoomed = null"
      >
        <img :src="zoomed.photo_url" :alt="zoomed.name" class="max-h-[85vh] max-w-full object-contain" />
        <p class="font-display text-2xl uppercase tracking-wide text-bone">{{ zoomed.name }}</p>
        <button
          type="button"
          class="absolute right-3 top-3 border border-line bg-void/70 p-2 text-bone transition-colors hover:bg-bone hover:text-void"
          aria-label="Fermer"
          @click.stop="zoomed = null"
        >
          <AppIcon name="close" class="h-5 w-5" />
        </button>
      </div>
    </Teleport>
  </ClientOnly>
</template>
