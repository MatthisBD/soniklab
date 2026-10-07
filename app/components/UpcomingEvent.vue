<script setup lang="ts">
import { type SonikEvent, dateParts, entryLabel } from '~/composables/useShowcase'

const props = defineProps<{ event: SonikEvent }>()
defineEmits<{ open: [] }>()

const d = computed(() => dateParts(props.event.starts_on))
const place = computed(() => [props.event.venue, props.event.city].filter(Boolean).join(' — '))
const entry = computed(() => entryLabel(props.event.entry))
// Le flyer : l'affiche, sinon la première photo de la galerie.
const flyer = computed(
  () => props.event.cover_url ?? props.event.media.find((m) => m.kind === 'image')?.url ?? null,
)
</script>

<template>
  <!-- une ligne de « flyer » : date géante, lieu, affiche, billetterie. Clic = fiche complète. -->
  <article
    class="group reveal flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-2 py-5 transition-colors duration-300 hover:bg-bone hover:text-void sm:flex-nowrap sm:gap-x-5 sm:px-4"
    @click="$emit('open')"
  >
    <div class="w-20 shrink-0 text-center sm:w-24">
      <p class="font-mono text-[0.65rem] uppercase tracking-widest text-ash group-hover:text-void/60">{{ d.weekday }}</p>
      <p class="font-display text-5xl leading-none sm:text-6xl">{{ d.day }}</p>
      <p class="font-mono text-xs uppercase tracking-widest">{{ d.month }} {{ d.year }}</p>
    </div>

    <div class="min-w-0 flex-1">
      <h3 class="glitch font-display text-2xl uppercase leading-tight tracking-wide sm:text-3xl">
        <!-- vrai bouton pour le clavier ; le clic remonte jusqu'à la ligne -->
        <button type="button" class="text-left uppercase">{{ event.title }}</button>
      </h3>
      <p
        v-if="place || event.hours || entry"
        class="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-xs uppercase tracking-wider text-smoke group-hover:text-void/70"
      >
        <span v-if="place" class="inline-flex items-center gap-1"><AppIcon name="pin" class="h-3.5 w-3.5" />{{ place }}</span>
        <span v-if="event.hours">{{ event.hours }}</span>
        <span v-if="entry">{{ entry }}</span>
      </p>
      <p v-if="event.description" class="mt-2 line-clamp-2 max-w-2xl text-sm text-smoke group-hover:text-void/70">
        {{ event.description }}
      </p>
    </div>

    <div
      v-if="flyer"
      class="relative aspect-[5/7] w-16 shrink-0 overflow-hidden border border-line bg-ink group-hover:border-void/30 sm:w-24"
    >
      <img
        :src="flyer"
        :alt="`Affiche — ${event.title}`"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span
        class="absolute inset-x-0 bottom-0 bg-void/80 py-0.5 text-center font-mono text-[0.55rem] uppercase tracking-widest text-bone"
      >
        affiche
      </span>
    </div>

    <a
      v-if="event.ticket_url"
      :href="event.ticket_url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex w-full items-center justify-center gap-2 bg-bone px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5 group-hover:bg-void group-hover:text-bone sm:w-auto sm:shrink-0"
      @click.stop
    >
      Infos & billets
      <AppIcon name="arrow" class="h-3.5 w-3.5" />
    </a>
  </article>
</template>
