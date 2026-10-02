<script setup lang="ts">
import {
  type JoinRequest,
  type JoinStatus,
  JOIN_PROFILES,
  fetchJoinRequests,
  parseClosedProfiles,
  profileLabel,
} from '~/composables/useJoin'
import { fetchSettings } from '~/composables/useShowcase'

// Demandes reçues via le formulaire public /rejoindre.
const emit = defineEmits<{ changed: [] }>()

const supabase = useSupabase()
const db = useShowcaseAdmin()
const { run } = useFlash()

const list = ref<JoinRequest[]>([])
const loading = ref(true)
const filter = ref<JoinStatus | 'all'>('new')

// Profils fermés (grisés et non cliquables sur /rejoindre).
const closed = ref<string[]>([])

onMounted(async () => {
  await run(async () => {
    list.value = await fetchJoinRequests(supabase)
    closed.value = parseClosedProfiles((await fetchSettings(supabase)).join_closed_profiles)
  })
  loading.value = false
})

async function toggleProfile(id: string) {
  const next = closed.value.includes(id) ? closed.value.filter((x) => x !== id) : [...closed.value, id]
  const ok = await run(
    () => db.saveSetting('join_closed_profiles', next.join(',')),
    `« ${profileLabel(id)} » ${next.includes(id) ? 'fermé' : 'ouvert'} sur le formulaire.`,
  )
  if (ok) closed.value = next
}

const STATUSES: { id: JoinStatus; label: string }[] = [
  { id: 'new', label: 'Nouvelles' },
  { id: 'contacted', label: 'Recontactées' },
  { id: 'archived', label: 'Archivées' },
]

const shown = computed(() => (filter.value === 'all' ? list.value : list.value.filter((r) => r.status === filter.value)))
const count = (s: JoinStatus) => list.value.filter((r) => r.status === s).length

async function setStatus(r: JoinRequest, status: JoinStatus) {
  const ok = await run(() => db.updateRow('join_requests', r.id, { status }))
  if (ok) {
    r.status = status
    emit('changed')
  }
}

async function remove(r: JoinRequest) {
  if (!confirm(`Supprimer définitivement la demande de « ${r.name} » ?`)) return
  const ok = await run(() => db.deleteRow('join_requests', r.id), 'Demande supprimée.')
  if (ok) {
    list.value = list.value.filter((x) => x.id !== r.id)
    emit('changed')
  }
}

function when(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

function replyLink(r: JoinRequest) {
  const subject = encodeURIComponent('SONIKLAB — ta demande pour nous rejoindre')
  return `mailto:${r.email}?subject=${subject}&body=${encodeURIComponent(`Salut ${r.name},\n\n`)}`
}

/** Les liens collés par la personne, rendus cliquables s'ils ressemblent à des URL. */
function urls(text: string | null) {
  return (text ?? '').split(/[\s,]+/).filter((u) => /^https?:\/\//.test(u))
}
</script>

<template>
  <section class="space-y-4">
    <div>
      <h2 class="font-display text-2xl uppercase tracking-wide">Candidatures</h2>
      <p class="font-mono text-xs text-ash">
        Les demandes envoyées depuis
        <NuxtLink to="/rejoindre" class="underline-offset-2 hover:text-bone hover:underline">/rejoindre</NuxtLink>.
        Données personnelles : visibles par les admins uniquement — supprime ce qui n'est plus utile.
      </p>
    </div>

    <!-- profils recherchés -->
    <div class="adm-card space-y-2 p-4">
      <p class="adm-label">Profils recherchés en ce moment</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in JOIN_PROFILES"
          :key="p.id"
          type="button"
          class="border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors"
          :class="
            closed.includes(p.id)
              ? 'border-line text-ash line-through opacity-50 hover:opacity-100'
              : 'border-bone bg-bone text-void hover:bg-transparent hover:text-bone'
          "
          @click="toggleProfile(p.id)"
        >
          {{ closed.includes(p.id) ? '✕' : '✓' }} {{ p.label }}
        </button>
      </div>
      <p class="font-mono text-[0.65rem] text-ash">
        Clique pour ouvrir / fermer. Un profil fermé apparaît grisé et n'est plus sélectionnable sur le formulaire.
      </p>
    </div>

    <nav class="flex flex-wrap gap-2">
      <button
        v-for="s in STATUSES"
        :key="s.id"
        class="adm-btn"
        :class="filter === s.id && 'border-bone text-bone'"
        @click="filter = s.id"
      >
        {{ s.label }} ({{ count(s.id) }})
      </button>
      <button class="adm-btn" :class="filter === 'all' && 'border-bone text-bone'" @click="filter = 'all'">
        Toutes ({{ list.length }})
      </button>
    </nav>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>
    <p v-else-if="!shown.length" class="font-mono text-sm text-ash">Rien ici pour l'instant.</p>

    <article v-for="r in shown" :key="r.id" class="adm-card space-y-3 p-4">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="border border-bone px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest">
          {{ profileLabel(r.profile) }}
        </span>
        <span class="font-display text-2xl uppercase tracking-wide">{{ r.name }}</span>
        <span class="ml-auto font-mono text-xs text-ash">{{ when(r.created_at) }}</span>
      </div>

      <p class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-smoke">
        <a :href="`mailto:${r.email}`" class="hover:text-bone">{{ r.email }}</a>
        <a v-if="r.phone" :href="`tel:${r.phone}`" class="hover:text-bone">{{ r.phone }}</a>
      </p>

      <p class="whitespace-pre-line text-sm text-bone">{{ r.message }}</p>

      <p v-if="r.links" class="break-all font-mono text-xs text-smoke">
        <template v-if="urls(r.links).length">
          <a
            v-for="u in urls(r.links)"
            :key="u"
            :href="u"
            target="_blank"
            rel="noopener noreferrer"
            class="mr-3 underline underline-offset-2 hover:text-bone"
          >{{ u }}</a>
        </template>
        <template v-else>{{ r.links }}</template>
      </p>

      <div class="flex flex-wrap gap-2 border-t border-line pt-3">
        <a :href="replyLink(r)" class="adm-btn">Répondre par mail</a>
        <button v-if="r.status !== 'contacted'" class="adm-btn" @click="setStatus(r, 'contacted')">✓ Recontactée</button>
        <button v-if="r.status !== 'archived'" class="adm-btn" @click="setStatus(r, 'archived')">Archiver</button>
        <button v-if="r.status !== 'new'" class="adm-btn" @click="setStatus(r, 'new')">Remettre en nouvelle</button>
        <button class="adm-btn-danger" @click="remove(r)">Supprimer</button>
      </div>
    </article>
  </section>
</template>
