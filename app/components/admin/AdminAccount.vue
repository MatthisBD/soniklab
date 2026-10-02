<script setup lang="ts">
const auth = useAuth()
const { flash, run } = useFlash()

const newPassword = ref('')

async function changePassword() {
  if (newPassword.value.length < 8) {
    flash('Mot de passe trop court (8 caractères min).')
    return
  }
  const ok = await run(() => auth.changePassword(newPassword.value), 'Mot de passe mis à jour.')
  if (ok) newPassword.value = ''
}
</script>

<template>
  <section class="adm-card p-5">
    <h2 class="mb-1 font-display text-2xl uppercase tracking-wide">Mon compte</h2>
    <p class="mb-4 font-mono text-xs text-ash">Connecté en tant que {{ auth.user.value?.email }}</p>
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="changePassword">
      <label class="block grow">
        <span class="adm-label">Nouveau mot de passe</span>
        <PasswordInput
          v-model="newPassword"
          autocomplete="new-password"
          placeholder="8 caractères minimum"
          class="adm-input font-mono"
        />
      </label>
      <button type="submit" class="adm-btn px-4 py-2">Mettre à jour</button>
    </form>
  </section>
</template>
