<script setup lang="ts">
const route = useRoute()

// Sur les outils internes (admin, budget), on coupe le grain animé : on y édite
// du contenu, et un fond qui bouge fatigue/distrait. On garde les scanlines.
const isTool = computed(
  () => route.path.startsWith('/admin') || route.path.startsWith('/budget'),
)
const surfaceClass = computed(() => (isTool.value ? 'scanlines' : 'grain scanlines'))

// Référencement : adresse « officielle » de chaque page (balise canonique).
// soniklab.fr et www.soniklab.fr affichent le même contenu → sans ça, Google
// peut y voir des doublons. Format avec « / » final, comme les URL servies.
const siteUrl = useRuntimeConfig().public.siteUrl as string
const canonical = computed(() => {
  const path = route.path === '/' ? '' : route.path.replace(/^\//, '').replace(/\/?$/, '/')
  return new URL(path, siteUrl).href
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  meta: [{ property: 'og:url', content: canonical }],
})

// Compteur de visiteurs (pied de page) : on ne compte que sur les pages
// publiques, pas sur les outils des membres (QG, budget, admin).
const visits = useVisitCounter()
onMounted(() => {
  watch(
    () => route.path,
    (path) => {
      if (!/^\/(qg|budget|admin)/.test(path)) visits.track()
    },
    { immediate: true },
  )
})
</script>

<template>
  <div :class="['min-h-screen bg-void text-bone', surfaceClass]">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
