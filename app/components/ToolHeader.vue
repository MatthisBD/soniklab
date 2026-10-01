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
    <div class="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-widest">
      <template v-if="auth.isAdmin.value">
        <NuxtLink
          v-for="t in tools"
          :key="t.to"
          :to="t.to"
          class="transition-colors hover:text-bone"
          :class="route.path.startsWith(t.to) ? 'text-bone underline underline-offset-4' : 'text-ash'"
        >
          {{ t.label }}
        </NuxtLink>
      </template>
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
