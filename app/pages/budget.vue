<script setup lang="ts">
import {
  type BudgetCategory,
  type CostLine,
  type RevenueLine,
  fetchBudget,
  lineCost,
  lineCounts,
  unitCost,
  optionalCost,
  totalCost,
  totalRevenue,
  balance,
  formatEur,
} from '~/composables/useBudget'

useHead({ title: 'SONIKLAB — Budget' })

const supabase = useSupabase()
const auth = useAuth()
const budget = useBudget()

// --- état UI ---
const email = ref('')
const password = ref('')
const loginError = ref('')
const loading = ref(false)
const message = ref('')
const categories = ref<BudgetCategory[]>([])

// Vue liste (cartes résumées) ↔ éditeur d'un seul caisson.
// null = on voit la liste ; sinon = on édite le caisson de cet id.
const editingId = ref<string | null>(null)
const editing = computed(() => categories.value.find((c) => c.id === editingId.value) ?? null)
// Liste de 0 ou 1 élément : permet de réutiliser le même markup `c` dans l'éditeur.
const editingList = computed(() => (editing.value ? [editing.value] : []))

function openEditor(c: BudgetCategory) {
  editingId.value = c.id
}
function closeEditor() {
  editingId.value = null
}

function flash(text: string) {
  message.value = text
  setTimeout(() => (message.value = ''), 2500)
}

async function loadData() {
  loading.value = true
  try {
    categories.value = await fetchBudget(supabase)
  } catch (e: any) {
    flash(`Erreur de chargement : ${e.message}`)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await auth.init()
  if (auth.isAdmin.value) await loadData()
})

watch(
  () => auth.isAdmin.value,
  (isAdmin) => {
    if (isAdmin && !categories.value.length) loadData()
  },
)

// ---------------- Connexion ----------------
async function onLogin() {
  loginError.value = ''
  loading.value = true
  try {
    await auth.signIn(email.value.trim(), password.value)
    password.value = ''
  } catch (e: any) {
    loginError.value = e.message || 'Connexion impossible.'
  } finally {
    loading.value = false
  }
}

async function onLogout() {
  await auth.signOut()
  categories.value = []
}

// ---------------- Catégories ----------------
async function addCategory() {
  try {
    const row = await budget.addCategory(categories.value.length)
    categories.value.push({
      id: row!.id,
      name: row!.name,
      note: row!.note ?? undefined,
      units: row!.units ?? 1,
      position: row!.position,
      costLines: [],
      revenueLines: [],
    })
    // On ouvre directement le nouveau caisson en édition.
    editingId.value = row!.id
    flash('Caisson ajouté.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function saveCategory(c: BudgetCategory) {
  try {
    await budget.saveCategory(c)
    flash(`« ${c.name} » enregistré.`)
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function removeCategory(c: BudgetCategory, idx: number) {
  if (!confirm(`Supprimer « ${c.name} » et toutes ses lignes ?`)) return
  try {
    await budget.deleteCategory(c.id)
    categories.value.splice(idx, 1)
    if (editingId.value === c.id) editingId.value = null
    flash('Caisson supprimé.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

// ---------------- Lignes de coût ----------------
async function addCostLine(c: BudgetCategory) {
  try {
    const line = await budget.addCostLine(c.id, c.costLines.length)
    c.costLines.push(line)
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function saveCostLine(l: CostLine) {
  try {
    await budget.saveCostLine(l)
    flash('Ligne enregistrée.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function removeCostLine(c: BudgetCategory, idx: number) {
  const l = c.costLines[idx]!
  if (!confirm(`Supprimer la ligne « ${l.label} » ?`)) return
  try {
    await budget.deleteCostLine(l.id)
    c.costLines.splice(idx, 1)
    flash('Ligne supprimée.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function moveCostLine(c: BudgetCategory, idx: number, dir: -1 | 1) {
  const target = idx + dir
  if (target < 0 || target >= c.costLines.length) return
  const arr = c.costLines
  ;[arr[idx], arr[target]] = [arr[target]!, arr[idx]!]
  arr.forEach((l, i) => (l.position = i))
  try {
    await budget.reorderCostLines(arr.map((l) => ({ id: l.id, position: l.position })))
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

// ---------------- Lignes de recette ----------------
async function addRevenueLine(c: BudgetCategory) {
  try {
    const line = await budget.addRevenueLine(c.id, c.revenueLines.length)
    c.revenueLines.push(line)
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function saveRevenueLine(r: RevenueLine) {
  try {
    await budget.saveRevenueLine(r)
    flash('Recette enregistrée.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}

async function removeRevenueLine(c: BudgetCategory, idx: number) {
  const r = c.revenueLines[idx]!
  if (!confirm(`Supprimer la recette « ${r.label} » ?`)) return
  try {
    await budget.deleteRevenueLine(r.id)
    c.revenueLines.splice(idx, 1)
    flash('Recette supprimée.')
  } catch (e: any) {
    flash(`Erreur : ${e.message}`)
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-5 py-10">
    <!-- en-tête -->
    <header class="mb-8 flex items-center justify-between border-b border-line pb-5">
      <NuxtLink to="/" class="group block">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// budget caissons · retour au site</p>
        <h1 class="mt-1 font-display text-4xl uppercase tracking-wide transition-colors group-hover:text-smoke">
          SONIKLAB
        </h1>
      </NuxtLink>
      <div class="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
        <NuxtLink v-if="auth.isAdmin.value" to="/admin" class="text-ash transition-colors hover:text-bone">Admin</NuxtLink>
        <NuxtLink to="/" class="text-ash transition-colors hover:text-bone">← le site</NuxtLink>
        <button
          v-if="auth.isLoggedIn.value"
          class="border border-line px-3 py-2 text-smoke transition-colors hover:border-bone hover:text-bone"
          @click="onLogout"
        >
          Déconnexion
        </button>
      </div>
    </header>

    <!-- message flash -->
    <p
      v-if="message"
      class="mb-6 border border-line bg-grave px-4 py-3 font-mono text-sm text-bone"
    >
      {{ message }}
    </p>

    <!-- chargement initial de l'auth -->
    <p v-if="!auth.ready.value" class="font-mono text-sm text-ash">Chargement…</p>

    <!-- ============ NON CONNECTÉ : connexion ============ -->
    <form
      v-else-if="!auth.isLoggedIn.value"
      class="mx-auto max-w-sm space-y-4 border border-line bg-grave p-6"
      @submit.prevent="onLogin"
    >
      <p class="font-mono text-xs uppercase tracking-widest text-ash">Espace interne — connexion</p>
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

    <!-- ============ CONNECTÉ MAIS PAS ADMIN ============ -->
    <div v-else-if="!auth.isAdmin.value" class="mx-auto max-w-sm space-y-4 border border-line bg-grave p-6 text-center">
      <p class="font-display text-2xl uppercase tracking-wide">Accès réservé</p>
      <p class="text-sm text-smoke">
        Tu es connecté en tant que
        <span class="font-mono text-bone">{{ auth.user.value?.email }}</span>,
        mais cet outil est réservé aux membres avec les droits d'édition.
      </p>
      <button
        class="border border-line px-4 py-2 font-mono text-xs uppercase tracking-widest text-smoke transition-colors hover:border-bone hover:text-bone"
        @click="onLogout"
      >
        Se déconnecter
      </button>
    </div>

    <!-- ============ ADMIN : l'outil ============ -->
    <div v-else>
      <!-- ===================== VUE LISTE (cartes) ===================== -->
      <template v-if="!editing">
        <div class="flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// la régie budget</p>
            <h2 class="mt-1 font-display text-3xl uppercase tracking-wide">Caissons</h2>
          </div>
          <button
            class="border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-smoke hover:border-bone hover:text-bone"
            @click="addCategory"
          >
            + Caisson
          </button>
        </div>

        <p v-if="!categories.length" class="mt-8 font-mono text-sm text-ash">
          Aucun caisson pour l'instant. Clique sur « + Caisson » pour commencer.
        </p>

        <!-- grille : une carte résumé par caisson, 2 par ligne -->
        <div v-else class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <button
            v-for="(c, ci) in categories"
            :key="c.id"
            type="button"
            class="group relative flex flex-col border border-line bg-grave p-5 text-left transition-colors hover:border-bone"
            @click="openEditor(c)"
          >
            <span class="absolute inset-x-0 -top-px h-px bg-bone/30" />
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <span class="font-mono text-xs tracking-widest text-ash">{{ String(ci + 1).padStart(2, '0') }}</span>
                <h3 class="glitch mt-1 truncate font-display text-2xl uppercase leading-none tracking-wide">
                  {{ c.name || 'Sans nom' }}
                </h3>
                <p v-if="c.note" class="mt-1 truncate font-mono text-xs text-ash">{{ c.note }}</p>
              </div>
              <span class="shrink-0 border border-line px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-smoke">
                ×{{ c.units }}
              </span>
            </div>

            <!-- chiffres clés -->
            <div class="mt-4 grid grid-cols-2 gap-px border border-line bg-line">
              <div class="bg-ink p-2.5">
                <p class="font-mono text-[0.55rem] uppercase tracking-widest text-ash">Coût / caisson</p>
                <p class="mt-0.5 font-display text-lg">{{ formatEur(unitCost(c)) }}</p>
              </div>
              <div class="bg-ink p-2.5">
                <p class="font-mono text-[0.55rem] uppercase tracking-widest text-ash">Solde</p>
                <p class="mt-0.5 font-display text-lg" :class="balance(c) >= 0 ? 'text-bone' : 'text-red-400'">
                  {{ balance(c) >= 0 ? '+' : '' }}{{ formatEur(balance(c)) }}
                </p>
              </div>
            </div>

            <span class="mt-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-smoke transition-colors group-hover:text-bone">
              Modifier
              <AppIcon name="arrow" class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </template>

      <!-- ===================== ÉDITEUR (un seul caisson) ===================== -->
      <template v-else>
      <article
        v-for="c in editingList"
        :key="c.id"
        class="border border-line bg-grave p-5"
      >
        <!-- barre de retour -->
        <button
          class="mb-5 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ash transition-colors hover:text-bone"
          @click="closeEditor"
        >
          ← Tous les caissons
        </button>

        <!-- ===== identité du caisson ===== -->
        <div class="mb-3 flex items-baseline gap-2">
          <h3 class="font-display text-2xl uppercase tracking-wide text-bone">Le caisson</h3>
          <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">nom, quantité, note</span>
        </div>

        <!-- en-tête catégorie -->
        <div class="grid gap-3 sm:grid-cols-[1.4fr_1fr_auto] sm:items-end">
          <label class="block">
            <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Nom du caisson</span>
            <input v-model="c.name" class="w-full border border-line bg-void px-3 py-2.5 font-display text-lg uppercase tracking-wide outline-none focus:border-bone" />
          </label>
          <label class="block">
            <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Nombre à produire</span>
            <input v-model.number="c.units" type="number" min="0" class="w-full border border-line bg-void px-3 py-2.5 text-lg outline-none focus:border-bone" />
          </label>
          <div class="flex gap-2">
            <button
              class="border border-line px-3 py-2 font-mono text-xs uppercase tracking-widest text-smoke hover:border-bone hover:text-bone"
              @click="saveCategory(c)"
            >
              Enregistrer
            </button>
            <button
              class="border border-red-500/40 px-3 py-2 font-mono text-xs uppercase tracking-widest text-red-400 hover:bg-red-500/10"
              @click="removeCategory(c, categories.indexOf(c))"
            >
              Suppr.
            </button>
          </div>
        </div>
        <label class="mt-3 block">
          <span class="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-ash">Note (optionnel)</span>
          <input v-model="c.note" placeholder="dimensions, modèle de HP…" class="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-bone" />
        </label>

        <!-- ===== lignes de coût ===== -->
        <div class="mt-5 border-t border-line pt-4">
          <div class="mb-3 flex items-baseline gap-2">
            <h3 class="font-display text-2xl uppercase tracking-wide text-bone">Matériaux</h3>
            <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">coût pour un caisson</span>
          </div>

          <div class="space-y-3">
            <div
              v-for="(l, li) in c.costLines"
              :key="l.id"
              class="border border-line/60 bg-void/40 p-3"
            >
              <!-- ligne 1 : libellé + mode -->
              <div class="grid gap-2 sm:grid-cols-[1.6fr_auto_auto]">
                <label class="block">
                  <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Libellé</span>
                  <input v-model="l.label" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                </label>
                <label class="block">
                  <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Mode</span>
                  <select v-model="l.mode" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone">
                    <option value="unit">unité</option>
                    <option value="surface">surface (m²)</option>
                  </select>
                </label>
                <div class="flex items-end gap-1">
                  <button title="Monter" class="border border-line px-2 py-1.5 text-xs text-ash hover:text-bone" @click="moveCostLine(c, li, -1)">↑</button>
                  <button title="Descendre" class="border border-line px-2 py-1.5 text-xs text-ash hover:text-bone" @click="moveCostLine(c, li, 1)">↓</button>
                  <button title="Enregistrer" class="border border-line px-2 py-1.5 text-xs text-smoke hover:text-bone" @click="saveCostLine(l)">✓</button>
                  <button title="Supprimer" class="border border-red-500/40 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10" @click="removeCostLine(c, li)">✕</button>
                </div>
              </div>

              <!-- ligne 2 : chiffres selon le mode -->
              <div class="mt-2 grid items-end gap-2 sm:grid-cols-4">
                <template v-if="l.mode === 'surface'">
                  <label class="block">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Largeur (cm)</span>
                    <input v-model.number="l.widthCm" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Hauteur (cm)</span>
                    <input v-model.number="l.heightCm" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Quantité</span>
                    <input v-model.number="l.quantity" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Prix au m² (€)</span>
                    <input v-model.number="l.unitPrice" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                </template>
                <template v-else>
                  <label class="block">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Quantité</span>
                    <input v-model.number="l.quantity" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                  <label class="block">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Unité</span>
                    <input v-model="l.unitLabel" placeholder="pièce…" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                  <label class="block sm:col-span-2">
                    <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Prix unitaire (€)</span>
                    <input v-model.number="l.unitPrice" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
                  </label>
                </template>
              </div>

              <!-- ligne 3 : options + coût de la ligne -->
              <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-4 font-mono text-[0.65rem] uppercase tracking-widest text-ash">
                  <label class="flex items-center gap-1.5">
                    <input v-model="l.optional" type="checkbox" class="accent-bone" />
                    optionnel
                  </label>
                  <label v-if="l.optional" class="flex items-center gap-1.5" :class="l.included ? 'text-bone' : 'text-ash'">
                    <input v-model="l.included" type="checkbox" class="accent-bone" />
                    inclus dans le total
                  </label>
                </div>
                <span
                  class="font-mono text-sm"
                  :class="lineCounts(l) ? 'text-bone' : 'text-ash line-through'"
                >
                  {{ formatEur(lineCost(l)) }}
                </span>
              </div>
            </div>
          </div>

          <button
            class="mt-3 font-mono text-xs uppercase tracking-widest text-ash hover:text-bone"
            @click="addCostLine(c)"
          >
            + Ligne matériau
          </button>
        </div>

        <!-- ===== lignes de recette ===== -->
        <div class="mt-5 border-t border-line pt-4">
          <div class="mb-3 flex items-baseline gap-2">
            <h3 class="font-display text-2xl uppercase tracking-wide text-bone">Recettes</h3>
            <span class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">ce qu'on revend pour ce projet</span>
          </div>

          <div
            v-for="(r, ri) in c.revenueLines"
            :key="r.id"
            class="mb-2 grid items-end gap-2 sm:grid-cols-[1.6fr_0.7fr_1fr_auto_auto]"
          >
            <label class="block">
              <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Libellé</span>
              <input v-model="r.label" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Qté</span>
              <input v-model.number="r.quantity" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
            </label>
            <label class="block">
              <span class="mb-1 block font-mono text-[0.6rem] uppercase tracking-widest text-ash">Prix (€)</span>
              <input v-model.number="r.unitPrice" type="number" min="0" step="any" class="w-full border border-line bg-void px-2.5 py-1.5 text-sm outline-none focus:border-bone" />
            </label>
            <span class="pb-1.5 font-mono text-sm text-bone">{{ formatEur(r.quantity * r.unitPrice) }}</span>
            <div class="flex gap-1">
              <button title="Enregistrer" class="border border-line px-2 py-1.5 text-xs text-smoke hover:text-bone" @click="saveRevenueLine(r)">✓</button>
              <button title="Supprimer" class="border border-red-500/40 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10" @click="removeRevenueLine(c, ri)">✕</button>
            </div>
          </div>

          <button
            class="mt-1 font-mono text-xs uppercase tracking-widest text-ash hover:text-bone"
            @click="addRevenueLine(c)"
          >
            + Ligne recette
          </button>
        </div>

        <!-- ===== récap ===== -->
        <div class="mt-5 grid gap-px border border-line bg-line sm:grid-cols-4">
          <div class="bg-ink p-3">
            <p class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">Coût / caisson</p>
            <p class="mt-1 font-display text-xl">{{ formatEur(unitCost(c)) }}</p>
            <p v-if="optionalCost(c) > 0" class="mt-0.5 font-mono text-[0.6rem] text-ash">dont optionnel {{ formatEur(optionalCost(c)) }}</p>
          </div>
          <div class="bg-ink p-3">
            <p class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">Investissement (×{{ c.units }})</p>
            <p class="mt-1 font-display text-xl">{{ formatEur(totalCost(c)) }}</p>
          </div>
          <div class="bg-ink p-3">
            <p class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">Recettes</p>
            <p class="mt-1 font-display text-xl">{{ formatEur(totalRevenue(c)) }}</p>
          </div>
          <div class="bg-ink p-3">
            <p class="font-mono text-[0.6rem] uppercase tracking-widest text-ash">Solde</p>
            <p class="mt-1 font-display text-xl" :class="balance(c) >= 0 ? 'text-bone' : 'text-red-400'">
              {{ balance(c) >= 0 ? '+' : '' }}{{ formatEur(balance(c)) }}
            </p>
          </div>
        </div>
      </article>
      </template>
    </div>
  </div>
</template>
