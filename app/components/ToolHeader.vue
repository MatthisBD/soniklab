<script setup lang="ts">
// En-tête commun des pages internes (QG, budget, admin).
defineProps<{ kicker: string }>()

const auth = useAuth()
const route = useRoute()

const tools = [
  { to: '/qg', label: 'QG' },
  { to: '/budget', label: 'Budget' },
  { to: '/admin', label: 'Admin' },
]

async function onLogout() {
  await auth.signOut()
}
</script>

<template>
  <header class="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
    <NuxtLink to="/" class="group block">
      <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">{{ kicker }} · retour au site</p>
      <h1 class="mt-1 font-display text-4xl uppercase tracking-wide transition-colors group-hover:text-smoke">
        SONIKLAB
      </h1>
    </NuxtLink>
    <div class="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-widest md:gap-4">
      <!-- les outils : de vrais boutons, l'outil ouvert est inversé (blanc) -->
      <nav v-if="auth.isAdmin.value" class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="t in tools"
          :key="t.to"
          :to="t.to"
          class="border px-4 py-2.5 font-display text-lg leading-none tracking-wider transition-colors md:px-6 md:py-3 md:text-2xl"
          :class="route.path.startsWith(t.to)
            ? 'border-bone bg-bone text-void'
            : 'border-line text-smoke hover:border-bone hover:text-bone'"
        >
          {{ t.label }}
        </NuxtLink>
      </nav>
      <NuxtLink to="/" class="text-ash transition-colors hover:text-bone">← le site</NuxtLink>
      <button
        v-if="auth.isLoggedIn.value"
        class="border border-line px-3 py-2 text-smoke transition-colors hover:border-bone hover:text-bone"
        @click="onLogout"
      >
        Déconnexion
      </button>
    </div>
  </header>
</template>
