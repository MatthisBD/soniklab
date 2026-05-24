<script setup lang="ts">
withDefaults(defineProps<{ bars?: number }>(), { bars: 48 })

// Décalages et durées pseudo-aléatoires mais déterministes (pas de mismatch SSR)
function jitter(i: number, mod: number, base: number) {
  return base + (((i * 9301 + 49297) % mod) / mod)
}
</script>

<template>
  <div class="flex h-full w-full items-end gap-[2px]">
    <span
      v-for="i in bars"
      :key="i"
      class="eq-bar block w-full bg-bone"
      :style="{
        height: '100%',
        animationDuration: `${jitter(i, 60, 0.5)}s`,
        animationDelay: `-${jitter(i, 100, 0)}s`,
        opacity: 0.55 + (i % 5) * 0.09,
      }"
    />
  </div>
</template>
