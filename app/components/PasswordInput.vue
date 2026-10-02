<script setup lang="ts">
// Champ mot de passe avec un œil pour afficher / masquer ce qu'on tape.
// Les autres attributs (placeholder, autocomplete, required, class…) sont
// transmis tels quels à l'<input>.
defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })
const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      v-model="model"
      v-bind="$attrs"
      :type="visible ? 'text' : 'password'"
      autocapitalize="off"
      spellcheck="false"
      class="pr-10"
    />
    <button
      type="button"
      class="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ash transition-colors hover:text-bone"
      :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      :aria-pressed="visible"
      :title="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      @click="visible = !visible"
    >
      <AppIcon :name="visible ? 'eye-off' : 'eye'" class="h-4 w-4" />
    </button>
  </div>
</template>
