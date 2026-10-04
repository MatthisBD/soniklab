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
  { key: 'gear_intro', label: 'Le sound system — introduction', hint: "Au-dessus du matériel (accueil et page Booking).", rows: 3 },
  { key: 'booking_text', label: 'Bloc booking / contact', rows: 3 },
]

// Infos obligatoires des mentions légales (association éditrice du site).
const LEGAL: Field[] = [
  { key: 'legal_name', label: "Nom officiel de l'association", placeholder: 'SONIKLAB' },
  { key: 'legal_director', label: 'Directeur·rice de la publication', placeholder: 'Prénom Nom (en général le/la président·e)' },
  { key: 'legal_address', label: 'Adresse du siège social', placeholder: 'n°, rue, code postal, ville' },
  { key: 'legal_rna', label: 'Numéro RNA', placeholder: 'W123456789 (récépissé de la préfecture)' },
  { key: 'legal_siret', label: "SIRET (si l'asso en a un)", placeholder: 'optionnel' },
  { key: 'legal_phone', label: 'Téléphone de contact', placeholder: 'demandé par la loi pour les éditeurs' },
]

const CONTACTS: Field[] = [
  { key: 'contact_email', label: 'Email de contact / booking', placeholder: 'soniklab.asso@gmail.com' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'soundcloud_url', label: 'SoundCloud du collectif', placeholder: 'https://soundcloud.com/…' },
  { key: 'helloasso_url', label: 'HelloAsso — bouton « Faire un don »', placeholder: 'https://www.helloasso.com/associations/…' },
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
        <p class="font-mono text-xs text-ash">
          Affichés en haut de l'accueil, dans le bloc booking, le pied de page et la page
          <NuxtLink to="/liens" class="underline-offset-2 hover:text-bone hover:underline">/liens</NuxtLink>
          (à mettre dans la bio Instagram). Vide = masqué.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <label v-for="f in CONTACTS" :key="f.key" class="block">
            <span class="adm-label">{{ f.label }}</span>
            <input v-model="settings[f.key]" :placeholder="f.placeholder" class="adm-input font-mono text-xs" />
          </label>
        </div>
        <label class="block">
          <span class="adm-label">Autres liens publics (page /liens)</span>
          <textarea
            v-model="settings.extra_links"
            rows="4"
            placeholder="Notre playlist | https://soundcloud.com/…&#10;Billetterie open air | https://www.helloasso.com/…"
            class="adm-input font-mono text-xs"
          />
          <span class="mt-1 block font-mono text-[0.65rem] text-ash">
            Un lien par ligne, au format : Libellé | https://…
          </span>
        </label>
      </div>

      <!-- Mentions légales -->
      <div class="adm-card space-y-3 p-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-display text-2xl uppercase tracking-wide">Mentions légales</h2>
          <button class="adm-btn" @click="run(() => db.saveSettings(settings), 'Mentions légales enregistrées.')">
            Enregistrer
          </button>
        </div>
        <p class="font-mono text-xs text-ash">
          Obligatoires pour le site d'une asso. Affichées sur
          <NuxtLink to="/mentions-legales" class="underline-offset-2 hover:text-bone hover:underline">/mentions-legales</NuxtLink>
          (l'email de contact ci-dessus y est repris). Un champ vide s'affiche « à compléter ».
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <label v-for="f in LEGAL" :key="f.key" class="block">
            <span class="adm-label">{{ f.label }}</span>
            <input v-model="settings[f.key]" :placeholder="f.placeholder" class="adm-input text-sm" />
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
