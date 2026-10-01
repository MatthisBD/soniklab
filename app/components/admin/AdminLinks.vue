<script setup lang="ts">
import type { LinkGroupView } from '~/composables/useSupabase'

// Raccourcis internes affichés sur le QG (/qg).
const supabase = useSupabase()
const admin = useAdmin()
const { run } = useFlash()

const ICONS = ['ticket', 'checklist', 'broadcast', 'folder']

const groups = ref<LinkGroupView[]>([])
const loading = ref(true)

onMounted(async () => {
  await run(async () => (groups.value = await fetchLinkGroups(supabase)))
  loading.value = false
})

// ---------------- Groupes ----------------
function saveGroup(g: LinkGroupView) {
  return run(() => admin.saveGroup(g), `Groupe « ${g.title} » enregistré.`)
}

function addGroup() {
  return run(async () => {
    const row = await admin.addGroup(groups.value.length)
    groups.value.push({ ...(row as any), id: row!.slug, dbId: row!.id, links: [] })
  }, 'Groupe ajouté.')
}

async function removeGroup(g: LinkGroupView, idx: number) {
  if (!confirm(`Supprimer le groupe « ${g.title} » et tous ses liens ?`)) return
  await run(async () => {
    await admin.deleteGroup(g.dbId)
    groups.value.splice(idx, 1)
  }, 'Groupe supprimé.')
}

// ---------------- Liens ----------------
function saveLink(g: LinkGroupView, linkIdx: number) {
  return run(() => admin.saveLink(g.links[linkIdx]!), 'Lien enregistré.')
}

function addLink(g: LinkGroupView) {
  return run(async () => {
    const row = await admin.addLink(g.dbId, g.links.length)
    g.links.push({ ...(row as any), note: row!.note ?? undefined })
  }, 'Lien ajouté.')
}

async function removeLink(g: LinkGroupView, idx: number) {
  const l = g.links[idx]!
  if (!confirm(`Supprimer le lien « ${l.label} » ?`)) return
  await run(async () => {
    await admin.deleteLink(l.id)
    g.links.splice(idx, 1)
  }, 'Lien supprimé.')
}

async function moveLink(g: LinkGroupView, idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= g.links.length) return
  const arr = g.links
  ;[arr[idx], arr[target]] = [arr[target]!, arr[idx]!]
  // réassigne les positions selon le nouvel ordre
  arr.forEach((l, i) => (l.position = i))
  await run(() => admin.reorderLinks(arr.map((l) => ({ id: l.id, position: l.position }))))
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl uppercase tracking-wide">Liens du QG</h2>
        <p class="font-mono text-xs text-ash">
          Les raccourcis internes de <NuxtLink to="/qg" class="underline-offset-2 hover:text-bone hover:underline">/qg</NuxtLink>
          — visibles uniquement par les membres connectés.
        </p>
      </div>
      <button class="adm-btn" @click="addGroup">+ Groupe</button>
    </div>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>

    <article v-for="(g, gi) in groups" :key="g.dbId" class="adm-card p-5">
      <!-- champs du groupe -->
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="adm-label">Titre</span>
          <input v-model="g.title" class="adm-input" />
        </label>
        <label class="block">
          <span class="adm-label">Sous-titre</span>
          <input v-model="g.tagline" class="adm-input" />
        </label>
        <label class="block">
          <span class="adm-label">N° de piste</span>
          <input v-model="g.track" class="adm-input" />
        </label>
        <label class="block">
          <span class="adm-label">Ancre (slug)</span>
          <input v-model="g.id" class="adm-input font-mono" />
        </label>
        <label class="block">
          <span class="adm-label">Icône</span>
          <select v-model="g.icon" class="adm-input">
            <option v-for="ic in ICONS" :key="ic" :value="ic">{{ ic }}</option>
          </select>
        </label>
        <label class="block">
          <span class="adm-label">Position</span>
          <input v-model.number="g.position" type="number" class="adm-input" />
        </label>
      </div>

      <div class="mt-3 flex gap-2">
        <button class="adm-btn" @click="saveGroup(g)">Enregistrer le groupe</button>
        <button class="adm-btn-danger" @click="removeGroup(g, gi)">Supprimer</button>
      </div>

      <!-- liens du groupe -->
      <div class="mt-5 space-y-3 border-t border-line pt-4">
        <div class="flex items-baseline gap-2">
          <h3 class="font-display text-2xl uppercase tracking-wide text-bone">Liens</h3>
          <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">
            les redirections de ce groupe
          </span>
        </div>

        <div
          v-for="(l, li) in g.links"
          :key="l.id"
          class="grid items-end gap-2 sm:grid-cols-[1fr_1.4fr_1fr_auto]"
        >
          <label class="block">
            <span class="adm-label">Libellé</span>
            <input v-model="l.label" class="adm-input px-2.5 py-1.5" />
          </label>
          <label class="block">
            <span class="adm-label">URL</span>
            <input v-model="l.url" class="adm-input px-2.5 py-1.5 font-mono text-xs" />
          </label>
          <label class="block">
            <span class="adm-label">Note</span>
            <input v-model="l.note" placeholder="(optionnel)" class="adm-input px-2.5 py-1.5" />
          </label>
          <div class="flex gap-1">
            <button title="Monter" class="border border-line px-2 py-1.5 text-xs text-ash hover:text-bone" @click="moveLink(g, li, -1)">↑</button>
            <button title="Descendre" class="border border-line px-2 py-1.5 text-xs text-ash hover:text-bone" @click="moveLink(g, li, 1)">↓</button>
            <button title="Enregistrer" class="border border-line px-2 py-1.5 text-xs text-smoke hover:text-bone" @click="saveLink(g, li)">✓</button>
            <button title="Supprimer" class="border border-red-500/40 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10" @click="removeLink(g, li)">✕</button>
          </div>
        </div>

        <button class="font-mono text-xs uppercase tracking-widest text-ash hover:text-bone" @click="addLink(g)">
          + Ajouter un lien
        </button>
      </div>
    </article>
  </section>
</template>
