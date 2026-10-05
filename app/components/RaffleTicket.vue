<script setup lang="ts">
import { type RafflePack, formatPrice, packDiscount, unitPrice } from '~/composables/useRaffle'

// Une formule de la tombola, dessinée comme un ticket à souche (encoches
// rondes sur la perforation, cf. .raffle-ticket dans main.css). S'inverse
// au survol comme les autres cartes ; lien vers la vente en ligne si fourni.
const props = defineProps<{
  pack: RafflePack
  packs: RafflePack[]
  /** Rang de la formule : A, B, C… */
  index: number
  href?: string | null
  closed?: boolean
}>()

const letter = computed(() => String.fromCharCode(65 + props.index))
const discount = computed(() => packDiscount(props.pack, props.packs))
const plural = computed(() => (props.pack.tickets > 1 ? 's' : ''))
const link = computed(() => (props.href && !props.closed ? props.href : null))
</script>

<template>
  <component
    :is="link ? 'a' : 'div'"
    :href="link ?? undefined"
    :target="link ? '_blank' : undefined"
    :rel="link ? 'noopener noreferrer' : undefined"
    class="raffle-ticket reveal group relative flex min-h-40 border border-line bg-grave transition-colors duration-300"
    :class="closed ? 'opacity-50' : 'hover:bg-bone hover:text-void'"
  >
    <!-- bande verticale, façon ticket de vestiaire -->
    <span
      class="flex w-7 shrink-0 rotate-180 items-center justify-center border-l border-line font-mono text-[0.55rem] uppercase tracking-[0.3em] text-ash [writing-mode:vertical-rl] group-hover:border-void/20 group-hover:text-void/60"
      aria-hidden="true"
    >
      soniklab · tombola
    </span>

    <div class="flex min-w-0 flex-1 flex-col justify-center px-5 py-4">
      <p class="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-ash group-hover:text-void/60">// formule {{ letter }}</p>
      <p class="mt-1 font-display text-7xl leading-none">{{ pack.tickets }}</p>
      <p class="mt-1 font-mono text-xs uppercase tracking-widest">ticket{{ plural }}</p>
    </div>

    <!-- souche : le prix -->
    <div
      class="raffle-stub flex shrink-0 flex-col items-center justify-center gap-1 border-l border-dashed border-line px-3 text-center group-hover:border-void/30"
    >
      <p class="font-display text-4xl leading-none">{{ formatPrice(pack.price) }}</p>
      <p v-if="pack.tickets > 1" class="whitespace-nowrap font-mono text-[0.6rem] uppercase tracking-wide text-ash group-hover:text-void/60">
        soit {{ formatPrice(unitPrice(pack)) }}/ticket
      </p>
      <span
        v-if="discount"
        class="mt-1 bg-bone px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-void group-hover:bg-void group-hover:text-bone"
      >
        −{{ discount }} %
      </span>
      <span v-if="link" class="mt-2 font-mono text-[0.6rem] uppercase tracking-widest">Prendre ↗</span>
    </div>
  </component>
</template>
