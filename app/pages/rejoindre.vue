<script setup lang="ts">
import {
  type JoinDraft,
  type JoinProfile,
  JOIN_PROFILES,
  parseClosedProfiles,
  submitJoinRequest,
} from '~/composables/useJoin'
import { SETTINGS_DEFAULTS, fetchSettings } from '~/composables/useShowcase'

// « Nous rejoindre » : artistes, bénévoles, technique, com…
// Les demandes arrivent dans /admin → onglet « Candidatures ».
useSeoMeta({
  title: 'SONIKLAB — Nous rejoindre',
  description: 'DJ, technique, com : rejoins le collectif techno SONIKLAB.',
  ogTitle: 'Rejoindre SONIKLAB',
  ogDescription: 'DJ, technique, com : rejoins le collectif techno SONIKLAB.',
})

const supabase = useSupabase()
const route = useRoute()

// Profils fermés pour l'instant (réglable dans /admin → Candidatures) :
// affichés grisés et non sélectionnables.
const settings = useShowcaseData('site-settings', fetchSettings, () => ({ ...SETTINGS_DEFAULTS }))
const closed = computed(() => parseClosedProfiles(settings.value.join_closed_profiles))
const isClosed = (id: string) => closed.value.includes(id)
const firstOpen = () => (JOIN_PROFILES.find((p) => !isClosed(p.id))?.id ?? 'autre') as JoinProfile

// Profil présélectionné via ?profil=artiste (liens depuis la vitrine).
const asked = route.query.profil
const initialProfile =
  JOIN_PROFILES.some((p) => p.id === asked) && !isClosed(asked as string) ? (asked as JoinProfile) : firstOpen()

const form = reactive<JoinDraft>({
  name: '',
  email: '',
  phone: '',
  profile: initialProfile,
  links: '',
  message: '',
})
const consent = ref(false)
// Anti-spam : champ piège invisible + délai minimum avant envoi.
const trap = ref('')
const openedAt = Date.now()

// Si un profil se ferme pendant qu'il est sélectionné (réglages rechargés), on bascule.
watch(closed, () => {
  if (isClosed(form.profile)) form.profile = firstOpen()
})

const state = ref<'idle' | 'sending' | 'sent'>('idle')
const error = ref('')

async function onSubmit() {
  error.value = ''
  if (!consent.value) {
    error.value = 'Coche la case pour accepter que l’on garde tes infos.'
    return
  }
  // Un robot remplit le piège ou envoie instantanément : on fait semblant que c'est bon.
  if (trap.value || Date.now() - openedAt < 3000) {
    state.value = 'sent'
    return
  }
  state.value = 'sending'
  try {
    await submitJoinRequest(supabase, form)
    state.value = 'sent'
  } catch (e: any) {
    state.value = 'idle'
    error.value = `Envoi impossible (${e.message}). Réessaie, ou écris-nous directement.`
  }
}

useReveal()
</script>

<template>
  <div class="relative">
    <SiteHeader />

    <section class="relative overflow-hidden border-b border-line">
      <div
        class="pointer-events-none absolute -right-40 -top-32 h-[30rem] w-[30rem] opacity-[0.12]"
        aria-hidden="true"
      >
        <Vinyl />
      </div>
      <div class="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// nous rejoindre</p>
        <h1 class="mt-3 font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl md:text-8xl">
          Monte dans<br />
          le <span class="glitch inline-block">van</span>
        </h1>
        <p class="mt-6 max-w-xl text-lg text-smoke">
          Tu mixes, tu sais tirer un câble, tu fais des photos ou tu as une idée de collab ?
          Présente-toi, on te recontacte.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1fr_1.5fr] md:py-16">
      <!-- ce qu'on cherche -->
      <div class="reveal space-y-3">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// on cherche</p>
        <div
          v-for="(p, i) in JOIN_PROFILES"
          :key="p.id"
          class="flex items-baseline gap-3 border-b border-line pb-3"
          :class="isClosed(p.id) && 'opacity-35'"
        >
          <span class="font-mono text-xs text-ash">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-baseline gap-x-3 font-display text-2xl uppercase leading-none tracking-wide">
              <span :class="isClosed(p.id) && 'line-through decoration-2'">{{ p.label }}</span>
              <span
                v-if="isClosed(p.id)"
                class="border border-ash/60 px-1.5 py-0.5 font-mono text-[0.6rem] font-normal tracking-widest text-ash"
              >
                complet pour l'instant
              </span>
            </p>
            <p class="mt-1 text-sm text-smoke">{{ p.hint }}</p>
          </div>
        </div>
      </div>

      <!-- envoyé -->
      <div v-if="state === 'sent'" class="reveal flex flex-col items-start justify-center border border-line bg-grave p-8">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// message reçu</p>
        <p class="mt-2 font-display text-5xl uppercase leading-none tracking-wide">Merci&nbsp;!</p>
        <p class="mt-4 max-w-md text-smoke">
          Ta demande est bien arrivée chez nous. On revient vers toi par mail dès que possible.
        </p>
        <div class="mt-6 h-10 w-48">
          <Equalizer :bars="28" />
        </div>
        <NuxtLink
          to="/"
          class="mt-8 inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
        >
          ← Retour au site
        </NuxtLink>
      </div>

      <!-- formulaire -->
      <form v-else class="reveal space-y-5 border border-line bg-grave p-5 sm:p-8" @submit.prevent="onSubmit">
        <fieldset>
          <legend class="adm-label">Tu viens pour…</legend>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="p in JOIN_PROFILES"
              :key="p.id"
              class="border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors"
              :class="
                isClosed(p.id)
                  ? 'cursor-not-allowed border-line text-ash line-through opacity-35'
                  : form.profile === p.id
                    ? 'cursor-pointer border-bone bg-bone text-void'
                    : 'cursor-pointer border-line text-smoke hover:border-bone'
              "
              :title="isClosed(p.id) ? 'On ne recherche pas ce profil pour le moment' : undefined"
            >
              <input
                v-model="form.profile"
                type="radio"
                name="profile"
                :value="p.id"
                :disabled="isClosed(p.id)"
                class="sr-only"
              />
              {{ p.label }}
            </label>
          </div>
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="adm-label">Nom / blaze *</span>
            <input v-model="form.name" required maxlength="120" autocomplete="name" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Email *</span>
            <input v-model="form.email" type="email" required maxlength="200" autocomplete="email" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">Téléphone (optionnel)</span>
            <input v-model="form.phone" type="tel" maxlength="40" autocomplete="tel" class="adm-input" />
          </label>
          <label class="block">
            <span class="adm-label">{{ form.profile === 'artiste' ? 'Ton SoundCloud / tes sets' : 'Un lien (optionnel)' }}</span>
            <input
              v-model="form.links"
              maxlength="500"
              :placeholder="form.profile === 'artiste' ? 'https://soundcloud.com/…' : 'Insta, portfolio…'"
              class="adm-input"
            />
          </label>
        </div>

        <label class="block">
          <span class="adm-label">Ton message *</span>
          <textarea
            v-model="form.message"
            required
            maxlength="3000"
            rows="6"
            placeholder="Qui tu es, ce que tu aimes faire, tes dispos…"
            class="adm-input"
          />
        </label>

        <!-- piège à robots : invisible pour les humains -->
        <label class="absolute -left-[9999px]" aria-hidden="true">
          Site web
          <input v-model="trap" tabindex="-1" autocomplete="off" />
        </label>

        <label class="flex items-start gap-3 text-sm text-smoke">
          <input v-model="consent" type="checkbox" class="mt-1 accent-bone" />
          <span>
            J'accepte que SONIKLAB conserve ces informations pour me recontacter. Elles ne sont vues que par
            les membres de l'asso et jamais partagées.
          </span>
        </label>

        <p v-if="error" class="font-mono text-xs text-red-400">{{ error }}</p>

        <button
          type="submit"
          :disabled="state === 'sending'"
          class="group inline-flex items-center gap-2 bg-bone px-6 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {{ state === 'sending' ? 'Envoi…' : 'Envoyer' }}
          <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </section>

    <SiteFooter />
  </div>
</template>
