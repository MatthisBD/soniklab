<script setup lang="ts">
import {
  type EventMedia,
  type SonikEvent,
  fetchEvents,
  formatDate,
  isoToday,
  nullify,
} from '~/composables/useShowcase'
import { kindFromUrl } from '~/composables/useMedia'

const supabase = useSupabase()
const db = useShowcaseAdmin()
const media = useMedia()
const { run, flash } = useFlash()

const list = ref<SonikEvent[]>([])
const open = ref<string | null>(null)
const loading = ref(true)
const today = isoToday()

// Champs enregistrés par le bouton « Enregistrer » (la galerie, elle, s'enregistre seule).
const { mark, isDirty } = useDirty((e: SonikEvent) => [
  e.title, e.starts_on, e.hours, e.venue, e.city, e.entry, e.description, e.cover_url, e.ticket_url, e.visible,
])

onMounted(async () => {
  await run(async () => {
    list.value = await fetchEvents(supabase)
    list.value.forEach(mark)
  })
  loading.value = false
})

function sortList() {
  list.value.sort((a, b) => b.starts_on.localeCompare(a.starts_on))
}

async function add() {
  await run(async () => {
    // Créé masqué : rien n'apparaît sur le site avant le premier « Enregistrer ».
    const row = await db.insertRow<SonikEvent>('events', {
      title: 'Nouvel événement',
      starts_on: isoToday(),
      visible: false,
    })
    const ev: SonikEvent = { ...row, media: [] }
    mark(ev)
    ev.visible = true // coché par défaut → publié à l'enregistrement
    list.value.unshift(ev)
    sortList()
    open.value = row.id
  }, 'Brouillon créé — remplis la fiche puis « Enregistrer l’événement ».')
}

async function save(e: SonikEvent) {
  const ok = await run(
    () =>
      db.updateRow('events', e.id, {
        ...nullify({
          hours: e.hours,
          venue: e.venue,
          city: e.city,
          entry: e.entry,
          description: e.description,
          cover_url: e.cover_url,
          ticket_url: e.ticket_url,
        }),
        title: e.title.trim() || 'Sans titre',
        starts_on: e.starts_on || isoToday(),
        visible: e.visible,
      }),
    `« ${e.title} » enregistré.`,
  )
  if (ok) {
    mark(e)
    sortList()
  }
}

async function remove(e: SonikEvent) {
  if (!confirm(`Supprimer « ${e.title} » et toute sa galerie ?`)) return
  await run(async () => {
    await db.deleteRow('events', e.id) // les médias suivent (on delete cascade)
    await Promise.allSettled([e.cover_url, ...e.media.map((m) => m.url)].map((u) => media.removeFile(u)))
    list.value = list.value.filter((x) => x.id !== e.id)
  }, 'Événement supprimé.')
}

// ---------------- Galerie ----------------
const progress = ref('')
const linkDraft = ref('')

async function addMediaRow(e: SonikEvent, url: string, kind: EventMedia['kind']) {
  const row = await db.insertRow<EventMedia>('event_media', {
    event_id: e.id,
    url,
    kind,
    position: e.media.length,
  })
  e.media.push(row)
}

async function onFiles(e: SonikEvent, ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  let done = 0
  for (const file of files) {
    progress.value = `Envoi ${done + 1} / ${files.length}…`
    try {
      const { url, kind } = await media.upload(file, `events/${e.id}`)
      await addMediaRow(e, url, kind)
      done++
    } catch (err: any) {
      flash(`Erreur sur « ${file.name} » : ${err.message}`)
    }
  }
  progress.value = ''
  input.value = ''
  if (done) flash(`${done} média${done > 1 ? 's' : ''} ajouté${done > 1 ? 's' : ''}.`)
}

async function addLink(e: SonikEvent) {
  const url = linkDraft.value.trim()
  if (!url) return
  const ok = await run(() => addMediaRow(e, url, kindFromUrl(url)), 'Lien ajouté.')
  if (ok) linkDraft.value = ''
}

function saveCaption(m: EventMedia) {
  return run(() => db.updateRow('event_media', m.id, { caption: m.caption?.trim() || null }), 'Légende enregistrée.')
}

async function removeMedia(e: SonikEvent, idx: number) {
  const m = e.media[idx]!
  if (!confirm('Retirer ce média ?')) return
  await run(async () => {
    await db.deleteRow('event_media', m.id)
    await media.removeFile(m.url)
    e.media.splice(idx, 1)
  }, 'Média retiré.')
}

async function useAsCover(e: SonikEvent, m: EventMedia) {
  e.cover_url = m.url
  await save(e)
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h2 class="font-display text-2xl uppercase tracking-wide">Événements</h2>
        <p class="font-mono text-xs text-ash">
          Date future → « Prochaines dates ». Date passée → archives avec galerie.
        </p>
      </div>
      <button class="adm-btn" @click="add">+ Événement</button>
    </div>

    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>
    <p v-else-if="!list.length" class="font-mono text-sm text-ash">Aucun événement pour l'instant.</p>

    <article v-for="e in list" :key="e.id" class="adm-card">
      <button type="button" class="flex w-full items-center gap-3 p-3 text-left" @click="open = open === e.id ? null : e.id">
        <span
          class="shrink-0 border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest"
          :class="e.starts_on >= today ? 'border-bone text-bone' : 'border-line text-ash'"
        >
          {{ e.starts_on >= today ? 'à venir' : 'passé' }}
        </span>
        <span class="shrink-0 font-mono text-xs text-ash">{{ formatDate(e.starts_on) }}</span>
        <span class="truncate font-display text-xl uppercase tracking-wide">{{ e.title }}</span>
        <span v-if="!e.visible" class="shrink-0 border border-ash/40 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-ash">masqué</span>
        <span v-if="isDirty(e)" class="shrink-0 border border-bone px-1.5 py-0.5 font-mono text-[0.6rem] uppercase text-bone">non enregistré</span>
        <span class="ml-auto shrink-0 font-mono text-xs text-ash">
          {{ e.media.length ? `${e.media.length} média${e.media.length > 1 ? 's' : ''}` : '' }}
          {{ open === e.id ? '▲' : '▼' }}
        </span>
      </button>

      <div v-if="open === e.id" class="space-y-4 border-t border-line p-4">
        <div class="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
          <label class="block">
            <span class="adm-label">Titre</span>
            <input v-model="e.title" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Date</span>
            <input v-model="e.starts_on" type="date" class="adm-input [color-scheme:dark]" />
          </label>
          <label class="block">
            <span class="adm-label">Horaires</span>
            <input v-model="e.hours" placeholder="18h → 2h" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Lieu</span>
            <input v-model="e.venue" placeholder="La Guinguette du port" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Ville</span>
            <input v-model="e.city" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Entrée</span>
            <input v-model="e.entry" list="entry-presets" placeholder="Gratuit, 5 €, prix libre…" class="adm-input" />
          </label>
        </div>
        <datalist id="entry-presets">
          <option value="Gratuit" />
          <option value="Prix libre" />
          <option value="5 €" />
        </datalist>
        <label class="block">
          <span class="adm-label">Description</span>
          <textarea v-model="e.description" rows="3" class="adm-input" />
        </label>
        <label class="block">
          <span class="adm-label">Lien billetterie / infos (HelloAsso, Facebook…)</span>
          <input v-model="e.ticket_url" placeholder="https://…" class="adm-input font-mono text-xs" />
        </label>

        <AdminMediaField v-model="e.cover_url" label="Visuel / affiche (flyer, line-up…)" :folder="`events/${e.id}`" @uploaded="save(e)" />

        <label class="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-smoke">
          <input v-model="e.visible" type="checkbox" class="accent-bone" />
          Visible sur le site
        </label>

        <!-- galerie -->
        <div class="space-y-3 border-t border-line pt-4">
          <div class="flex items-baseline gap-2">
            <h3 class="font-display text-xl uppercase tracking-wide">Galerie</h3>
            <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">
              photos, vidéos & liens — enregistrés automatiquement
            </span>
          </div>

          <div v-if="e.media.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div v-for="(m, mi) in e.media" :key="m.id" class="border border-line bg-void">
              <div class="relative aspect-[4/3] overflow-hidden">
                <img v-if="m.kind === 'image'" :src="m.url" alt="" loading="lazy" class="h-full w-full object-cover" />
                <video v-else-if="m.kind === 'video'" :src="m.url" preload="metadata" muted class="h-full w-full object-cover" />
                <a v-else :href="m.url" target="_blank" rel="noopener noreferrer" class="grooves flex h-full w-full flex-col items-center justify-center gap-1 text-smoke">
                  <AppIcon name="play" class="h-8 w-8" />
                  <span class="font-mono text-[0.6rem] uppercase">{{ m.kind === 'embed' ? 'vidéo en ligne' : 'lien' }}</span>
                </a>
                <span v-if="e.cover_url === m.url" class="absolute left-1.5 top-1.5 bg-bone px-1 font-mono text-[0.55rem] uppercase text-void">couverture</span>
              </div>
              <input
                v-model="m.caption"
                :placeholder="m.kind === 'link' ? 'texte du bouton' : 'légende'"
                class="w-full border-y border-line bg-void px-2 py-1 text-xs outline-none focus:border-bone"
                @change="saveCaption(m)"
              />
              <div class="flex">
                <button title="Avant" class="flex-1 py-1 text-xs text-ash hover:text-bone" @click="run(() => db.move('event_media', e.media, mi, -1))">←</button>
                <button title="Après" class="flex-1 py-1 text-xs text-ash hover:text-bone" @click="run(() => db.move('event_media', e.media, mi, 1))">→</button>
                <button v-if="m.kind === 'image'" title="Utiliser comme couverture" class="flex-1 py-1 text-xs text-ash hover:text-bone" @click="useAsCover(e, m)">★</button>
                <button title="Retirer" class="flex-1 py-1 text-xs text-red-400 hover:bg-red-500/10" @click="removeMedia(e, mi)">✕</button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-end gap-3">
            <label class="adm-btn cursor-pointer" :class="{ 'pointer-events-none opacity-50': progress }">
              {{ progress || '+ Photos / vidéos' }}
              <input
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                multiple
                class="hidden"
                @change="onFiles(e, $event)"
              />
            </label>
            <form class="flex min-w-[16rem] flex-1 gap-2" @submit.prevent="addLink(e)">
              <input
                v-model="linkDraft"
                placeholder="ou colle un lien (YouTube, Vimeo, Instagram, Facebook…)"
                class="adm-input font-mono text-xs"
              />
              <button type="submit" class="adm-btn shrink-0">Ajouter</button>
            </form>
          </div>
          <p class="font-mono text-[0.65rem] text-ash">
            Les photos sont réduites automatiquement. Vidéos : 50 Mo max par fichier — au-delà, publie-la
            sur YouTube et colle le lien. Les autres liens (post Instagram, event Facebook…) deviennent des
            boutons sur la fiche de l'événement : leur légende sert de texte (sinon « Instagram », « Facebook »…).
          </p>
        </div>

        <!-- validation de la fiche -->
        <div class="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <button
            class="adm-btn"
            :class="isDirty(e) && 'border-bone bg-bone text-void hover:bg-transparent'"
            @click="save(e)"
          >
            Enregistrer l'événement
          </button>
          <button class="adm-btn-danger" @click="remove(e)">Supprimer</button>
          <span class="font-mono text-[0.65rem] uppercase tracking-widest" :class="isDirty(e) ? 'text-bone' : 'text-ash'">
            {{ isDirty(e) ? '● modifications non enregistrées' : '✓ tout est enregistré' }}
          </span>
        </div>
      </div>
    </article>
  </section>
</template>
