<script setup lang="ts">
import { type Collaborator, fetchCollaborators, nullify } from '~/composables/useShowcase'

const supabase = useSupabase()
const db = useShowcaseAdmin()
const media = useMedia()
const { run } = useFlash()

const list = ref<Collaborator[]>([])
const open = ref<string | null>(null)
const loading = ref(true)

const { mark, isDirty } = useDirty((c: Collaborator) => [c.name, c.kind, c.city, c.description, c.logo_url, c.url, c.visible])

onMounted(async () => {
  await run(async () => {
    list.value = await fetchCollaborators(supabase)
    list.value.forEach(mark)
  })
  loading.value = false
})

async function add() {
  await run(async () => {
    // Créé masqué : rien n'apparaît sur le site avant le premier « Enregistrer ».
    const row = await db.insertRow<Collaborator>('collaborators', {
      name: 'Nouveau collaborateur',
      position: list.value.length,
      visible: false,
    })
    mark(row)
    row.visible = true // coché par défaut → publié à l'enregistrement
    list.value.push(row)
    open.value = row.id
  }, 'Brouillon créé — remplis la fiche puis « Enregistrer ».')
}

async function save(c: Collaborator) {
  const ok = await run(
    () =>
      db.updateRow('collaborators', c.id, {
        ...nullify({ kind: c.kind, city: c.city, description: c.description, logo_url: c.logo_url, url: c.url }),
        name: c.name.trim() || 'Sans nom',
        visible: c.visible,
      }),
    `« ${c.name} » enregistré.`,
  )
  if (ok) mark(c)
}

async function remove(c: Collaborator, idx: number) {
  if (!confirm(`Supprimer « ${c.name} » ?`)) return
  await run(async () => {
    await db.deleteRow('collaborators', c.id)
    await media.removeFile(c.logo_url)
    list.value.splice(idx, 1)
  }, 'Collaborateur supprimé.')
}

const KINDS = ['Bar', 'Guinguette', 'Asso', 'Festival', 'Salle', 'Label', 'Collectif', 'Mairie']
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl uppercase tracking-wide">Collaborateurs</h2>
        <p class="font-mono text-xs text-ash">Les lieux et structures avec qui on bosse.</p>
      </div>
      <button class="adm-btn" @click="add">+ Collaborateur</button>
    </div>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>
    <p v-else-if="!list.length" class="font-mono text-sm text-ash">Aucun collaborateur pour l'instant.</p>

    <article v-for="(c, i) in list" :key="c.id" class="adm-card">
      <div class="flex items-center gap-3 p-3">
        <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="open = open === c.id ? null : c.id">
          <span class="truncate font-display text-xl uppercase tracking-wide">{{ c.name }}</span>
          <span v-if="c.kind" class="shrink-0 font-mono text-[0.65rem] uppercase tracking-widest text-ash">{{ c.kind }}</span>
          <span v-if="!c.visible" class="shrink-0 border border-ash/40 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-ash">masqué</span>
          <span v-if="isDirty(c)" class="shrink-0 border border-bone px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-bone">non enregistré</span>
          <span class="ml-auto font-mono text-xs text-ash">{{ open === c.id ? '▲' : '▼' }}</span>
        </button>
        <button title="Monter" class="adm-btn px-2" @click="run(() => db.move('collaborators', list, i, -1))">↑</button>
        <button title="Descendre" class="adm-btn px-2" @click="run(() => db.move('collaborators', list, i, 1))">↓</button>
      </div>

      <div v-if="open === c.id" class="space-y-4 border-t border-line p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="adm-label">Nom</span>
            <input v-model="c.name" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Type</span>
            <input v-model="c.kind" list="collab-kinds" placeholder="Bar, Guinguette, Asso…" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Ville</span>
            <input v-model="c.city" class="adm-input" />
          </label>
        </div>
        <label class="block">
          <span class="adm-label">Description courte</span>
          <input v-model="c.description" placeholder="ex. nos dimanches open air depuis 2024" class="adm-input" />
        </label>
        <label class="block">
          <span class="adm-label">Lien (site, Instagram…)</span>
          <input v-model="c.url" placeholder="https://…" class="adm-input font-mono text-xs" />
        </label>

        <AdminMediaField v-model="c.logo_url" label="Logo (optionnel)" folder="collaborators" contain @uploaded="save(c)" />

        <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
          <input v-model="c.visible" type="checkbox" class="accent-bone" />
          Visible sur le site
        </label>

        <div class="flex flex-wrap gap-2 border-t border-line pt-4">
          <button
            class="adm-btn"
            :class="isDirty(c) && 'border-bone bg-bone text-void hover:bg-transparent'"
            @click="save(c)"
          >
            Enregistrer
          </button>
          <button class="adm-btn-danger" @click="remove(c, i)">Supprimer</button>
          <span class="self-center font-mono text-[0.65rem] uppercase tracking-widest" :class="isDirty(c) ? 'text-bone' : 'text-ash'">
            {{ isDirty(c) ? '● modifications non enregistrées' : '✓ tout est enregistré' }}
          </span>
        </div>
      </div>
    </article>

    <datalist id="collab-kinds">
      <option v-for="k in KINDS" :key="k" :value="k" />
    </datalist>
  </section>
</template>
