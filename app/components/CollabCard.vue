<script setup lang="ts">
import type { Collaborator } from '~/composables/useShowcase'

defineProps<{ collab: Collaborator }>()
</script>

<template>
  <component
    :is="collab.url ? 'a' : 'div'"
    :href="collab.url || undefined"
    :target="collab.url ? '_blank' : undefined"
    :rel="collab.url ? 'noopener noreferrer' : undefined"
    class="group reveal relative flex items-center gap-4 border border-line bg-grave p-4 transition-colors duration-300 hover:bg-bone hover:text-void"
  >
    <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-line bg-ink group-hover:border-void/20">
      <img
        v-if="collab.logo_url"
        :src="collab.logo_url"
        :alt="collab.name"
        loading="lazy"
        class="h-full w-full object-contain p-1.5"
      />
      <span v-else class="font-display text-2xl text-bone">{{ collab.name.charAt(0).toUpperCase() }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="font-mono text-[0.6rem] uppercase tracking-widest text-ash group-hover:text-void/60">
        {{ [collab.kind, collab.city].filter(Boolean).join(' · ') || 'Partenaire' }}
      </p>
      <h3 class="truncate font-display text-xl uppercase leading-tight tracking-wide">{{ collab.name }}</h3>
      <p v-if="collab.description" class="mt-0.5 line-clamp-2 text-xs text-smoke group-hover:text-void/70">
        {{ collab.description }}
      </p>
    </div>
    <AppIcon
      v-if="collab.url"
      name="arrow"
      class="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-hover:translate-x-1"
    />
  </component>
</template>
