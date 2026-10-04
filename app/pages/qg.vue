<script setup lang="ts">
// Le QG : le hub de raccourcis interne de l'asso (HelloAsso, to-do, drive…).
// Réservé aux membres connectés — les tables link_groups / links ne sont
// lisibles que par les admins (cf. supabase/vitrine.sql).
useHead({ title: 'SONIKLAB — Le QG', meta: [{ name: 'robots', content: 'noindex' }] })

const supabase = useSupabase()
const auth = useAuth()

const linkGroups = ref<Awaited<ReturnType<typeof fetchLinkGroups>>>([])
const loadError = ref('')
const newRequests = ref(0)

async function loadData() {
  countNewJoinRequests(supabase).then((n) => (newRequests.value = n))
  try {
    linkGroups.value = await fetchLinkGroups(supabase)
    loadError.value = ''
  } catch (e: any) {
    loadError.value = e.message
  }
}

// (re)charge dès qu'un membre est connecté.
watch(
  () => auth.isAdmin.value,
  (isAdmin) => (isAdmin ? loadData() : (linkGroups.value = [])),
  { immediate: true },
)

useReveal()
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 py-10">
    <ToolHeader kicker="// le QG" />

    <AuthGate>
      <!-- ====================== HERO ====================== -->
      <section class="relative">
        <!-- vinyle en fond -->
        <div
          class="pointer-events-none absolute -right-40 -top-28 h-[28rem] w-[28rem] opacity-[0.13] md:opacity-20"
          aria-hidden="true"
        >
          <Vinyl />
        </div>

        <div class="relative py-6 md:py-12">
          <p class="flicker mb-4 inline-flex items-center gap-2 border border-line px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.25em] text-smoke">
            ● espace membres — {{ auth.user.value?.email }}
          </p>
          <h2 class="font-display text-6xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl">
            Le repaire<br />
            du <span class="glitch inline-block">soundsystem</span>
          </h2>
          <p class="mt-6 max-w-md text-lg text-smoke">
            Le <strong class="text-bone">QG de l'asso</strong> : tous nos raccourcis au même endroit.
            HelloAsso, la to-do, les réseaux, le drive — on clique, on bosse, on remonte le son.
          </p>

          <NuxtLink
            v-if="newRequests"
            to="/admin?tab=candidatures"
            class="mt-6 inline-flex items-center gap-2 border border-bone px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors hover:bg-bone hover:text-void"
          >
            <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
            {{ newRequests }} nouvelle{{ newRequests > 1 ? 's' : '' }} demande{{ newRequests > 1 ? 's' : '' }} de booking / collab à traiter
          </NuxtLink>

          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink
              to="/budget"
              class="group inline-flex items-center gap-2 bg-bone px-5 py-3 font-mono text-sm uppercase tracking-widest text-void transition-transform hover:-translate-y-0.5"
            >
              Budget caissons
              <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
            <NuxtLink
              to="/admin"
              class="inline-flex items-center gap-2 border border-line px-5 py-3 font-mono text-sm uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
            >
              Éditer le site
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- ====================== LIENS ====================== -->
      <section id="liens" class="py-10 md:py-16">
        <SectionHead kicker="// la table de mixage" title="Les raccourcis" :aside="`${linkGroups.length} canaux`" />

        <p v-if="loadError" class="mb-6 border border-line bg-grave px-4 py-3 font-mono text-sm text-red-400">
          Impossible de charger les raccourcis : {{ loadError }}
        </p>

        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <LinkCard
            v-for="g in linkGroups"
            :id="g.id"
            :key="g.id"
            :group="g"
            class="scroll-mt-24"
          />
        </div>

        <p class="reveal mt-8 font-mono text-xs leading-relaxed text-ash">
          Les liens marqués <span class="border border-ash/40 px-1.5 py-0.5">à brancher</span> sont à
          compléter depuis l'<NuxtLink to="/admin?tab=liens" class="text-smoke underline-offset-2 hover:underline">espace admin</NuxtLink>.
        </p>
      </section>
    </AuthGate>
  </div>
</template>
