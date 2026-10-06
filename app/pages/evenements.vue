<script setup lang="ts">
import type { SonikEvent } from '~/composables/useShowcase'

// Tous les événements : à venir + archives avec galeries photos / vidéos.
useSeoMeta({
  title: 'Soirées techno à Saint-Nazaire — Agenda SONIKLAB',
  description:
    'Agenda des soirées techno du collectif SONIKLAB à Saint-Nazaire et alentours : prochaines dates en bars, guinguettes et open airs, photos des soirées passées.',
  ogTitle: 'Soirées techno à Saint-Nazaire — SONIKLAB',
  ogDescription: 'Prochaines dates et photos de nos soirées, open airs et fêtes de la musique.',
})

const events = useEvents()
const today = useToday()

const upcoming = computed(() =>
  events.value.filter((e) => e.starts_on >= today.value).sort((a, b) => a.starts_on.localeCompare(b.starts_on)),
)
const past = computed(() => events.value.filter((e) => e.starts_on < today.value))

// Archives groupées par année (la plus récente d'abord).
const byYear = computed(() => {
  const groups: { year: string; events: SonikEvent[] }[] = []
  for (const e of past.value) {
    const year = e.starts_on.slice(0, 4)
    const last = groups.at(-1)
    if (last?.year === year) last.events.push(e)
    else groups.push({ year, events: [e] })
  }
  return groups
})

const opened = ref<SonikEvent | null>(null)

useReveal()
</script>

<template>
  <div class="relative">
    <SiteHeader />

    <section class="border-b border-line">
      <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// soirées techno à Saint-Nazaire · agenda & archives</p>
        <h1 class="mt-3 font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl md:text-8xl">
          Événe<span class="glitch inline-block">ments</span>
        </h1>
      </div>
    </section>

    <!-- à venir -->
    <section v-if="upcoming.length" class="border-b border-line bg-ink">
      <div class="mx-auto max-w-6xl px-5 py-12">
        <SectionHead kicker="// prochainement" title="À venir" />
        <div class="-mt-5">
          <UpcomingEvent v-for="e in upcoming" :key="e.id" :event="e" />
        </div>
      </div>
    </section>

    <!-- archives par année -->
    <section class="mx-auto max-w-6xl px-5 py-12">
      <template v-if="byYear.length">
        <div v-for="g in byYear" :key="g.year" class="mb-16 last:mb-0">
          <SectionHead kicker="// archives" :title="g.year" :aside="`${g.events.length} date${g.events.length > 1 ? 's' : ''}`" />
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <PastEventCard v-for="e in g.events" :key="e.id" :event="e" @open="opened = e" />
          </div>
        </div>
      </template>
      <p v-else class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
        Les photos de nos soirées arrivent bientôt.
      </p>
    </section>

    <SiteFooter />

    <EventGallery :event="opened" @close="opened = null" />
  </div>
</template>
