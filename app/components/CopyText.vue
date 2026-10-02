<script setup lang="ts">
// Texte cliquable qui se copie dans le presse-papier (ex. une adresse mail),
// avec un « Copié ✓ » temporaire. Hérite de la couleur du texte autour.
const props = defineProps<{ text: string }>()
const { copied, copy } = useCopy()
</script>

<template>
  <button
    type="button"
    class="group/copy inline-flex items-center gap-1.5 text-left"
    :title="copied ? 'Copié !' : 'Cliquer pour copier'"
    @click="copy(props.text)"
  >
    <span class="underline decoration-dotted underline-offset-2">{{ text }}</span>
    <span
      class="font-mono text-[0.6rem] uppercase tracking-widest transition-opacity"
      :class="copied ? 'opacity-100' : 'opacity-0 group-hover/copy:opacity-60'"
    >
      {{ copied ? 'copié ✓' : 'copier' }}
    </span>
  </button>
</template>
