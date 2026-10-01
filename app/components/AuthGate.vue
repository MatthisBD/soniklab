<script setup lang="ts">
/**
 * Portail des pages réservées aux membres (QG, budget, admin).
 * Trois états : connexion → connecté sans droits → contenu (slot).
 * Pas d'inscription publique : les comptes sont créés en base (cf. CLAUDE.md).
 */
const auth = useAuth()
onMounted(() => auth.init())

const email = ref('')
const password = ref('')
const loginError = ref('')
const loading = ref(false)

async function onLogin() {
  loginError.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value.trim(), password.value)
    password.value = ''
  } catch (e: any) {
    loginError.value =
      e.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : e.message || 'Connexion impossible.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <p v-if="!auth.ready.value" class="font-mono text-sm text-ash">Chargement…</p>

  <!-- ============ NON CONNECTÉ ============ -->
  <form
    v-else-if="!auth.isLoggedIn.value"
    class="mx-auto mt-6 max-w-sm space-y-4 border border-line bg-grave p-6"
    @submit.prevent="onLogin"
  >
    <div>
      <p class="font-mono text-xs uppercase tracking-widest text-ash">// espace membres</p>
      <p class="mt-1 font-display text-3xl uppercase tracking-wide">Connexion</p>
      <p class="mt-2 text-sm text-smoke">Réservé aux membres de l'asso.</p>
    </div>
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

  <!-- ============ CONNECTÉ MAIS PAS ADMIN (état de garde) ============ -->
  <div v-else-if="!auth.isAdmin.value" class="mx-auto mt-6 max-w-sm space-y-4 border border-line bg-grave p-6 text-center">
    <p class="font-display text-2xl uppercase tracking-wide">Accès réservé</p>
    <p class="text-sm text-smoke">
      Tu es connecté en tant que
      <span class="font-mono text-bone">{{ auth.user.value?.email }}</span>,
      mais ce compte n'a pas (encore) les droits membres. Demande à un admin de t'activer.
    </p>
    <button
      class="border border-line px-4 py-2 font-mono text-xs uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
      @click="auth.signOut()"
    >
      Se déconnecter
    </button>
  </div>

  <!-- ============ MEMBRE ============ -->
  <slot v-else />
</template>
