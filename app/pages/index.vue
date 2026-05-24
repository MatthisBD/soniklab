<script setup lang="ts">
const year = new Date().getFullYear()

// Préfixe du chemin (/soniklab/ en prod sur GitHub Pages, / en dev)
// pour que les fichiers de public/ se chargent quel que soit l'hébergement.
const base = useRuntimeConfig().app.baseURL
const logoSrc = `${base}soniklab-logo.jpeg`

// Données dynamiques depuis Supabase. server:false → on charge côté client,
// donc le site reflète toujours les dernières modifs faites dans l'admin.
const supabase = useSupabase()
const { data: linkGroups } = await useAsyncData(
  'link-groups',
  () => fetchLinkGroups(supabase),
  { server: false, default: () => [] },
)
const { data: tickerWords } = await useAsyncData(
  'ticker-words',
  () => fetchTickerWords(supabase),
  { server: false, default: () => [] },
)

// Apparition au scroll — (ré)observe les éléments .reveal pas encore animés.
// Appelée au montage ET à chaque arrivée de nouvelles cartes (données async).
let io: IntersectionObserver | null = null
function setupReveal() {
  if (!import.meta.client) return
  io ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((e, idx) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          setTimeout(() => el.classList.add('in'), (idx % 4) * 90)
          io!.unobserve(el)
        }
      })
    },
    { threshold: 0.12 },
  )
  document
    .querySelectorAll<HTMLElement>('.reveal:not(.in)')
    .forEach((el) => io!.observe(el))
}

onMounted(setupReveal)
watch(linkGroups, () => nextTick(setupReveal))
</script>

<template>
  <div class="relative">
    <!-- ====================== TOP BAR ====================== -->
    <header class="sticky top-0 z-50 border-b border-line bg-void/80 backdrop-blur-sm">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#top" class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em]">
          <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-bone" />
          SONIKLAB
        </a>
        <nav class="hidden gap-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ash sm:flex">
          <a v-for="g in linkGroups" :key="g.id" :href="`#${g.id}`" class="transition-colors hover:text-bone">
            {{ g.title }}
          </a>
        </nav>
        <div class="flex items-center gap-4">
          <span class="hidden font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ash sm:inline">le&nbsp;QG</span>
          <NuxtLink
            to="/admin"
            class="inline-flex items-center gap-1.5 border border-line px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-smoke transition-colors hover:border-bone hover:text-bone"
          >
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-smoke" />
            Connexion
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- ====================== HERO ====================== -->
    <section id="top" class="relative overflow-hidden">
      <!-- vinyle géant en fond -->
      <div
        class="pointer-events-none absolute -right-32 -top-24 h-[34rem] w-[34rem] opacity-[0.13] sm:-right-20 md:opacity-20"
        aria-hidden="true"
      >
        <Vinyl />
      </div>

      <div class="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
        <div>
          <p class="flicker mb-4 inline-flex items-center gap-2 border border-line px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-smoke">
            ● collectif techno — en activité
          </p>

          <h1 class="font-display text-6xl uppercase leading-[0.85] tracking-tight sm:text-7xl md:text-8xl">
            Le repaire<br />
            du <span class="glitch inline-block">soundsystem</span>
          </h1>

          <p class="mt-6 max-w-md text-lg text-smoke">
            Pas un site vitrine. Le <strong class="text-bone">QG de l'asso</strong> : tous nos
            raccourcis au même endroit. HelloAsso, la to-do, les réseaux, le drive — on clique, on bosse,
            on remonte le son.
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <a
              href="#liens"
              class="group inline-flex items-center gap-2 bg-bone px-5 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
            >
              Accéder aux raccourcis
              <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#docs"
              class="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
            >
              Les docs
            </a>
          </div>
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
    <Marquee :words="tickerWords" />

    <!-- ====================== LIENS ====================== -->
    <section id="liens" class="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div class="reveal mb-10 flex items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// la table de mixage</p>
          <h2 class="mt-2 font-display text-4xl uppercase tracking-wide sm:text-5xl">Les raccourcis</h2>
        </div>
        <span class="hidden font-mono text-xs uppercase tracking-widest text-ash sm:block">
          {{ linkGroups.length }} canaux
        </span>
      </div>

      <div class="grid gap-5 sm:grid-cols-2">
        <LinkCard
          v-for="g in linkGroups"
          :id="g.id"
          :key="g.id"
          :group="g"
          class="scroll-mt-24"
        />
      </div>

      <p class="reveal mt-8 font-mono text-xs leading-relaxed text-ash">
        Les liens marqués <span class="border border-ash/40 px-1.5 py-0.5">à brancher</span> sont à
        compléter depuis l'<NuxtLink to="/admin" class="text-smoke underline-offset-2 hover:underline">espace admin</NuxtLink>.
      </p>
    </section>

    <!-- ====================== FOOTER ====================== -->
    <footer class="border-t border-line">
      <div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="font-display text-2xl uppercase tracking-wide">SONIKLAB</p>
          <p class="mt-1 max-w-xs text-sm text-ash">
            Collectif techno — fête de la musique, guinguettes, bars & open airs.
          </p>
        </div>
        <div class="h-10 w-40 self-end sm:self-center">
          <Equalizer :bars="40" />
        </div>
        <p class="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ash">
          © {{ year }} · fait avec ❤ & 909 ·
          <NuxtLink to="/admin" class="transition-colors hover:text-bone">admin</NuxtLink>
        </p>
      </div>
    </footer>
  </div>
</template>
