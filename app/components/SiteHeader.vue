<script setup lang="ts">
// Barre du haut des pages publiques : navigation + « Connexion » à droite
// (réservée aux membres de l'asso → mène à l'espace membres /qg).
const auth = useAuth()
onMounted(() => auth.init())

const route = useRoute()
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

// « Tombola » : dans le menu seulement quand la rubrique est publique
// (admin → Tombola). En attendant, les admins la voient avec un cadenas.
const settings = useSiteSettings()
const rafflePublic = computed(() => !!settings.value.raffle_public.trim())

type NavItem = { to: string; label: string; locked?: boolean }
const nav = computed<NavItem[]>(() => [
  { to: '/#artistes', label: 'Artistes' },
  { to: '/#dates', label: 'Dates' },
  { to: '/evenements', label: 'Événements' },
  { to: '/#collabs', label: 'Collabs' },
  { to: '/asso', label: "L'asso" },
  ...(rafflePublic.value || auth.isAdmin.value
    ? [{ to: '/tombola', label: 'Tombola', locked: !rafflePublic.value }]
    : []),
  { to: '/collaborer', label: 'Booking' },
])
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-void/80 backdrop-blur-sm">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
      <NuxtLink to="/" class="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em]">
        <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-bone" />
        SONIKLAB
      </NuxtLink>

      <nav class="hidden gap-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ash lg:flex">
        <NuxtLink
          v-for="n in nav"
          :key="n.to"
          :to="n.to"
          class="inline-flex items-center gap-1 transition-colors hover:text-bone"
          :title="n.locked ? 'Rubrique privée : visible des admins seulement' : undefined"
        >
          <AppIcon v-if="n.locked" name="lock" class="h-3 w-3" />
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
        class="flex items-center gap-2 border-b border-line px-5 py-3.5 font-display text-2xl uppercase tracking-wide transition-colors last:border-b-0 hover:bg-bone hover:text-void"
      >
        {{ n.label }}
        <AppIcon v-if="n.locked" name="lock" class="h-4 w-4 opacity-60" />
      </NuxtLink>
    </nav>
  </header>
</template>
