<script setup lang="ts">
import {
  type Artist,
  type SonikEvent,
  fetchArtists,
  fetchCollaborators,
  socialLinks,
} from '~/composables/useShowcase'

// La vitrine publique de l'asso. Tout le contenu s'édite depuis /admin.

// Préfixe du chemin (/soniklab/ en prod sur GitHub Pages, / en dev)
// pour que les fichiers de public/ se chargent quel que soit l'hébergement.
const base = useRuntimeConfig().app.baseURL
const logoSrc = `${base}soniklab-logo.jpeg`

const artists = useShowcaseData('artists', fetchArtists, () => [])
const events = useEvents()
const collabs = useShowcaseData('collaborators', fetchCollaborators, () => [])
const settings = useSiteSettings()
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

// (l'email a son propre bouton EmailAction : menu Gmail / appli mail / copier)
// Liens rapides du haut de page : don HelloAsso, Instagram, SoundCloud (admin → Textes & réseaux)
const quickLinks = computed(() => socialLinks(settings.value))
// Bouton email de la rangée : adresse en minuscules (lisible), même cadre que les autres liens.
const MAIL_BTN =
  'inline-flex items-center gap-1.5 border border-line px-3 py-1.5 font-mono text-[0.75rem] tracking-wide text-smoke transition-colors hover:border-bone hover:bg-bone hover:text-void'

const contactLinks = computed(() =>
  [
    settings.value.instagram_url && { label: 'Instagram', icon: 'instagram', url: settings.value.instagram_url },
    settings.value.soundcloud_url && { label: 'SoundCloud', icon: 'soundcloud', url: settings.value.soundcloud_url },
  ].filter(Boolean) as { label: string; icon: string; url: string }[],
)

// Sous les artistes : booker un de nos DJ, ou nous proposer ses sets pour jouer ensemble.
const ARTIST_CTAS = [
  { to: '/collaborer?profil=booking', title: 'Un DJ pour ta soirée ?', text: 'Bar, soirée privée, festival : on vient avec le son' },
  { to: '/collaborer?profil=artiste', title: 'Tu mixes ?', text: 'Envoie-nous tes sets, on écoute tout' },
]

const opened = ref<SonikEvent | null>(null)
// Fiche artiste ouverte (avec son n° de « piste » A1, A2…)
const openedArtist = ref<{ artist: Artist; track: string } | null>(null)

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

          <!-- liens rapides : visibles dès l'arrivée, sans scroller -->
          <div v-if="quickLinks.length || settings.contact_email" class="mt-5 flex flex-wrap items-center gap-2">
            <template v-for="l in quickLinks" :key="l.url">
              <a
                :href="l.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[0.7rem] uppercase tracking-widest transition-colors hover:border-bone hover:bg-bone hover:text-void"
                :class="l.icon === 'heart' ? 'border-bone/60 text-bone' : 'border-line text-smoke'"
              >
                <AppIcon :name="l.icon" class="h-3.5 w-3.5" />
                {{ l.label }}
              </a>
              <!-- l'adresse mail en clair, juste après Instagram (menu Gmail / appli / copier) -->
              <EmailAction
                v-if="l.icon === 'instagram' && settings.contact_email"
                :email="settings.contact_email"
                subject="Contact SONIKLAB"
                placement="top"
                :class="MAIL_BTN"
              >
                <AppIcon name="mail" class="h-3.5 w-3.5" />
                {{ settings.contact_email }}
              </EmailAction>
            </template>
            <!-- pas d'Instagram renseigné : l'email se place en fin de rangée -->
            <EmailAction
              v-if="settings.contact_email && !quickLinks.some((l) => l.icon === 'instagram')"
              :email="settings.contact_email"
              subject="Contact SONIKLAB"
              placement="top"
              :class="MAIL_BTN"
            >
              <AppIcon name="mail" class="h-3.5 w-3.5" />
              {{ settings.contact_email }}
            </EmailAction>
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
          @open="openedArtist = { artist: a, track: `A${i + 1}` }"
        />
      </div>
      <p v-else class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
        Line-up en cours de pressage…
      </p>

      <!-- deux appels : booker un de nos DJ / proposer ses sets (collab, pas recrutement) -->
      <div class="mt-8 grid gap-4 sm:grid-cols-2">
        <NuxtLink
          v-for="c in ARTIST_CTAS"
          :key="c.to"
          :to="c.to"
          class="reveal group flex items-center justify-between gap-4 border border-line px-5 py-4 transition-colors hover:bg-bone hover:text-void"
        >
          <span>
            <span class="block font-display text-2xl uppercase tracking-wide">{{ c.title }}</span>
            <span class="font-mono text-xs uppercase tracking-widest text-ash group-hover:text-void/60">
              {{ c.text }}
            </span>
          </span>
          <AppIcon name="arrow" class="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
        </NuxtLink>
      </div>
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
          <EmailAction
            v-if="settings.contact_email"
            :email="settings.contact_email"
            subject="Contact / booking SONIKLAB"
            class="inline-flex items-center gap-2 bg-void px-5 py-3 font-mono text-sm uppercase tracking-widest text-bone transition-transform hover:-translate-y-0.5"
          >
            <AppIcon name="mail" class="h-4 w-4" />
            Écrire un mail
          </EmailAction>
          <a
            v-for="l in contactLinks"
            :key="l.url"
            :href="l.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group inline-flex items-center gap-2 border border-void/30 px-5 py-3 font-mono text-sm uppercase tracking-widest transition-transform hover:-translate-y-0.5 hover:border-void"
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
            to="/collaborer"
            class="inline-flex items-center gap-2 border border-void/30 px-5 py-3 font-mono text-sm uppercase tracking-widest transition-transform hover:-translate-y-0.5 hover:border-void"
          >
            Proposer une collab
            <AppIcon name="arrow" class="h-4 w-4" />
          </NuxtLink>
        </div>
        <p v-if="settings.contact_email" class="mt-5 font-mono text-xs tracking-wider text-void/60">
          ou directement :
          <CopyText :text="settings.contact_email" class="text-void hover:text-void/70" />
        </p>
      </div>
    </section>

    <SiteFooter />

    <EventGallery :event="opened" @close="opened = null" />
    <ArtistModal :artist="openedArtist?.artist ?? null" :track="openedArtist?.track" @close="openedArtist = null" />
  </div>
</template>
