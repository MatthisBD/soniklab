import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
//  SONIKLAB — Budget caissons (page interne /budget)
//  Données PRIVÉES (lecture + écriture réservées aux admins via RLS).
//  Trois tables : budget_categories, budget_cost_lines, budget_revenue_lines.
// ============================================================

/** Mode de saisie d'une ligne de coût. */
export type CostMode = 'unit' | 'surface'

/** Une ligne de coût (matériau) d'une catégorie. */
export type CostLine = {
  id: string
  label: string
  /** 'unit' = quantité × prix ; 'surface' = (L×H en cm) × quantité × prix au m². */
  mode: CostMode
  quantity: number
  /** mode surface : dimensions en centimètres. */
  widthCm: number
  heightCm: number
  /** mode unité : prix unitaire ; mode surface : prix au m². */
  unitPrice: number
  /** étiquette d'unité libre (mode unité), ex. « pièce ». */
  unitLabel?: string
  /** ligne facultative (ex. haut-parleur déjà dispo). */
  optional: boolean
  /** comptée dans le total ? (pertinent surtout si optional). */
  included: boolean
  position: number
}

/** Une ligne de recette (« on revend telle chose »). */
export type RevenueLine = {
  id: string
  label: string
  quantity: number
  unitPrice: number
  position: number
}

/** Un type de caisson / projet budgété. */
export type BudgetCategory = {
  id: string
  name: string
  note?: string
  /** nombre de caissons à produire (multiplie le coût unitaire). */
  units: number
  position: number
  costLines: CostLine[]
  revenueLines: RevenueLine[]
}

// ---------------- Calculs (fonctions pures) ----------------

/** Coût d'une ligne (sans tenir compte de included/optional). */
export function lineCost(l: CostLine): number {
  if (l.mode === 'surface') {
    const m2 = (Number(l.widthCm) / 100) * (Number(l.heightCm) / 100)
    return m2 * Number(l.quantity) * Number(l.unitPrice)
  }
  return Number(l.quantity) * Number(l.unitPrice)
}

/** Une ligne compte dans le total si elle n'est pas optionnelle, ou si incluse. */
export function lineCounts(l: CostLine): boolean {
  return !l.optional || l.included
}

/** Coût de revient d'UN caisson (somme des lignes comptées). */
export function unitCost(c: BudgetCategory): number {
  return c.costLines.filter(lineCounts).reduce((sum, l) => sum + lineCost(l), 0)
}

/** Part optionnelle effectivement incluse dans le coût unitaire. */
export function optionalCost(c: BudgetCategory): number {
  return c.costLines
    .filter((l) => l.optional && l.included)
    .reduce((sum, l) => sum + lineCost(l), 0)
}

/** Investissement total = coût unitaire × nombre d'unités. */
export function totalCost(c: BudgetCategory): number {
  return unitCost(c) * Math.max(0, Number(c.units) || 0)
}

/** Total des recettes (lignes de revente). */
export function totalRevenue(c: BudgetCategory): number {
  return c.revenueLines.reduce(
    (sum, r) => sum + Number(r.quantity) * Number(r.unitPrice),
    0,
  )
}

/** Solde = recettes − investissement total. */
export function balance(c: BudgetCategory): number {
  return totalRevenue(c) - totalCost(c)
}

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
/** Formate un montant en euros (FR). */
export function formatEur(n: number): string {
  return eur.format(Number.isFinite(n) ? n : 0)
}

// ---------------- Lecture ----------------

/** Récupère toutes les catégories avec leurs lignes, triées par position. */
export async function fetchBudget(supabase: SupabaseClient): Promise<BudgetCategory[]> {
  const { data, error } = await supabase
    .from('budget_categories')
    .select(
      'id, name, note, units, position,' +
        ' cost_lines:budget_cost_lines(id, label, mode, quantity, width_cm, height_cm, unit_price, unit_label, optional, included, position),' +
        ' revenue_lines:budget_revenue_lines(id, label, quantity, unit_price, position)',
    )
    .order('position')
    .order('position', { referencedTable: 'budget_cost_lines' })
    .order('position', { referencedTable: 'budget_revenue_lines' })

  if (error) throw error

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    note: c.note ?? undefined,
    units: c.units ?? 1,
    position: c.position,
    costLines: (c.cost_lines ?? []).map(mapCostRow),
    revenueLines: (c.revenue_lines ?? []).map((r: any) => ({
      id: r.id,
      label: r.label,
      quantity: Number(r.quantity),
      unitPrice: Number(r.unit_price),
      position: r.position,
    })),
  }))
}

function mapCostRow(l: any): CostLine {
  return {
    id: l.id,
    label: l.label,
    mode: (l.mode as CostMode) ?? 'unit',
    quantity: Number(l.quantity),
    widthCm: Number(l.width_cm ?? 0),
    heightCm: Number(l.height_cm ?? 0),
    unitPrice: Number(l.unit_price),
    unitLabel: l.unit_label ?? undefined,
    optional: !!l.optional,
    included: l.included ?? true,
    position: l.position,
  }
}

// ---------------- Écritures (admin) ----------------

/**
 * Opérations d'écriture du budget, réservées aux admins.
 * Les politiques RLS (is_admin) refusent toute écriture d'un non-admin.
 */
export function useBudget() {
  const supabase = useSupabase()

  // --------- Catégories ---------
  async function addCategory(position: number) {
    const { data, error } = await supabase
      .from('budget_categories')
      .insert({ name: 'Nouveau caisson', units: 1, position })
      .select('id, name, note, units, position')
      .single()
    if (error) throw error
    return data
  }

  async function saveCategory(c: BudgetCategory) {
    const { error } = await supabase
      .from('budget_categories')
      .update({
        name: c.name,
        note: c.note?.trim() ? c.note.trim() : null,
        units: Math.max(0, Number(c.units) || 0),
        position: c.position,
      })
      .eq('id', c.id)
    if (error) throw error
  }

  async function deleteCategory(id: string) {
    // Lignes supprimées en cascade (FK on delete cascade).
    const { error } = await supabase.from('budget_categories').delete().eq('id', id)
    if (error) throw error
  }

  async function moveCategory(id: string, position: number) {
    const { error } = await supabase
      .from('budget_categories')
      .update({ position })
      .eq('id', id)
    if (error) throw error
  }

  // --------- Lignes de coût ---------
  async function addCostLine(categoryId: string, position: number) {
    const { data, error } = await supabase
      .from('budget_cost_lines')
      .insert({
        category_id: categoryId,
        label: 'Nouvelle ligne',
        mode: 'unit',
        quantity: 1,
        unit_price: 0,
        optional: false,
        included: true,
        position,
      })
      .select(
        'id, label, mode, quantity, width_cm, height_cm, unit_price, unit_label, optional, included, position',
      )
      .single()
    if (error) throw error
    return mapCostRow(data)
  }

  async function saveCostLine(l: CostLine) {
    const { error } = await supabase
      .from('budget_cost_lines')
      .update({
        label: l.label,
        mode: l.mode,
        quantity: Number(l.quantity) || 0,
        width_cm: l.mode === 'surface' ? Number(l.widthCm) || 0 : null,
        height_cm: l.mode === 'surface' ? Number(l.heightCm) || 0 : null,
        unit_price: Number(l.unitPrice) || 0,
        unit_label: l.unitLabel?.trim() ? l.unitLabel.trim() : null,
        optional: l.optional,
        included: l.included,
        position: l.position,
      })
      .eq('id', l.id)
    if (error) throw error
  }

  async function deleteCostLine(id: string) {
    const { error } = await supabase.from('budget_cost_lines').delete().eq('id', id)
    if (error) throw error
  }

  async function reorderCostLines(lines: { id: string; position: number }[]) {
    for (const l of lines) {
      const { error } = await supabase
        .from('budget_cost_lines')
        .update({ position: l.position })
        .eq('id', l.id)
      if (error) throw error
    }
  }

  // --------- Lignes de recette ---------
  async function addRevenueLine(categoryId: string, position: number) {
    const { data, error } = await supabase
      .from('budget_revenue_lines')
      .insert({ category_id: categoryId, label: 'Vente', quantity: 1, unit_price: 0, position })
      .select('id, label, quantity, unit_price, position')
      .single()
    if (error) throw error
    return {
      id: data!.id,
      label: data!.label,
      quantity: Number(data!.quantity),
      unitPrice: Number(data!.unit_price),
      position: data!.position,
    } as RevenueLine
  }

  async function saveRevenueLine(r: RevenueLine) {
    const { error } = await supabase
      .from('budget_revenue_lines')
      .update({
        label: r.label,
        quantity: Number(r.quantity) || 0,
        unit_price: Number(r.unitPrice) || 0,
        position: r.position,
      })
      .eq('id', r.id)
    if (error) throw error
  }

  async function deleteRevenueLine(id: string) {
    const { error } = await supabase.from('budget_revenue_lines').delete().eq('id', id)
    if (error) throw error
  }

  return {
    addCategory,
    saveCategory,
    deleteCategory,
    moveCategory,
    addCostLine,
    saveCostLine,
    deleteCostLine,
    reorderCostLines,
    addRevenueLine,
    saveRevenueLine,
    deleteRevenueLine,
  }
}
