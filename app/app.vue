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
// Pages publiques autres que l'accueil (qui a son propre JSON-LD, plus complet) :
// on désigne le logo comme image principale → c'est lui que Google affiche
// en vignette du résultat (et pas un bout découpé de l'og:image).
const isPrivate = computed(() => /^\/(qg|budget|admin)/.test(route.path))
const pageLd = computed(() =>
  route.path === '/' || isPrivate.value
    ? []
    : [{ key: 'ld-page', type: 'application/ld+json', innerHTML: jsonLdString(buildPageJsonLd(siteUrl, canonical.value)) }],
)
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  meta: [{ property: 'og:url', content: canonical }],
  script: pageLd,
})

// Compteur de visiteurs (pied de page) : on ne compte que sur les pages
// publiques, pas sur les outils des membres (QG, budget, admin).
const visits = useVisitCounter()
onMounted(() => {
  watch(
    () => route.path,
    () => {
      if (!isPrivate.value) visits.track()
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
