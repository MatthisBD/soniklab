<script setup lang="ts">
import { dateParts, entryLabel, parseLinks, socialLinks } from '~/composables/useShowcase'
import { liveRaffle } from '~/composables/useRaffle'

// Page « link in bio » : le lien à mettre dans la bio Instagram ou en QR code
// sur les flyers. Tout se règle dans /admin → Textes & réseaux.
useSeoMeta({
  title: 'SONIKLAB — Liens',
  description: 'Tous les liens de SONIKLAB : prochaine date, dons, Instagram, SoundCloud, contact.',
  ogTitle: 'SONIKLAB — Tous nos liens',
  ogDescription: 'Prochaine date, dons, Instagram, SoundCloud, contact : tout SONIKLAB au même endroit.',
})

const base = useRuntimeConfig().app.baseURL
const logoSrc = `${base}soniklab-logo.jpeg`

const settings = useSiteSettings()
const events = useEvents()
const today = useToday()

const nextEvent = computed(
  () =>
    events.value
      .filter((e) => e.starts_on >= today.value)
      .sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0] ?? null,
)
const nextDate = computed(() => (nextEvent.value ? dateParts(nextEvent.value.starts_on) : null))

const socials = computed(() => socialLinks(settings.value))
// Tombola en cours (seulement si la rubrique est publique)
const raffles = useRaffles()
const raffle = computed(() => liveRaffle(raffles.value, settings.value))
const extras = computed(() => parseLinks(settings.value.extra_links))

// Style commun des gros boutons
const btn =
  'group flex w-full items-center gap-3 border border-line bg-grave px-5 py-4 font-mono text-sm uppercase tracking-widest transition-colors hover:border-bone hover:bg-bone hover:text-void'
</script>

<template>
  <div class="relative min-h-screen">
    <div class="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] opacity-[0.1]" aria-hidden="true">
      <Vinyl />
    </div>

    <main class="relative mx-auto flex max-w-md flex-col items-center px-5 py-12">
      <!-- en-tête -->
      <NuxtLink to="/" class="group flex flex-col items-center text-center">
        <span class="block h-28 w-28 overflow-hidden rounded-full border border-line bg-ink">
          <img :src="logoSrc" alt="Logo SONIKLAB" class="h-full w-full object-cover mix-blend-screen" />
        </span>
        <h1 class="glitch mt-5 font-display text-5xl uppercase tracking-wide">SONIKLAB</h1>
        <p class="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-ash">asso & collectif techno</p>
      </NuxtLink>
      <div class="mt-5 h-8 w-40">
        <Equalizer :bars="24" />
      </div>

      <div class="mt-8 flex w-full flex-col gap-3">
        <!-- prochaine date -->
        <NuxtLink
          v-if="nextEvent && nextDate"
          :to="nextEvent.ticket_url || '/evenements'"
          :target="nextEvent.ticket_url ? '_blank' : undefined"
          class="group flex w-full items-center gap-4 border border-bone bg-bone p-4 text-void transition-transform hover:-translate-y-0.5"
        >
          <span class="w-14 shrink-0 text-center">
            <span class="block font-display text-3xl leading-none">{{ nextDate.day }}</span>
            <span class="block font-mono text-[0.6rem] uppercase tracking-widest">{{ nextDate.month }}</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block font-mono text-[0.6rem] uppercase tracking-widest text-void/60">Prochaine date</span>
            <span class="block truncate font-display text-xl uppercase leading-tight">{{ nextEvent.title }}</span>
            <span v-if="nextEvent.venue || nextEvent.city" class="block truncate text-xs text-void/70">
              {{ [nextEvent.venue, nextEvent.city].filter(Boolean).join(' — ') }}
            </span>
            <span v-if="nextEvent.entry" class="block truncate font-mono text-[0.6rem] uppercase tracking-widest text-void/70">
              {{ entryLabel(nextEvent.entry) }}
            </span>
          </span>
          <span class="shrink-0 font-mono text-[0.65rem] uppercase tracking-widest">
            {{ nextEvent.ticket_url ? 'Billets' : 'Infos' }} ↗
          </span>
        </NuxtLink>

        <!-- tombola en cours -->
        <NuxtLink v-if="raffle" to="/tombola" :class="btn">
          <AppIcon name="ticket" class="h-5 w-5 shrink-0" />
          <span class="min-w-0 flex-1 truncate">Tombola{{ raffle.prizes[0] ? ` : ${raffle.prizes[0].name}` : '' }}</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </NuxtLink>

        <!-- réseaux & dons -->
        <a
          v-for="l in socials"
          :key="l.url"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="btn"
        >
          <AppIcon :name="l.icon" class="h-5 w-5 shrink-0" />
          <span class="flex-1">{{ l.label }}</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </a>

        <!-- liens libres (admin → Textes & réseaux) -->
        <a
          v-for="l in extras"
          :key="l.url"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="btn"
        >
          <AppIcon name="arrow" class="h-5 w-5 shrink-0" />
          <span class="flex-1">{{ l.label }}</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </a>

        <!-- contact -->
        <EmailAction
          v-if="settings.contact_email"
          :email="settings.contact_email"
          subject="Contact / booking SONIKLAB"
          block
          :class="btn + ' text-left'"
        >
          <AppIcon name="mail" class="h-5 w-5 shrink-0" />
          <span class="flex-1">Nous écrire / booking</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </EmailAction>

        <!-- pages du site -->
        <NuxtLink to="/collaborer" :class="btn">
          <AppIcon name="broadcast" class="h-5 w-5 shrink-0" />
          <span class="flex-1">Booker un DJ / collaborer</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
        <NuxtLink to="/evenements" :class="btn">
          <AppIcon name="image" class="h-5 w-5 shrink-0" />
          <span class="flex-1">Nos soirées en photos</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
        <NuxtLink to="/" :class="btn">
          <AppIcon name="play" class="h-5 w-5 shrink-0" />
          <span class="flex-1">Le site & nos artistes</span>
          <AppIcon name="arrow" class="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>

      <p class="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-ash">soniklab.fr</p>
    </main>
  </div>
</template>
