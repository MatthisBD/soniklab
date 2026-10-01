<script setup lang="ts">
import {
  type SonikEvent,
  SETTINGS_DEFAULTS,
  fetchArtists,
  fetchCollaborators,
  fetchEvents,
  fetchSettings,
} from '~/composables/useShowcase'

// La vitrine publique de l'asso. Tout le contenu s'édite depuis /admin.

// Préfixe du chemin (/soniklab/ en prod sur GitHub Pages, / en dev)
// pour que les fichiers de public/ se chargent quel que soit l'hébergement.
const base = useRuntimeConfig().app.baseURL
const logoSrc = `${base}soniklab-logo.jpeg`

const artists = useShowcaseData('artists', fetchArtists, () => [])
const events = useShowcaseData('events', fetchEvents, () => [])
const collabs = useShowcaseData('collaborators', fetchCollaborators, () => [])
const settings = useShowcaseData('site-settings', fetchSettings, () => ({ ...SETTINGS_DEFAULTS }))
const tickerWords = useShowcaseData('ticker-words', fetchTickerWords, () => [])

const today = useToday()
const upcoming = computed(() =>
  events.value.filter((e) => e.starts_on >= today.value).sort((a, b) => a.starts_on.localeCompare(b.starts_on)),
)
// déjà triés du plus récent au plus ancien
const past = computed(() => events.value.filter((e) => e.starts_on < today.value))
const PAST_ON_HOME = 6

const stats = computed(() =>
  [
    [artists.value.length, 'artiste'],
    [events.value.length, 'événement'],
    [collabs.value.length, 'collab'],
  ]
    .filter(([n]) => n)
    .map(([n, label]) => `${n} ${label}${(n as number) > 1 ? 's' : ''}`),
)

const contactLinks = computed(() =>
  [
    settings.value.contact_email && {
      label: 'Écrire un mail',
      icon: 'mail',
      url: `mailto:${settings.value.contact_email}`,
      primary: true,
    },
    settings.value.instagram_url && { label: 'Instagram', icon: 'instagram', url: settings.value.instagram_url },
    settings.value.soundcloud_url && { label: 'SoundCloud', icon: 'soundcloud', url: settings.value.soundcloud_url },
  ].filter(Boolean) as { label: string; icon: string; url: string; primary?: boolean }[],
)

const opened = ref<SonikEvent | null>(null)

useReveal()
</script>

<template>
  <div class="relative">
    <SiteHeader />

    <!-- ====================== HERO ====================== -->
    <section id="top" class="relative overflow-hidden">
      <!-- vinyle géant en fond -->
      <div
        class="pointer-events-none absolute -right-32 -top-24 h-[34rem] w-[34rem] opacity-[0.13] sm:-right-20 md:opacity-20"
        aria-hidden="true"
      >
        <Vinyl />
      </div>

      <div class="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 md:grid-cols-[1.2fr_1fr] md:items-center md:py-14">
        <div>
          <p class="flicker mb-4 inline-flex items-center gap-2 border border-line px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-smoke">
            ● asso & collectif techno
          </p>

          <h1 class="font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl md:text-8xl">
            Le son<br />
            qui <span class="glitch inline-block">rassemble</span>
          </h1>

          <p class="mt-6 max-w-md text-lg text-smoke">{{ settings.hero_text }}</p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a
              href="#artistes"
              class="group inline-flex items-center gap-2 bg-bone px-5 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
            >
              Les artistes
              <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#dates"
              class="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
            >
              Prochaines dates
            </a>
            <a
              href="#booking"
              class="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
            >
              Nous booker
            </a>
          </div>

          <p v-if="stats.length" class="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-ash">
            {{ stats.join(' · ') }}
          </p>
        </div>

        <!-- logo -->
        <div class="reveal relative mx-auto w-full max-w-sm">
          <div class="relative aspect-square overflow-hidden border border-line bg-ink">
            <img
              :src="logoSrc"
              alt="Logo SONIKLAB"
              class="h-full w-full object-cover mix-blend-screen"
              loading="eager"
            />
            <span class="pointer-events-none absolute inset-0 ring-1 ring-inset ring-bone/10" />
          </div>
          <!-- equalizer sous le logo -->
          <div class="mt-3 h-12 w-full">
            <Equalizer :bars="56" />
          </div>
        </div>
      </div>
    </section>

    <!-- ====================== MARQUEE ====================== -->
    <Marquee v-if="tickerWords.length" :words="tickerWords" />

    <!-- ====================== ARTISTES ====================== -->
    <section id="artistes" class="mx-auto max-w-6xl scroll-mt-16 px-5 py-12 md:py-16">
      <SectionHead
        kicker="// face A — le line-up"
        title="Les artistes"
        :aside="artists.length ? `${artists.length} au line-up` : undefined"
      />

      <div v-if="artists.length" class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ArtistCard
          v-for="(a, i) in artists"
          :key="a.id"
          :artist="a"
          :track="`A${i + 1}`"
        />
      </div>
      <p v-else class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
        Line-up en cours de pressage…
      </p>

      <NuxtLink
        to="/rejoindre?profil=artiste"
        class="reveal group mt-8 flex items-center justify-between gap-4 border border-line px-5 py-4 transition-colors hover:bg-bone hover:text-void"
      >
        <span>
          <span class="block font-display text-2xl uppercase tracking-wide">Tu mixes&nbsp;?</span>
          <span class="font-mono text-xs uppercase tracking-widest text-ash group-hover:text-void/60">
            Envoie-nous tes sets, on écoute tout
          </span>
        </span>
        <AppIcon name="arrow" class="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </NuxtLink>
    </section>

    <!-- ====================== PROCHAINES DATES ====================== -->
    <section id="dates" class="scroll-mt-16 border-y border-line bg-ink">
      <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <SectionHead kicker="// prochainement" title="Prochaines dates" />

        <div v-if="upcoming.length" class="-mt-5">
          <UpcomingEvent v-for="e in upcoming" :key="e.id" :event="e" />
        </div>
        <p v-else class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
          Pas de date annoncée pour l'instant
          <template v-if="settings.instagram_url">
            — suis-nous sur
            <a :href="settings.instagram_url" target="_blank" rel="noopener noreferrer" class="text-smoke underline underline-offset-2 hover:text-bone">Instagram</a>
            pour ne rien rater.
          </template>
        </p>
      </div>
    </section>

    <!-- ====================== ÉVÉNEMENTS PASSÉS ====================== -->
    <section id="evenements" class="mx-auto max-w-6xl scroll-mt-16 px-5 py-12 md:py-16">
      <SectionHead kicker="// face B — les archives" title="On y était">
        <template #aside>
          <NuxtLink
            v-if="past.length"
            to="/evenements"
            class="hidden font-mono text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone sm:block"
          >
            Tout voir →
          </NuxtLink>
        </template>
      </SectionHead>

      <template v-if="past.length">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <PastEventCard
            v-for="e in past.slice(0, PAST_ON_HOME)"
            :key="e.id"
            :event="e"
            @open="opened = e"
          />
        </div>
        <NuxtLink
          v-if="past.length > PAST_ON_HOME"
          to="/evenements"
          class="mt-8 inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
        >
          Toutes les archives ({{ past.length }})
          <AppIcon name="arrow" class="h-4 w-4" />
        </NuxtLink>
      </template>
      <p v-else class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
        Les photos de nos soirées arrivent bientôt.
      </p>
    </section>

    <!-- ====================== COLLABORATEURS ====================== -->
    <section id="collabs" class="scroll-mt-16 border-t border-line">
      <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <SectionHead
          kicker="// on bosse avec"
          title="Collaborateurs"
          :aside="collabs.length ? `${collabs.length} partenaires` : undefined"
        />

        <div v-if="collabs.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CollabCard v-for="c in collabs" :key="c.id" :collab="c" />
        </div>
        <p v-else class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
          Bars, guinguettes, assos : la liste arrive.
        </p>
      </div>
    </section>

    <!-- ====================== L'ASSO (teaser) ====================== -->
    <section class="border-t border-line">
      <div class="reveal mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr_1.4fr] md:items-center md:py-16">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// qui on est</p>
          <h2 class="mt-2 font-display text-5xl uppercase leading-none tracking-wide sm:text-6xl">
            Une asso,<br />un <span class="glitch inline-block">collectif</span>
          </h2>
        </div>
        <div>
          <p class="text-lg text-smoke">{{ settings.about_intro }}</p>
          <NuxtLink
            to="/asso"
            class="group mt-6 inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
          >
            Découvrir l'asso
            <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ====================== BOOKING / CONTACT ====================== -->
    <section id="booking" class="scroll-mt-16 bg-bone text-void">
      <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-void/60">// booking & contact</p>
        <h2 class="mt-2 font-display text-6xl uppercase leading-[0.95] tracking-wide sm:text-8xl">
          On ramène<br />le son ?
        </h2>
        <p class="mt-6 max-w-xl text-lg text-void/75">{{ settings.booking_text }}</p>

        <div class="mt-8 flex flex-wrap gap-3">
          <a
            v-for="l in contactLinks"
            :key="l.url"
            :href="l.url"
            :target="l.url.startsWith('mailto:') ? undefined : '_blank'"
            rel="noopener noreferrer"
            class="group inline-flex items-center gap-2 px-5 py-3 font-mono text-sm uppercase tracking-widest transition-transform hover:-translate-y-0.5"
            :class="l.primary ? 'bg-void text-bone' : 'border border-void/30 hover:border-void'"
          >
            <AppIcon :name="l.icon" class="h-4 w-4" />
            {{ l.label }}
          </a>
          <a
            v-if="settings.helloasso_url"
            :href="settings.helloasso_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 border border-void/30 px-5 py-3 font-mono text-sm uppercase tracking-widest transition-transform hover:-translate-y-0.5 hover:border-void"
          >
            <AppIcon name="heart" class="h-4 w-4" />
            Soutenir l'asso
          </a>
          <NuxtLink
            to="/rejoindre"
            class="inline-flex items-center gap-2 border border-void/30 px-5 py-3 font-mono text-sm uppercase tracking-widest transition-transform hover:-translate-y-0.5 hover:border-void"
          >
            Rejoindre le collectif
            <AppIcon name="arrow" class="h-4 w-4" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <SiteFooter />

    <EventGallery :event="opened" @close="opened = null" />
  </div>
</template>
