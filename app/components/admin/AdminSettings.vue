<script setup lang="ts">
import { type SettingKey, type SiteSettings, SETTINGS_DEFAULTS, fetchSettings } from '~/composables/useShowcase'

const supabase = useSupabase()
const db = useShowcaseAdmin()
const admin = useAdmin()
const { run } = useFlash()

const settings = ref<SiteSettings>({ ...SETTINGS_DEFAULTS })
const ticker = ref('')
const loading = ref(true)

onMounted(async () => {
  await run(async () => {
    settings.value = await fetchSettings(supabase)
    ticker.value = (await fetchTickerWords(supabase)).join('\n')
  })
  loading.value = false
})

type Field = { key: SettingKey; label: string; hint?: string; rows?: number; placeholder?: string }

const TEXTS: Field[] = [
  { key: 'hero_text', label: "Accroche de l'accueil", rows: 3 },
  { key: 'about_intro', label: "L'asso — introduction", hint: "Aussi affichée sur l'accueil.", rows: 3 },
  { key: 'about_body', label: "L'asso — notre histoire", hint: 'Une ligne vide entre deux paragraphes.', rows: 7 },
  {
    key: 'about_pillars',
    label: "L'asso — ce qu'on fait",
    hint: 'Un bloc par ligne, au format : Titre | description',
    rows: 5,
  },
  { key: 'booking_text', label: 'Bloc booking / contact', rows: 3 },
]

const CONTACTS: Field[] = [
  { key: 'contact_email', label: 'Email de contact / booking', placeholder: 'soniklab.asso@gmail.com' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'soundcloud_url', label: 'SoundCloud du collectif', placeholder: 'https://soundcloud.com/…' },
  { key: 'helloasso_url', label: 'HelloAsso — adhésion / dons', placeholder: 'https://www.helloasso.com/associations/…' },
]

function resetField(key: SettingKey) {
  settings.value[key] = SETTINGS_DEFAULTS[key]
}
</script>

<template>
  <section class="space-y-8">
    <p v-if="loading" class="font-mono text-sm text-ash">Chargement…</p>

    <template v-else>
      <!-- Réseaux & contact -->
      <div class="adm-card space-y-3 p-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-display text-2xl uppercase tracking-wide">Contact & réseaux</h2>
          <button class="adm-btn" @click="run(() => db.saveSettings(settings), 'Contacts enregistrés.')">Enregistrer</button>
        </div>
        <p class="font-mono text-xs text-ash">Affichés dans le bloc booking et le pied de page. Vide = masqué.</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <label v-for="f in CONTACTS" :key="f.key" class="block">
            <span class="adm-label">{{ f.label }}</span>
            <input v-model="settings[f.key]" :placeholder="f.placeholder" class="adm-input font-mono text-xs" />
          </label>
        </div>
      </div>

      <!-- Textes -->
      <div class="adm-card space-y-4 p-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-display text-2xl uppercase tracking-wide">Textes du site</h2>
          <button class="adm-btn" @click="run(() => db.saveSettings(settings), 'Textes enregistrés.')">Enregistrer</button>
        </div>
        <label v-for="f in TEXTS" :key="f.key" class="block">
          <span class="flex items-baseline justify-between gap-2">
            <span class="adm-label">{{ f.label }}</span>
            <button
              v-if="settings[f.key] !== SETTINGS_DEFAULTS[f.key]"
              type="button"
              class="font-mono text-[0.6rem] uppercase tracking-widest text-ash hover:text-bone"
              @click="resetField(f.key)"
            >
              texte par défaut
            </button>
          </span>
          <textarea v-model="settings[f.key]" :rows="f.rows" class="adm-input" />
          <span v-if="f.hint" class="mt-1 block font-mono text-[0.65rem] text-ash">{{ f.hint }}</span>
        </label>
      </div>

      <!-- Bandeau défilant -->
      <div class="adm-card p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-display text-2xl uppercase tracking-wide">Bandeau défilant</h2>
          <button class="adm-btn" @click="run(() => admin.saveTicker(ticker.split('\n')), 'Bandeau enregistré.')">
            Enregistrer
          </button>
        </div>
        <p class="mb-2 font-mono text-xs text-ash">Un mot par ligne. Défile sous le haut de l'accueil.</p>
        <textarea v-model="ticker" rows="5" class="adm-input font-mono" />
      </div>
    </template>
  </section>
</template>
