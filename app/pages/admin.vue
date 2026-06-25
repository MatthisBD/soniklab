<script setup lang="ts">
import type { LinkGroupView } from '~/composables/useSupabase'

useHead({ title: 'SONIKLAB — Admin' })

const supabase = useSupabase()
const auth = useAuth()
const admin = useAdmin()

const ICONS = ['ticket', 'checklist', 'broadcast', 'folder']

// --- état UI ---
const email = ref('')
const password = ref('')
const loginError = ref('')
const loading = ref(false)
const message = ref('')
const groups = ref<LinkGroupView[]>([])
const ticker = ref('')

function flash(text: string) {
  message.value = text
  setTimeout(() => (message.value = ''), 2500)
}

async function loadData() {
  loading.value = true
  try {
    groups.value = await fetchLinkGroups(supabase)
    ticker.value = (await fetchTickerWords(supabase)).join('\n')
  } catch (e: any) {
    flash(`Erreur de chargement : ${e.message}`)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await auth.init()
  if (auth.isAdmin.value) await loadData()
})

// recharge les données dès qu'on devient admin (après connexion)
watch(
  () => auth.isAdmin.value,
  (isAdmin) => {
    if (isAdmin && !groups.value.length) loadData()
  },
)

// ---------------- Connexion ----------------
async function onLogin() {
  loginError.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value.trim(), password.value)
    password.value = ''
    // Un compte non-admin reste connecté : l'état « en attente de droits »
    // est géré dans le template.
  } catch (e: any) {
    loginError.value = e.message || 'Connexion impossible.'
  } finally {
    loading.value = false
  }
}

async function onLogout() {
  await auth.signOut()
  groups.value = []
}

// ---------------- Groupes ----------------
async function saveGroup(g: LinkGroupView) {
  try {
    await admin.saveGroup(g)
    flash(`Groupe « ${g.title} » enregistré.`)
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function addGroup() {
  try {
    const row = await admin.addGroup(groups.value.length)
    groups.value.push({ ...(row as any), id: row!.slug, dbId: row!.id, links: [] })
    flash('Groupe ajouté.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function removeGroup(g: LinkGroupView, idx: number) {
  if (!confirm(`Supprimer le groupe « ${g.title} » et tous ses liens ?`)) return
  try {
    await admin.deleteGroup(g.dbId)
    groups.value.splice(idx, 1)
    flash('Groupe supprimé.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

// ---------------- Liens ----------------
async function saveLink(g: LinkGroupView, linkIdx: number) {
  const l = g.links[linkIdx]!
  try {
    await admin.saveLink(l)
    flash('Lien enregistré.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function addLink(g: LinkGroupView) {
  try {
    const row = await admin.addLink(g.dbId, g.links.length)
    g.links.push({ ...(row as any), note: row!.note ?? undefined })
    flash('Lien ajouté.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function removeLink(g: LinkGroupView, idx: number) {
  const l = g.links[idx]!
  if (!confirm(`Supprimer le lien « ${l.label} » ?`)) return
  try {
    await admin.deleteLink(l.id)
    g.links.splice(idx, 1)
    flash('Lien supprimé.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function moveLink(g: LinkGroupView, idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= g.links.length) return
  const arr = g.links
  ;[arr[idx], arr[target]] = [arr[target]!, arr[idx]!]
  // réassigne les positions selon le nouvel ordre
  arr.forEach((l, i) => (l.position = i))
  try {
    await admin.reorderLinks(arr.map((l) => ({ id: l.id, position: l.position })))
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

// ---------------- Compte ----------------
const newPassword = ref('')
async function changePassword() {
  if (newPassword.value.length < 8) {
    flash('Mot de passe trop court (8 caractères min).')
    return
  }
  try {
    await auth.changePassword(newPassword.value)
    newPassword.value = ''
    flash('Mot de passe mis à jour.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

// ---------------- Bandeau ----------------
async function saveTicker() {
  try {
    await admin.saveTicker(ticker.value.split('\n'))
    flash('Bandeau enregistré.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-5 py-10">
    <!-- en-tête -->
    <header class="mb-8 flex items-center justify-between border-b border-line pb-5">
      <NuxtLink to="/" class="group block">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// espace admin · retour au site</p>
        <h1 class="mt-1 font-display text-4xl uppercase tracking-wide transition-colors group-hover:text-smoke">
          SONIKLAB
        </h1>
      </NuxtLink>
      <div class="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
        <NuxtLink v-if="auth.isAdmin.value" to="/budget" class="text-ash transition-colors hover:text-bone">Budget</NuxtLink>
        <NuxtLink to="/" class="text-ash transition-colors hover:text-bone">← le site</NuxtLink>
        <button
          v-if="auth.isLoggedIn.value"
          class="border border-line px-3 py-2 text-smoke transition-colors hover:border-bone hover:text-bone"
          @click="onLogout"
        >
          Déconnexion
        </button>
      </div>
    </header>

    <!-- message flash -->
    <p
      v-if="message"
      class="mb-6 border border-line bg-grave px-4 py-3 font-mono text-sm text-bone"
    >
      {{ message }}
    </p>

    <!-- chargement initial de l'auth -->
    <p v-if="!auth.ready.value" class="font-mono text-sm text-ash">Chargement…</p>

    <!-- ============ NON CONNECTÉ : connexion admin ============ -->
    <form
      v-else-if="!auth.isLoggedIn.value"
      class="mx-auto max-w-sm space-y-4 border border-line bg-grave p-6"
      @submit.prevent="onLogin"
    >
      <p class="font-mono text-xs uppercase tracking-widest text-ash">Connexion admin</p>
      <input
        v-model="email"
        type="email"
        required
        placeholder="email"
        autocomplete="username"
        class="w-full border border-line bg-void px-3 py-2 font-mono text-sm outline-none focus:border-bone"
      />
      <input
        v-model="password"
        type="password"
        required
        placeholder="mot de passe"
        autocomplete="current-password"
        class="w-full border border-line bg-void px-3 py-2 font-mono text-sm outline-none focus:border-bone"
      />
      <p v-if="loginError" class="font-mono text-xs text-red-400">{{ loginError }}</p>
      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-bone px-4 py-2.5 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {{ loading ? '…' : 'Se connecter' }}
      </button>
    </form>

    <!-- ============ CONNECTÉ MAIS PAS ADMIN ============ -->
    <div v-else-if="!auth.isAdmin.value" class="mx-auto max-w-sm space-y-4 border border-line bg-grave p-6 text-center">
      <p class="font-display text-2xl uppercase tracking-wide">Compte créé ✓</p>
      <p class="text-sm text-smoke">
        Tu es connecté en tant que
        <span class="font-mono text-bone">{{ auth.user.value?.email }}</span>,
        mais tu n'as pas (encore) les droits d'édition.
        Demande à un admin de t'activer.
      </p>
      <button
        class="border border-line px-4 py-2 font-mono text-xs uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
        @click="onLogout"
      >
        Se déconnecter
      </button>
    </div>

    <!-- ============ CONNECTÉ ADMIN : éditeur ============ -->
    <div v-else class="space-y-10">
      <!-- Bandeau défilant -->
      <section class="border border-line bg-grave p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-display text-xl uppercase tracking-wide">Bandeau défilant</h2>
          <button
            class="border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-smoke hover:border-bone hover:text-bone"
            @click="saveTicker"
          >
            Enregistrer
          </button>
        </div>
        <p class="mb-2 font-mono text-xs text-ash">Un mot par ligne.</p>
        <textarea
          v-model="ticker"
          rows="5"
          class="w-full border border-line bg-void px-3 py-2 font-mono text-sm outline-none focus:border-bone"
        />
      </section>

      <!-- Groupes -->
      <section class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-xl uppercase tracking-wide">Groupes & liens</h2>
          <button
            class="border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-smoke hover:border-bone hover:text-bone"
            @click="addGroup"
          >
            + Groupe
          </button>
        </div>

        <article
          v-for="(g, gi) in groups"
          :key="g.dbId"
          class="border border-line bg-grave p-5"
        >
          <!-- champs du groupe -->
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Titre</span>
              <input v-model="g.title" class="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-bone" />
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Sous-titre</span>
              <input v-model="g.tagline" class="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-bone" />
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">N° de piste</span>
              <input v-model="g.track" class="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-bone" />
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Ancre (slug)</span>
              <input v-model="g.id" class="w-full border border-line bg-void px-3 py-2 font-mono text-sm outline-none focus:border-bone" />
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Icône</span>
              <select v-model="g.icon" class="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-bone">
                <option v-for="ic in ICONS" :key="ic" :value="ic">{{ ic }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Position</span>
              <input v-model.number="g.position" type="number" class="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-bone" />
            </label>
          </div>

          <div class="mt-3 flex gap-2">
            <button
              class="border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-smoke hover:border-bone hover:text-bone"
              @click="saveGroup(g)"
            >
              Enregistrer le groupe
            </button>
            <button
              class="border border-red-500/40 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-red-400 hover:bg-red-500/10"
              @click="removeGroup(g, gi)"
            >
              Supprimer
            </button>
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
                <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Libellé</span>
                <input v-model="l.label" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
              </label>
              <label class="block">
                <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">URL</span>
                <input v-model="l.url" class="w-full border border-line bg-void px-2.5 py-1.5 font-mono text-xs outline-none focus:border-bone" />
              </label>
              <label class="block">
                <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Note</span>
                <input v-model="l.note" placeholder="(optionnel)" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
              </label>
              <div class="flex gap-1">
                <button title="Monter" class="border border-line px-2 py-1.5 text-xs text-ash hover:text-bone" @click="moveLink(g, li, -1)">↑</button>
                <button title="Descendre" class="border border-line px-2 py-1.5 text-xs text-ash hover:text-bone" @click="moveLink(g, li, 1)">↓</button>
                <button title="Enregistrer" class="border border-line px-2 py-1.5 text-xs text-smoke hover:text-bone" @click="saveLink(g, li)">✓</button>
                <button title="Supprimer" class="border border-red-500/40 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10" @click="removeLink(g, li)">✕</button>
              </div>
            </div>

            <button
              class="font-mono text-xs uppercase tracking-widest text-ash hover:text-bone"
              @click="addLink(g)"
            >
              + Ajouter un lien
            </button>
          </div>
        </article>
      </section>

      <!-- Compte : changement de mot de passe -->
      <section class="border border-line bg-grave p-5">
        <h2 class="mb-3 font-display text-xl uppercase tracking-wide">Mon compte</h2>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="changePassword">
          <label class="block grow">
            <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">
              Nouveau mot de passe
            </span>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="8 caractères minimum"
              class="w-full border border-line bg-void px-3 py-2 font-mono text-sm outline-none focus:border-bone"
            />
          </label>
          <button
            type="submit"
            class="border border-line px-4 py-2 font-mono text-xs uppercase tracking-widest text-smoke hover:border-bone hover:text-bone"
          >
            Mettre à jour
          </button>
        </form>
      </section>
    </div>
  </div>
</template>
