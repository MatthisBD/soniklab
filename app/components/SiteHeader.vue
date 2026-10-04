<script setup lang="ts">
// Barre du haut des pages publiques : navigation + « Connexion » à droite
// (réservée aux membres de l'asso → mène à l'espace membres /qg).
const auth = useAuth()
onMounted(() => auth.init())

const route = useRoute()
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

const nav = [
  { to: '/#artistes', label: 'Artistes' },
  { to: '/#dates', label: 'Dates' },
  { to: '/evenements', label: 'Événements' },
  { to: '/#collabs', label: 'Collabs' },
  { to: '/asso', label: "L'asso" },
  { to: '/collaborer', label: 'Booking' },
]
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-void/80 backdrop-blur-sm">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
      <NuxtLink to="/" class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em]">
        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-bone" />
        SONIKLAB
      </NuxtLink>

      <nav class="hidden gap-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ash lg:flex">
        <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" class="transition-colors hover:text-bone">
          {{ n.label }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <NuxtLink
          to="/qg"
          class="inline-flex items-center gap-1.5 border border-line px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-smoke transition-colors hover:border-bone hover:text-bone"
        >
          <template v-if="auth.isLoggedIn.value">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-bone" />
            Espace membres
          </template>
          <template v-else>Connexion</template>
        </NuxtLink>
        <button
          type="button"
          class="border border-line p-1.5 text-smoke transition-colors hover:border-bone hover:text-bone lg:hidden"
          :aria-expanded="open"
          aria-label="Menu"
          @click="open = !open"
        >
          <AppIcon :name="open ? 'close' : 'menu'" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- menu mobile -->
    <nav v-if="open" class="border-t border-line lg:hidden">
      <NuxtLink
        v-for="n in nav"
        :key="n.to"
        :to="n.to"
        class="block border-b border-line px-5 py-3.5 font-display text-2xl uppercase tracking-wide transition-colors last:border-b-0 hover:bg-bone hover:text-void"
      >
        {{ n.label }}
      </NuxtLink>
    </nav>
  </header>
</template>
