<script setup lang="ts">
import { type Artist, fetchArtists, nullify } from '~/composables/useShowcase'

const supabase = useSupabase()
const db = useShowcaseAdmin()
const media = useMedia()
const { run } = useFlash()

const list = ref<Artist[]>([])
const open = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  await run(async () => (list.value = await fetchArtists(supabase)))
  loading.value = false
})

async function add() {
  await run(async () => {
    const row = await db.insertRow<Artist>('artists', { name: 'Nouvel artiste', position: list.value.length })
    list.value.push({ ...row, links: [] })
    open.value = row.id
  }, 'Artiste ajouté.')
}

function save(a: Artist) {
  return run(
    () =>
      db.updateRow('artists', a.id, {
        ...nullify({ role: a.role, style: a.style, bio: a.bio, photo_url: a.photo_url }),
        name: a.name.trim() || 'Sans nom',
        links: a.links
          .filter((l) => l.url.trim())
          .map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
        visible: a.visible,
      }),
    `« ${a.name} » enregistré.`,
  )
}

async function remove(a: Artist, idx: number) {
  if (!confirm(`Supprimer « ${a.name} » ?`)) return
  await run(async () => {
    await db.deleteRow('artists', a.id)
    await media.removeFile(a.photo_url)
    list.value.splice(idx, 1)
  }, 'Artiste supprimé.')
}

const LINK_PRESETS = ['SoundCloud', 'Instagram', 'Mixcloud', 'YouTube', 'Resident Advisor']
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl uppercase tracking-wide">Artistes</h2>
        <p class="font-mono text-xs text-ash">Le line-up affiché sur la vitrine, dans cet ordre.</p>
      </div>
      <button class="adm-btn" @click="add">+ Artiste</button>
    </div>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>
    <p v-else-if="!list.length" class="font-mono text-sm text-ash">Aucun artiste pour l'instant.</p>

    <article v-for="(a, i) in list" :key="a.id" class="adm-card">
      <!-- ligne résumé -->
      <div class="flex items-center gap-3 p-3">
        <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="open = open === a.id ? null : a.id">
          <span class="font-mono text-xs text-ash">A{{ i + 1 }}</span>
          <span class="truncate font-display text-xl uppercase tracking-wide">{{ a.name }}</span>
          <span v-if="!a.visible" class="shrink-0 border border-ash/40 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-ash">masqué</span>
          <span class="ml-auto font-mono text-xs text-ash">{{ open === a.id ? '▲' : '▼' }}</span>
        </button>
        <button title="Monter" class="adm-btn px-2" @click="run(() => db.move('artists', list, i, -1))">↑</button>
        <button title="Descendre" class="adm-btn px-2" @click="run(() => db.move('artists', list, i, 1))">↓</button>
      </div>

      <!-- édition -->
      <div v-if="open === a.id" class="space-y-4 border-t border-line p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="adm-label">Nom de scène</span>
            <input v-model="a.name" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Rôle</span>
            <input v-model="a.role" placeholder="DJ, Live, B2B…" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Style de son</span>
            <input v-model="a.style" placeholder="techno industrielle, hard groove…" class="adm-input" />
          </label>
        </div>

        <label class="block">
          <span class="adm-label">Bio courte</span>
          <textarea v-model="a.bio" rows="3" class="adm-input" />
        </label>

        <AdminMediaField v-model="a.photo_url" label="Photo (optionnelle)" folder="artists" @uploaded="save(a)" />

        <!-- liens -->
        <div>
          <span class="adm-label">Liens (SoundCloud, Instagram…)</span>
          <div class="space-y-2">
            <div v-for="(l, li) in a.links" :key="li" class="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <input v-model="l.label" placeholder="Libellé" list="artist-link-presets" class="adm-input" />
              <input v-model="l.url" placeholder="https://soundcloud.com/…" class="adm-input font-mono text-xs" />
              <button title="Retirer" class="adm-btn-danger" @click="a.links.splice(li, 1)">✕</button>
            </div>
          </div>
          <button class="mt-2 font-mono text-xs uppercase tracking-widest text-ash hover:text-bone" @click="a.links.push({ label: a.links.length ? '' : 'SoundCloud', url: '' })">
            + Ajouter un lien
          </button>
        </div>

        <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
          <input v-model="a.visible" type="checkbox" class="accent-bone" />
          Visible sur le site
        </label>

        <div class="flex flex-wrap gap-2 border-t border-line pt-4">
          <button class="adm-btn" @click="save(a)">Enregistrer</button>
          <button class="adm-btn-danger" @click="remove(a, i)">Supprimer</button>
        </div>
      </div>
    </article>

    <datalist id="artist-link-presets">
      <option v-for="p in LINK_PRESETS" :key="p" :value="p" />
    </datalist>
  </section>
</template>
