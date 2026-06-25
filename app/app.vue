<script setup lang="ts">
const route = useRoute()

// Sur les outils internes (admin, budget), on coupe le grain animé : on y édite
// du contenu, et un fond qui bouge fatigue/distrait. On garde les scanlines.
const isTool = computed(
  () => route.path.startsWith('/admin') || route.path.startsWith('/budget'),
)
const surfaceClass = computed(() => (isTool.value ? 'scanlines' : 'grain scanlines'))
</script>

<template>
  <div :class="['min-h-screen bg-void text-bone', surfaceClass]">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
