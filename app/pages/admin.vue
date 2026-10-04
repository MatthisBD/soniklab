<script setup lang="ts">
// Espace admin : édition de la vitrine (artistes, événements, collabs,
// textes) et des liens du QG. Un onglet = un composant de components/admin/.
useHead({ title: 'SONIKLAB — Admin', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const router = useRouter()
const supabase = useSupabase()
const auth = useAuth()
const { message } = useFlash()

// Badge « nouvelles demandes » (booking & collab) sur l'onglet correspondant.
const newRequests = ref(0)
async function refreshCount() {
  newRequests.value = await countNewJoinRequests(supabase)
}
watch(() => auth.isAdmin.value, (isAdmin) => isAdmin && refreshCount(), { immediate: true })

const TABS = [
  { id: 'artistes', label: 'Artistes' },
  { id: 'evenements', label: 'Événements' },
  { id: 'collabs', label: 'Collabs' },
  { id: 'materiel', label: 'Matériel' },
  { id: 'candidatures', label: 'Demandes' },
  { id: 'textes', label: 'Textes & réseaux' },
  { id: 'liens', label: 'Liens du QG' },
  { id: 'compte', label: 'Mon compte' },
] as const

// L'onglet courant vit dans l'URL (?tab=…) : lien direct possible, et le
// bouton « retour » du navigateur fonctionne.
const tab = computed(() => {
  const q = route.query.tab
  return TABS.some((t) => t.id === q) ? (q as string) : 'artistes'
})
function selectTab(id: string) {
  router.replace({ query: { ...route.query, tab: id } })
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-5 py-10">
    <ToolHeader kicker="// espace admin" />

    <!-- message flash (partagé par tous les onglets) -->
    <p
      v-if="message"
      class="sticky top-3 z-40 mb-6 border border-line bg-grave px-4 py-3 font-mono text-sm text-bone shadow-lg"
    >
      {{ message }}
    </p>

    <AuthGate>
      <nav class="mb-8 flex flex-wrap gap-1 border-b border-line">
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="-mb-px border border-b-0 px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors"
          :class="tab === t.id ? 'border-line bg-grave text-bone' : 'border-transparent text-ash hover:text-bone'"
          @click="selectTab(t.id)"
        >
          {{ t.label }}
          <span
            v-if="t.id === 'candidatures' && newRequests"
            class="ml-1 inline-block min-w-4 bg-bone px-1 text-center text-void"
          >{{ newRequests }}</span>
        </button>
      </nav>

      <AdminArtists v-if="tab === 'artistes'" />
      <AdminEvents v-else-if="tab === 'evenements'" />
      <AdminCollabs v-else-if="tab === 'collabs'" />
      <AdminGear v-else-if="tab === 'materiel'" />
      <AdminJoin v-else-if="tab === 'candidatures'" @changed="refreshCount" />
      <AdminSettings v-else-if="tab === 'textes'" />
      <AdminLinks v-else-if="tab === 'liens'" />
      <AdminAccount v-else />
    </AuthGate>
  </div>
</template>
