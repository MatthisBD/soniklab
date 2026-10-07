<script setup lang="ts">
import { paragraphs, pillars } from '~/composables/useShowcase'

// « L'asso » : qui on est, ce qu'on fait. Textes éditables dans /admin → Textes.
useSeoMeta({
  title: "L'asso — SONIKLAB, collectif techno de Saint-Nazaire",
  description: "SONIKLAB, association et collectif techno de Saint-Nazaire : qui on est, ce qu'on fait.",
  ogTitle: "SONIKLAB — L'asso",
  ogDescription: "Association et collectif techno : qui on est, ce qu'on fait.",
})

const settings = useSiteSettings()
const body = computed(() => paragraphs(settings.value.about_body))
const blocks = computed(() => pillars(settings.value.about_pillars))

useReveal()
</script>

<template>
  <div class="relative">
    <SiteHeader />

    <!-- ====================== INTRO ====================== -->
    <section class="relative overflow-hidden border-b border-line">
      <div
        class="pointer-events-none absolute -left-40 -bottom-48 h-[30rem] w-[30rem] opacity-[0.12]"
        aria-hidden="true"
      >
        <Vinyl />
      </div>
      <div class="relative mx-auto max-w-6xl px-5 py-12">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// l'asso</p>
        <h1 class="title-room mt-1 font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl md:text-8xl">
          Plus qu'un<br />
          <span class="glitch inline-block">collectif</span>
        </h1>
        <p class="mt-8 max-w-2xl text-xl text-bone">{{ settings.about_intro }}</p>
      </div>
    </section>

    <!-- ====================== HISTOIRE ====================== -->
    <section class="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1fr_1.6fr]">
      <div class="reveal">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// notre histoire</p>
        <h2 class="title-room mt-1 font-display text-4xl uppercase tracking-wide sm:text-5xl">D'où on vient</h2>
        <div class="mt-6 h-12 w-full max-w-xs">
          <Equalizer :bars="32" />
        </div>
      </div>
      <div class="reveal space-y-5 text-lg text-smoke">
        <p v-for="(p, i) in body" :key="i">{{ p }}</p>
      </div>
    </section>

    <!-- ====================== CE QU'ON FAIT ====================== -->
    <section class="border-t border-line bg-ink">
      <div class="mx-auto max-w-6xl px-5 py-12">
        <SectionHead kicker="// notre rôle" title="Ce qu'on fait" />
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <article
            v-for="(b, i) in blocks"
            :key="b.title"
            class="group reveal border border-line bg-grave p-6 transition-colors duration-300 hover:bg-bone hover:text-void"
          >
            <span class="font-mono text-xs tracking-widest text-ash group-hover:text-void/60">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <h3 class="glitch mt-2 font-display text-3xl uppercase leading-none tracking-wide">{{ b.title }}</h3>
            <p v-if="b.text" class="mt-3 text-smoke group-hover:text-void/75">{{ b.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ====================== APPEL À L'ACTION ====================== -->
    <section class="border-t border-line">
      <div class="reveal mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:justify-between">
        <h2 class="font-display text-4xl uppercase leading-none tracking-wide sm:text-5xl">
          Envie de bosser<br />avec nous ?
        </h2>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            to="/#booking"
            class="group inline-flex items-center gap-2 bg-bone px-5 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
          >
            Nous contacter
            <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </NuxtLink>
          <NuxtLink
            to="/collaborer"
            class="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
          >
            Proposer une collab
          </NuxtLink>
          <a
            v-if="settings.helloasso_url"
            :href="settings.helloasso_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
          >
            <AppIcon name="heart" class="h-4 w-4" />
            Adhérer / soutenir
          </a>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>
