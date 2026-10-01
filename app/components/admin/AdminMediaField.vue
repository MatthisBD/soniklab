<script setup lang="ts">
// Champ image de l'admin : aperçu + URL + bouton d'envoi d'un fichier.
// `uploaded` est émis après un envoi réussi (le parent enregistre alors la ligne).
const props = withDefaults(defineProps<{ label: string; folder: string; contain?: boolean }>(), {
  contain: false,
})
const model = defineModel<string | null>({ required: true })
const emit = defineEmits<{ uploaded: [url: string] }>()

const media = useMedia()
const { flash } = useFlash()
const input = ref<HTMLInputElement | null>(null)
const busy = ref(false)

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  busy.value = true
  try {
    const { url } = await media.upload(file, props.folder)
    model.value = url
    emit('uploaded', url)
  } catch (err: any) {
    flash(`Erreur d'envoi : ${err.message}`)
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}
</script>

<template>
  <div>
    <span class="adm-label">{{ label }}</span>
    <div class="flex items-start gap-3">
      <div class="grooves flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-line">
        <img
          v-if="model"
          :src="model"
          alt=""
          class="h-full w-full"
          :class="contain ? 'object-contain p-1' : 'object-cover'"
        />
        <AppIcon v-else name="image" class="h-6 w-6 text-ash" />
      </div>
      <div class="min-w-0 flex-1 space-y-2">
        <input
          :value="model ?? ''"
          placeholder="https://… (ou envoie un fichier)"
          class="adm-input font-mono text-xs"
          @input="model = ($event.target as HTMLInputElement).value || null"
        />
        <div class="flex flex-wrap gap-2">
          <button type="button" class="adm-btn" :disabled="busy" @click="input?.click()">
            {{ busy ? 'Envoi…' : 'Envoyer une image' }}
          </button>
          <button v-if="model" type="button" class="adm-btn" @click="model = null">Retirer</button>
        </div>
        <input ref="input" type="file" accept="image/*" class="hidden" @change="onFile" />
      </div>
    </div>
  </div>
</template>
