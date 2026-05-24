<script setup lang="ts">
defineProps<{ words: string[] }>()
</script>

<template>
  <div class="marquee relative flex overflow-hidden border-y border-line bg-bone py-3 text-void select-none">
    <!-- deux copies pour une boucle continue -->
    <div class="marquee-track flex shrink-0 items-center whitespace-nowrap">
      <template v-for="(w, i) in [...words, ...words]" :key="i">
        <span class="px-6 font-display text-lg tracking-[0.15em] uppercase">{{ w }}</span>
        <span class="font-display text-lg" aria-hidden="true">✺</span>
      </template>
    </div>
  </div>
</template>
