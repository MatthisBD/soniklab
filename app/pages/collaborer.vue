<script setup lang="ts">
import {
  type JoinDraft,
  type JoinProfile,
  JOIN_PROFILES,
  parseClosedProfiles,
  submitJoinRequest,
} from '~/composables/useJoin'

// « Booking & collab » : booker un DJ pour une soirée ou proposer une
// collaboration ponctuelle (on ne recrute pas de membres).
// Les demandes arrivent dans /admin → onglet « Demandes ».
useSeoMeta({
  title: 'SONIKLAB — Booking & collab',
  description: 'Un DJ pour ta soirée, un événement à monter ensemble, un projet son ou vidéo : contacte le collectif techno SONIKLAB.',
  ogTitle: 'Booker SONIKLAB',
  ogDescription: 'Un DJ pour ta soirée ou un projet à monter ensemble ? Écris au collectif techno SONIKLAB.',
})

const supabase = useSupabase()
const route = useRoute()

// Types de demande fermés pour l'instant (réglable dans /admin → Demandes) :
// affichés grisés et non sélectionnables.
const settings = useSiteSettings()
const closed = computed(() => parseClosedProfiles(settings.value.join_closed_profiles))
const isClosed = (id: string) => closed.value.includes(id)
const firstOpen = () => (JOIN_PROFILES.find((p) => !isClosed(p.id))?.id ?? 'autre') as JoinProfile

// Type présélectionné via ?profil=booking (liens depuis la vitrine).
// Par défaut : le premier ouvert, soit « Booker un DJ ».
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

// Libellés et exemples adaptés au type de demande choisi.
const current = computed(() => JOIN_PROFILES.find((p) => p.id === form.profile) ?? JOIN_PROFILES[0])

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
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// booking & collab</p>
        <h1 class="mt-3 font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl md:text-8xl">
          On bosse<br />
          <span class="glitch inline-block">ensemble</span>&nbsp;?
        </h1>
        <p class="mt-6 max-w-xl text-lg text-smoke">
          Un DJ pour ta soirée, un bar ou une asso qui veut monter un événement, un projet son,
          photo ou vidéo ? Dis-nous ce que tu as en tête, on te répond vite.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1fr_1.5fr] md:py-16">
      <!-- ce qu'on peut faire ensemble -->
      <div class="reveal space-y-3">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// ce qu'on peut faire ensemble</p>
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
          Ta demande est bien arrivée chez nous. On revient vers toi par mail très vite.
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
          <legend class="adm-label">Tu nous contactes pour…</legend>
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
              :title="isClosed(p.id) ? 'Pas pour le moment' : undefined"
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
            <span class="adm-label">Ton nom / ta structure *</span>
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
            <span class="adm-label">{{ current.linkLabel }}</span>
            <input
              v-model="form.links"
              maxlength="500"
              :placeholder="current.linkPlaceholder"
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
            :placeholder="current.messagePlaceholder"
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
            les membres de l'asso et jamais partagées
            (<NuxtLink to="/mentions-legales#donnees" class="underline underline-offset-2 hover:text-bone">en savoir plus</NuxtLink>).
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
