<script setup lang="ts">
import { type SonikEvent, dateParts } from '~/composables/useShowcase'

const props = defineProps<{ event: SonikEvent }>()
defineEmits<{ open: [] }>()

const d = computed(() => dateParts(props.event.starts_on))
// Visuel de couverture : la cover, sinon la première photo de la galerie.
const cover = computed(
  () => props.event.cover_url ?? props.event.media.find((m) => m.kind === 'image')?.url ?? null,
)
const counts = computed(() => {
  const photos = props.event.media.filter((m) => m.kind === 'image').length
  const videos = props.event.media.filter((m) => m.kind === 'video' || m.kind === 'embed').length
  return [photos && `${photos} photo${photos > 1 ? 's' : ''}`, videos && `${videos} vidéo${videos > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' · ')
})
</script>

<template>
  <button
    type="button"
    class="group reveal relative flex flex-col overflow-hidden border border-line bg-grave text-left transition-colors duration-300 hover:bg-bone hover:text-void"
    @click="$emit('open')"
  >
    <div class="relative aspect-[4/3] w-full overflow-hidden border-b border-line bg-ink group-hover:border-void/20">
      <img
        v-if="cover"
        :src="cover"
        :alt="event.title"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div v-else class="grooves h-full w-full" />
      <!-- tampon de date façon flyer -->
      <span class="absolute left-3 top-3 bg-bone px-2 py-1 text-center text-void">
        <span class="block font-display text-2xl leading-none">{{ d.day }}</span>
        <span class="block font-mono text-[0.6rem] uppercase tracking-widest">{{ d.month }} {{ d.year.slice(2) }}</span>
      </span>
      <span
        v-if="counts"
        class="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-void/80 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest text-bone"
      >
        <AppIcon name="image" class="h-3.5 w-3.5" />{{ counts }}
      </span>
    </div>
    <div class="p-4">
      <h3 class="font-display text-2xl uppercase leading-tight tracking-wide">{{ event.title }}</h3>
      <p class="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-ash group-hover:text-void/60">
        {{ [event.venue, event.city].filter(Boolean).join(' — ') || '—' }}
      </p>
    </div>
  </button>
</template>
