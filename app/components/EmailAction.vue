<script setup lang="ts">
import { gmailComposeUrl, mailtoUrl } from '~/composables/useCopy'

// Bouton « écrire un mail » fiable : un simple lien mailto: ne fait rien sur un
// PC sans appli mail (cas de Gmail utilisé dans le navigateur). On propose donc
// un petit menu : Gmail (web) · appli mail · copier l'adresse.
// Le contenu du bouton vient du slot ; `class` s'applique au bouton.
defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{ email: string; subject?: string; body?: string; placement?: 'bottom' | 'top'; block?: boolean }>(),
  { subject: '', body: '', placement: 'bottom', block: false },
)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const { copied, copy } = useCopy()

const gmail = computed(() => gmailComposeUrl(props.email, props.subject, props.body))
const mailto = computed(() => mailtoUrl(props.email, props.subject, props.body))

async function onCopy() {
  await copy(props.email)
  setTimeout(() => (open.value = false), 900)
}

// Fermeture : clic ailleurs ou Échap.
function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
watch(open, (o) => {
  if (!import.meta.client) return
  if (o) {
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKey)
  } else {
    document.removeEventListener('click', onDocClick)
    document.removeEventListener('keydown', onKey)
  }
})
onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <span ref="root" class="relative" :class="block ? 'flex w-full' : 'inline-flex'">
    <button
      type="button"
      v-bind="$attrs"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <slot />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute left-0 z-40 min-w-[15rem] border border-line bg-grave p-1 text-bone shadow-2xl"
      :style="block ? { right: 0 } : undefined"
      :class="placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'"
    >
      <p class="truncate px-3 pb-1 pt-2 font-mono text-[0.65rem] tracking-wider text-ash">{{ email }}</p>
      <a
        :href="gmail"
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        class="flex items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-bone hover:text-void"
        @click="open = false"
      >
        <AppIcon name="arrow" class="h-3.5 w-3.5" /> Ouvrir dans Gmail
      </a>
      <a
        :href="mailto"
        role="menuitem"
        class="flex items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-bone hover:text-void"
        @click="open = false"
      >
        <AppIcon name="mail" class="h-3.5 w-3.5" /> Appli mail
      </a>
      <button
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-xs uppercase tracking-widest transition-colors hover:bg-bone hover:text-void"
        @click="onCopy"
      >
        <span class="w-3.5 text-center">{{ copied ? '✓' : '⧉' }}</span>
        {{ copied ? 'Adresse copiée !' : "Copier l'adresse" }}
      </button>
    </div>
  </span>
</template>
