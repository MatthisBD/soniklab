<script setup lang="ts">
const route = useRoute()

// Sur l'espace admin, on coupe le grain animé : on y édite du contenu,
// et un fond qui bouge fatigue/distrait. On garde les scanlines (statiques).
const surfaceClass = computed(() =>
  route.path.startsWith('/admin') ? 'scanlines' : 'grain scanlines',
)
</script>

<template>
  <div :class="['min-h-screen bg-void text-bone', surfaceClass]">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
