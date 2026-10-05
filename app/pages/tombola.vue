<script setup lang="ts">
import { type Raffle, daysUntil, formatPrice, isDrawn, prizesValue, ticketNo } from '~/composables/useRaffle'
import { formatDate } from '~/composables/useShowcase'

// Tombolas : du matos de l'asso mis en jeu plutôt que revendu.
// Rubrique PRIVÉE tant que « raffle_public » est vide (admin → Tombola) :
// le public n'y lit alors rien (RLS), les admins voient un aperçu.
useSeoMeta({
  title: 'SONIKLAB — Tombola',
  description: 'Du matos DJ et son à gagner : la tombola du collectif techno SONIKLAB. Chaque ticket soutient l’asso.',
  ogTitle: 'La tombola SONIKLAB',
  ogDescription: 'Du matos à gagner, des tickets à partir de quelques euros : tente ta chance et soutiens le collectif.',
})

const auth = useAuth()
onMounted(() => auth.init())

const settings = useSiteSettings()
const raffles = useRaffles()
const stats = useRaffleStats()
const today = useToday()

const isPublic = computed(() => !!settings.value.raffle_public.trim())
const preview = computed(() => !isPublic.value && auth.isAdmin.value)
useHead({ meta: [{ name: 'robots', content: computed(() => (isPublic.value ? 'index, follow' : 'noindex')) }] })

// Les admins voient aussi les brouillons (signalés), pour relire avant de publier.
const shown = computed(() =>
  isPublic.value || auth.isAdmin.value ? raffles.value.filter((r) => r.visible || auth.isAdmin.value) : [],
)
const current = computed(() => shown.value.filter((r) => !isDrawn(r)))
const past = computed(() => shown.value.filter(isDrawn))

function countdown(r: Raffle) {
  const d = daysUntil(r.draw_on, today.value)
  if (d === null) return null
  if (d > 1) return { big: `J-${d}`, small: 'avant le tirage' }
  if (d === 1) return { big: 'Demain', small: 'le tirage, c’est demain' }
  if (d === 0) return { big: 'Jour J', small: 'tirage aujourd’hui' }
  return { big: 'Bientôt', small: 'résultats à venir' }
}

const sold = (r: Raffle) => stats.value[r.id] ?? 0
const progress = (r: Raffle) => (r.max_tickets ? Math.min(100, Math.round((sold(r) / r.max_tickets) * 100)) : null)

// Comment ça marche (le 3e point reprend la date / le lieu du tirage)
function steps(r: Raffle) {
  return [
    { title: 'Choisis ta formule', text: '1 ticket = 1 numéro = 1 chance. Plus tu en prends, plus c’est avantageux.' },
    {
      title: 'Récupère tes numéros',
      text: r.ticket_url
        ? 'En ligne ou en direct à nos soirées : chaque ticket reçoit un numéro unique, enregistré par l’équipe.'
        : 'En direct à nos soirées : chaque ticket reçoit un numéro unique, enregistré par l’équipe.',
    },
    {
      title: 'Tirage en public',
      text: `${r.draw_on ? `Le ${formatDate(r.draw_on)}` : 'À la date annoncée'}${r.draw_place ? `, ${r.draw_place}` : ''}. Les numéros gagnants sont publiés ici.`,
    },
  ]
}

useReveal()
</script>

<template>
  <div class="relative">
    <SiteHeader />

    <!-- aperçu réservé aux admins tant que la rubrique est privée -->
    <div v-if="preview" class="border-b border-line bg-grave">
      <p class="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-2.5 font-mono text-[0.7rem] uppercase tracking-widest text-smoke">
        <AppIcon name="lock" class="h-3.5 w-3.5" />
        Aperçu admin — rubrique privée, invisible du public.
        <NuxtLink to="/admin?tab=tombola" class="text-bone underline underline-offset-2 hover:text-smoke">Gérer →</NuxtLink>
      </p>
    </div>

    <!-- ====================== HERO ====================== -->
    <section class="relative overflow-hidden border-b border-line">
      <div class="pointer-events-none absolute -right-40 -top-32 h-[30rem] w-[30rem] opacity-[0.12]" aria-hidden="true">
        <Vinyl />
      </div>
      <div class="relative mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// tombola</p>
        <h1 class="mt-3 font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl md:text-8xl">
          Tente ta<br />
          <span class="glitch inline-block">chance</span>
        </h1>
        <p class="mt-6 max-w-xl text-lg text-smoke">
          Plutôt que de revendre notre matos, on le met en jeu. Chaque ticket aide l'asso à financer le son,
          les soirées et les open airs.
        </p>
      </div>
    </section>

    <!-- ====================== TOMBOLAS EN COURS ====================== -->
    <section v-for="r in current" :id="`tombola-${r.id}`" :key="r.id" class="scroll-mt-16 border-b border-line">
      <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p
          v-if="!r.visible"
          class="mb-6 inline-flex items-center gap-2 border border-ash/50 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-ash"
        >
          <AppIcon name="lock" class="h-3 w-3" /> brouillon — invisible du public
        </p>

        <div class="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
          <!-- les lots -->
          <div class="space-y-4">
            <figure
              v-for="(p, i) in r.prizes"
              :key="p.id"
              class="reveal group relative overflow-hidden border border-line bg-ink"
              :class="i > 0 && 'flex items-stretch'"
            >
              <div
                class="relative overflow-hidden"
                :class="i === 0 ? 'aspect-square' : 'aspect-square w-28 shrink-0 border-r border-line sm:w-36'"
              >
                <img
                  v-if="p.photo_url"
                  :src="p.photo_url"
                  :alt="p.name"
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div v-else class="grooves h-full w-full" />
                <span
                  class="absolute left-3 top-3 bg-bone px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-void"
                  :class="i > 0 && 'left-1.5 top-1.5'"
                >
                  {{ i === 0 ? (r.prizes.length > 1 ? 'gros lot' : 'à gagner') : `lot ${i + 1}` }}
                </span>
                <span
                  v-if="i === 0 && p.value_eur"
                  class="absolute right-3 top-3 border border-bone/70 bg-void/80 px-2 py-0.5 font-mono text-xs text-bone"
                >
                  valeur {{ formatPrice(Number(p.value_eur)) }}
                </span>
              </div>
              <figcaption class="min-w-0 flex-1 p-4" :class="i === 0 && 'border-t border-line'">
                <p class="font-display uppercase leading-tight tracking-wide" :class="i === 0 ? 'text-3xl' : 'text-xl'">
                  {{ p.name }}
                </p>
                <p v-if="i > 0 && p.value_eur" class="font-mono text-xs text-ash">valeur {{ formatPrice(Number(p.value_eur)) }}</p>
                <p v-if="p.description" class="mt-2 whitespace-pre-line text-sm text-smoke">{{ p.description }}</p>
                <!-- déjà tiré (pendant le tirage, les lots se dévoilent un à un) -->
                <p
                  v-if="p.winner_ticket !== null"
                  class="mt-3 inline-flex items-center gap-2 bg-bone px-2 py-1 font-mono text-xs uppercase tracking-widest text-void"
                >
                  gagné · n° {{ ticketNo(p.winner_ticket) }}<template v-if="p.winner_label"> · {{ p.winner_label }}</template>
                </p>
              </figcaption>
            </figure>
            <p v-if="!r.prizes.length" class="reveal border border-dashed border-line px-4 py-10 text-center font-mono text-sm text-ash">
              Les lots arrivent…
            </p>
          </div>

          <!-- les infos -->
          <div class="reveal md:sticky md:top-24">
            <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// en jeu</p>
            <h2 class="mt-2 font-display text-5xl uppercase leading-[0.95] tracking-wide sm:text-6xl">{{ r.title }}</h2>
            <p v-if="prizesValue(r)" class="mt-3 font-mono text-sm uppercase tracking-widest text-smoke">
              {{ formatPrice(prizesValue(r)) }} de lots à gagner
            </p>
            <p v-if="r.description" class="mt-5 whitespace-pre-line text-lg text-smoke">{{ r.description }}</p>

            <!-- le tirage -->
            <div v-if="r.draw_on || r.draw_place" class="mt-8 flex items-stretch border border-line">
              <div v-if="countdown(r)" class="flex w-32 shrink-0 flex-col items-center justify-center border-r border-line bg-bone px-3 py-4 text-void">
                <span class="font-display text-4xl leading-none">{{ countdown(r)!.big }}</span>
                <span class="mt-1 text-center font-mono text-[0.55rem] uppercase tracking-widest text-void/60">{{ countdown(r)!.small }}</span>
              </div>
              <div class="flex flex-col justify-center gap-1 px-4 py-3">
                <span class="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-ash">tirage au sort</span>
                <span v-if="r.draw_on" class="font-display text-2xl uppercase leading-none tracking-wide">{{ formatDate(r.draw_on) }}</span>
                <span v-if="r.draw_place" class="text-sm text-smoke">{{ r.draw_place }}</span>
              </div>
            </div>

            <!-- tickets vendus (si on choisit de l'afficher) -->
            <div v-if="r.show_sold && sold(r)" class="mt-6">
              <p class="flex items-baseline justify-between font-mono text-xs uppercase tracking-widest text-smoke">
                <span>{{ sold(r) }} ticket{{ sold(r) > 1 ? 's' : '' }} en jeu</span>
                <span v-if="r.max_tickets" class="text-ash">sur {{ r.max_tickets }}</span>
              </p>
              <div v-if="progress(r) !== null" class="mt-2 h-2 border border-line">
                <div class="h-full bg-bone transition-[width] duration-1000" :style="{ width: `${progress(r)}%` }" />
              </div>
            </div>

            <a
              v-if="r.sales_open && r.ticket_url"
              :href="r.ticket_url"
              target="_blank"
              rel="noopener noreferrer"
              class="group mt-8 inline-flex items-center gap-2 bg-bone px-6 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
            >
              Prendre mes tickets
              <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <p v-else-if="!r.sales_open" class="mt-8 inline-block border border-line px-4 py-2 font-mono text-xs uppercase tracking-widest text-ash">
              Ventes closes — place au tirage
            </p>
          </div>
        </div>

        <!-- les formules -->
        <div class="mt-14">
          <p class="reveal mb-5 font-mono text-xs uppercase tracking-[0.25em] text-ash">// choisis ta formule</p>
          <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <RaffleTicket
              v-for="(p, pi) in r.packs"
              :key="pi"
              :pack="p"
              :packs="r.packs"
              :index="pi"
              :href="r.ticket_url"
              :closed="!r.sales_open"
            />
          </div>
          <p v-if="r.sales_open && !r.ticket_url" class="reveal mt-5 flex flex-wrap items-center gap-3 text-smoke">
            Les tickets se prennent en direct à nos
            <NuxtLink to="/#dates" class="text-bone underline underline-offset-2 hover:text-smoke">prochaines soirées</NuxtLink>
            <template v-if="settings.contact_email">
              — ou écris-nous :
              <EmailAction
                :email="settings.contact_email"
                :subject="`Tombola — ${r.title}`"
                placement="top"
                class="inline-flex items-center gap-1.5 border border-line px-3 py-1 font-mono text-xs text-bone transition-colors hover:border-bone hover:bg-bone hover:text-void"
              >
                <AppIcon name="mail" class="h-3.5 w-3.5" />
                {{ settings.contact_email }}
              </EmailAction>
            </template>
          </p>
        </div>

        <!-- comment ça marche -->
        <ol class="mt-14 grid gap-px border border-line bg-line sm:grid-cols-3">
          <li v-for="(s, si) in steps(r)" :key="si" class="reveal bg-void p-5">
            <span class="font-mono text-xs text-ash">{{ String(si + 1).padStart(2, '0') }}</span>
            <p class="mt-2 font-display text-2xl uppercase tracking-wide">{{ s.title }}</p>
            <p class="mt-1 text-sm text-smoke">{{ s.text }}</p>
          </li>
        </ol>

        <!-- règlement -->
        <details v-if="r.rules || r.permit" class="reveal group mt-8 border border-line">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-mono text-xs uppercase tracking-widest text-smoke hover:text-bone">
            Règlement de la tombola
            <span class="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <div class="border-t border-line px-5 py-4">
            <p v-if="r.permit" class="mb-3 font-mono text-xs text-ash">{{ r.permit }}</p>
            <p v-if="r.rules" class="whitespace-pre-line text-sm leading-relaxed text-smoke">{{ r.rules }}</p>
          </div>
        </details>
      </div>
    </section>

    <!-- ====================== RÉSULTATS ====================== -->
    <section v-if="past.length" class="mx-auto max-w-6xl px-5 py-12 md:py-16">
      <SectionHead kicker="// les gagnants" title="Résultats" />
      <div class="space-y-6">
        <article v-for="r in past" :key="r.id" class="reveal border border-line">
          <header class="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
            <h3 class="font-display text-3xl uppercase tracking-wide">{{ r.title }}</h3>
            <span v-if="r.draw_on" class="font-mono text-xs uppercase tracking-widest text-ash">tirée le {{ formatDate(r.draw_on) }}</span>
          </header>
          <ul>
            <li
              v-for="(p, i) in r.prizes"
              :key="p.id"
              class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3 last:border-b-0"
            >
              <span class="font-mono text-xs text-ash">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="min-w-0 flex-1 font-display text-xl uppercase tracking-wide">{{ p.name }}</span>
              <span class="bg-bone px-2 py-0.5 font-mono text-sm text-void">n° {{ ticketNo(p.winner_ticket!) }}</span>
              <span v-if="p.winner_label" class="font-mono text-sm text-smoke">{{ p.winner_label }}</span>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- ====================== RIEN EN COURS ====================== -->
    <section v-if="!shown.length" class="mx-auto max-w-6xl px-5 py-16">
      <div class="reveal border border-dashed border-line px-5 py-14 text-center">
        <p class="font-display text-4xl uppercase tracking-wide">Pas de tombola en ce moment</p>
        <p class="mt-3 font-mono text-sm text-ash">
          <template v-if="settings.instagram_url">
            La prochaine arrive bientôt — suis-nous sur
            <a :href="settings.instagram_url" target="_blank" rel="noopener noreferrer" class="text-smoke underline underline-offset-2 hover:text-bone">Instagram</a>
            pour ne pas la rater.
          </template>
          <template v-else>La prochaine arrive bientôt.</template>
        </p>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>
