<script setup lang="ts">
defineProps<{ kicker: string; title: string; aside?: string }>()
</script>

<template>
  <div class="reveal mb-10 flex items-end justify-between gap-4 border-b border-line pb-5">
    <div>
      <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">{{ kicker }}</p>
      <h2 class="mt-2 font-display text-4xl uppercase tracking-wide sm:text-5xl">{{ title }}</h2>
    </div>
    <slot name="aside">
      <span v-if="aside" class="hidden font-mono text-xs uppercase tracking-widest text-ash sm:block">
        {{ aside }}
      </span>
    </slot>
  </div>
</template>
