<script setup lang="ts">
import { type SonikEvent, dateParts, entryLabel } from '~/composables/useShowcase'

const props = defineProps<{ event: SonikEvent }>()
const d = computed(() => dateParts(props.event.starts_on))
const place = computed(() => [props.event.venue, props.event.city].filter(Boolean).join(' — '))
const entry = computed(() => entryLabel(props.event.entry))
</script>

<template>
  <!-- une ligne de « flyer » : date géante, lieu, billetterie -->
  <article
    class="group reveal grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3 border-b border-line px-2 py-5 transition-colors duration-300 hover:bg-bone hover:text-void sm:grid-cols-[auto_1fr_auto] sm:px-4"
  >
    <div class="w-20 text-center sm:w-24">
      <p class="font-mono text-[0.65rem] uppercase tracking-widest text-ash group-hover:text-void/60">{{ d.weekday }}</p>
      <p class="font-display text-5xl leading-none sm:text-6xl">{{ d.day }}</p>
      <p class="font-mono text-xs uppercase tracking-widest">{{ d.month }} {{ d.year }}</p>
    </div>

    <div class="min-w-0">
      <h3 class="glitch font-display text-2xl uppercase leading-tight tracking-wide sm:text-3xl">{{ event.title }}</h3>
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

    <a
      v-if="event.ticket_url"
      :href="event.ticket_url"
      target="_blank"
      rel="noopener noreferrer"
      class="col-span-2 inline-flex items-center justify-center gap-2 bg-bone px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5 group-hover:bg-void group-hover:text-bone sm:col-span-1"
    >
      Infos & billets
      <AppIcon name="arrow" class="h-3.5 w-3.5" />
    </a>
  </article>
</template>
