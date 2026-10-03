<script setup lang="ts">
// Compteur rétro du pied de page (façon hit counter années 90 / compteur de
// magnéto) : des rouleaux de chiffres qui défilent jusqu'au total quand le
// pied de page entre à l'écran. Invisible tant que le total n'est pas connu.
const total = useVisitTotal()
const el = ref<HTMLElement | null>(null)
const seen = ref(false)

const digits = computed(() =>
  String(total.value ?? 0)
    .padStart(6, '0')
    .split('')
    .map(Number),
)
// Tours complets en plus du chiffre : les unités tournent le plus, comme un vrai compteur.
function turns(i: number) {
  return Math.max(0, 2 - (digits.value.length - 1 - i))
}
function offset(d: number, i: number) {
  return seen.value ? turns(i) * 10 + d : 0
}

const one = computed(() => (total.value ?? 0) <= 1)
const caption = computed(() => (one.value ? 'personne passée au lab' : 'personnes passées au lab'))

let io: IntersectionObserver | null = null
onMounted(() => {
  io = new IntersectionObserver(
    ([e]) => {
      if (e?.isIntersecting) {
        seen.value = true
        io?.disconnect()
      }
    },
    { threshold: 0.6 },
  )
  if (el.value) io.observe(el.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div
    ref="el"
    :class="['flex items-center gap-3 transition-opacity duration-700', total === null ? 'invisible opacity-0' : 'opacity-100']"
    role="img"
    :aria-label="`${(total ?? 0).toLocaleString('fr-FR')} ${caption}`"
  >
    <span class="flex gap-[3px] font-mono text-lg text-bone" aria-hidden="true">
      <span v-for="(d, i) in digits" :key="digits.length - i" class="odo-cell">
        <span
          class="odo-strip"
          :style="{ transform: `translateY(${-offset(d, i) * 1.6}em)`, transitionDelay: `${i * 90}ms` }"
        >
          <span v-for="n in 30" :key="n">{{ (n - 1) % 10 }}</span>
        </span>
      </span>
    </span>
    <span class="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase leading-tight tracking-[0.2em] text-ash">
      <span class="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-bone" />
      <span class="max-w-[9rem]">{{ caption }}</span>
    </span>
  </div>
</template>
