<script setup lang="ts">
import type { LinkGroup } from '~/data/links'

defineProps<{ group: LinkGroup }>()

const isPlaceholder = (url: string) => url === '#' || url.trim() === ''
</script>

<template>
  <article
    class="group reveal relative flex flex-col border border-line bg-grave transition-colors duration-300 hover:bg-bone hover:text-void"
  >
    <!-- liseré supérieur -->
    <span class="absolute inset-x-0 -top-px h-px bg-bone/30 group-hover:bg-void/30" />

    <!-- en-tête -->
    <header class="flex items-start gap-4 border-b border-line p-5 group-hover:border-void/20">
      <span class="font-mono text-xs tracking-widest text-ash group-hover:text-void/60">
        {{ group.track }}
      </span>
      <AppIcon :name="group.icon" class="mt-0.5 h-7 w-7 shrink-0" />
      <div class="min-w-0">
        <h3 class="glitch font-display text-2xl uppercase leading-none tracking-wide">
          {{ group.title }}
        </h3>
        <p class="mt-1 text-sm text-smoke group-hover:text-void/70">
          {{ group.tagline }}
        </p>
      </div>
    </header>

    <!-- liens -->
    <ul class="flex flex-1 flex-col divide-y divide-line group-hover:divide-void/15">
      <li v-for="link in group.links" :key="link.label">
        <a
          :href="link.url"
          :target="isPlaceholder(link.url) ? undefined : '_blank'"
          rel="noopener noreferrer"
          class="group/link flex items-center gap-3 px-5 py-3.5 transition-all duration-200 hover:bg-bone hover:pl-7 hover:text-void group-hover:hover:bg-void group-hover:hover:text-bone"
        >
          <span class="flex-1 truncate">
            <span class="font-medium">{{ link.label }}</span>
            <span v-if="link.note" class="ml-2 font-mono text-[0.65rem] uppercase tracking-wider text-ash">
              {{ link.note }}
            </span>
          </span>

          <span
            v-if="isPlaceholder(link.url)"
            class="rounded-sm border border-ash/40 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-ash"
          >
            à brancher
          </span>
          <AppIcon name="arrow" class="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-hover/link:translate-x-1" />
        </a>
      </li>
    </ul>
  </article>
</template>
