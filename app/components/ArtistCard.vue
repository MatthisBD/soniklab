<script setup lang="ts">
import type { Artist } from '~/composables/useShowcase'
import { linkIcon } from '~/composables/useMedia'

const props = defineProps<{ artist: Artist; track: string }>()

const initials = computed(() =>
  props.artist.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join(''),
)
const subtitle = computed(() => [props.artist.role, props.artist.style].filter(Boolean).join(' · '))
</script>

<template>
  <article
    class="group reveal relative flex flex-col border border-line bg-grave transition-colors duration-300 hover:bg-bone hover:text-void"
  >
    <!-- visuel : la photo, sinon un « macaron » de vinyle avec les initiales -->
    <div class="relative aspect-[4/5] overflow-hidden border-b border-line bg-ink group-hover:border-void/20">
      <img
        v-if="artist.photo_url"
        :src="artist.photo_url"
        :alt="artist.name"
        loading="lazy"
        class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div v-else class="grooves flex h-full w-full items-center justify-center">
        <span
          class="flex h-28 w-28 items-center justify-center rounded-full bg-bone font-display text-4xl text-void transition-transform duration-700 group-hover:rotate-[30deg]"
        >
          {{ initials }}
        </span>
      </div>
      <span class="absolute left-3 top-3 bg-void/80 px-1.5 py-0.5 font-mono text-[0.65rem] tracking-widest text-bone">
        {{ track }}
      </span>
    </div>

    <div class="flex flex-1 flex-col p-5">
      <h3 class="glitch font-display text-3xl uppercase leading-none tracking-wide">{{ artist.name }}</h3>
      <p v-if="subtitle" class="mt-2 font-mono text-[0.7rem] uppercase tracking-widest text-ash group-hover:text-void/60">
        {{ subtitle }}
      </p>
      <p v-if="artist.bio" class="mt-3 line-clamp-4 text-sm text-smoke group-hover:text-void/75">
        {{ artist.bio }}
      </p>

      <div v-if="artist.links.length" class="mt-auto flex flex-wrap gap-2 pt-5">
        <a
          v-for="l in artist.links"
          :key="l.url"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-widest transition-colors hover:bg-void hover:text-bone group-hover:border-void/30"
        >
          <AppIcon :name="linkIcon(l.url)" class="h-3.5 w-3.5" />
          {{ l.label || 'Écouter' }}
        </a>
      </div>
    </div>
  </article>
</template>
