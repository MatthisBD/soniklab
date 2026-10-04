<script setup lang="ts">
import { type GearItem, fetchGear, nullify } from '~/composables/useShowcase'

// Le sound system / matériel : affiché sur l'accueil (« Le sound system ») et
// sur la page Booking (« Ce qu'on peut amener »). Section masquée si vide.
const supabase = useSupabase()
const db = useShowcaseAdmin()
const media = useMedia()
const { run } = useFlash()

const list = ref<GearItem[]>([])
const open = ref<string | null>(null)
const loading = ref(true)

const { mark, isDirty } = useDirty((g: GearItem) => [g.name, g.kind, g.details, g.photo_url, g.visible])

onMounted(async () => {
  await run(async () => {
    list.value = await fetchGear(supabase)
    list.value.forEach(mark)
  })
  loading.value = false
})

async function add() {
  await run(async () => {
    // Créé masqué : rien n'apparaît sur le site avant le premier « Enregistrer ».
    const row = await db.insertRow<GearItem>('gear_items', {
      name: 'Nouveau matériel',
      position: list.value.length,
      visible: false,
    })
    mark(row)
    row.visible = true // coché par défaut → publié à l'enregistrement
    list.value.push(row)
    open.value = row.id
  }, 'Brouillon créé — remplis la fiche puis « Enregistrer ».')
}

async function save(g: GearItem) {
  const ok = await run(
    () =>
      db.updateRow('gear_items', g.id, {
        ...nullify({ kind: g.kind, details: g.details, photo_url: g.photo_url }),
        name: g.name.trim() || 'Sans nom',
        visible: g.visible,
      }),
    `« ${g.name} » enregistré.`,
  )
  if (ok) mark(g)
}

async function remove(g: GearItem, idx: number) {
  if (!confirm(`Supprimer « ${g.name} » ?`)) return
  await run(async () => {
    await db.deleteRow('gear_items', g.id)
    await media.removeFile(g.photo_url)
    list.value.splice(idx, 1)
  }, 'Matériel supprimé.')
}

const KINDS = ['Diffusion', 'Caissons de basse', 'Platines & DJ', 'Lumière', 'Scène & structure', 'Autre']
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl uppercase tracking-wide">Matériel</h2>
        <p class="font-mono text-xs text-ash">
          Le sound system et le matos, affichés sur l'accueil et la page Booking (dans cet ordre).
          Le texte d'intro se règle dans « Textes & réseaux ».
        </p>
      </div>
      <button class="adm-btn shrink-0" @click="add">+ Matériel</button>
    </div>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>
    <p v-else-if="!list.length" class="font-mono text-sm text-ash">
      Aucun matériel pour l'instant (la section reste masquée sur le site).
    </p>

    <article v-for="(g, i) in list" :key="g.id" class="adm-card">
      <div class="flex items-center gap-3 p-3">
        <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="open = open === g.id ? null : g.id">
          <span class="truncate font-display text-xl uppercase tracking-wide">{{ g.name }}</span>
          <span v-if="g.kind" class="shrink-0 font-mono text-[0.65rem] uppercase tracking-widest text-ash">{{ g.kind }}</span>
          <span v-if="!g.visible" class="shrink-0 border border-ash/40 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-ash">masqué</span>
          <span v-if="isDirty(g)" class="shrink-0 border border-bone px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-bone">non enregistré</span>
          <span class="ml-auto font-mono text-xs text-ash">{{ open === g.id ? '▲' : '▼' }}</span>
        </button>
        <button title="Monter" class="adm-btn px-2" @click="run(() => db.move('gear_items', list, i, -1))">↑</button>
        <button title="Descendre" class="adm-btn px-2" @click="run(() => db.move('gear_items', list, i, 1))">↓</button>
      </div>

      <div v-if="open === g.id" class="space-y-4 border-t border-line p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="adm-label">Nom</span>
            <input v-model="g.name" placeholder="ex. Caissons de basse maison" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Type</span>
            <input v-model="g.kind" list="gear-kinds" placeholder="Diffusion, Platines & DJ, Lumière…" class="adm-input" />
          </label>
        </div>
        <label class="block">
          <span class="adm-label">Caractéristiques</span>
          <textarea
            v-model="g.details"
            rows="3"
            placeholder="ex. 4 caissons 18'' construits par l'asso · 2 × 1 000 W · adapté jusqu'à ~300 personnes"
            class="adm-input"
          />
          <span class="mt-1 block font-mono text-[0.65rem] text-ash">Les retours à la ligne sont conservés.</span>
        </label>

        <AdminMediaField v-model="g.photo_url" label="Photo" folder="gear" @uploaded="save(g)" />

        <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
          <input v-model="g.visible" type="checkbox" class="accent-bone" />
          Visible sur le site
        </label>

        <div class="flex flex-wrap gap-2 border-t border-line pt-4">
          <button
            class="adm-btn"
            :class="isDirty(g) && 'border-bone bg-bone text-void hover:bg-transparent'"
            @click="save(g)"
          >
            Enregistrer
          </button>
          <button class="adm-btn-danger" @click="remove(g, i)">Supprimer</button>
          <span class="self-center font-mono text-[0.65rem] uppercase tracking-widest" :class="isDirty(g) ? 'text-bone' : 'text-ash'">
            {{ isDirty(g) ? '● modifications non enregistrées' : '✓ tout est enregistré' }}
          </span>
        </div>
      </div>
    </article>

    <datalist id="gear-kinds">
      <option v-for="k in KINDS" :key="k" :value="k" />
    </datalist>
  </section>
</template>
