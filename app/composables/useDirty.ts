/**
 * Repère les fiches modifiées mais pas encore enregistrées (admin).
 * On garde une « photo » JSON des champs éditables après chargement /
 * enregistrement, et on la compare à l'état courant.
 */
export function useDirty<T extends { id: string }>(pick: (row: T) => unknown) {
  const snapshots = reactive<Record<string, string>>({})

  /** À appeler après un chargement ou un enregistrement réussi. */
  function mark(row: T) {
    snapshots[row.id] = JSON.stringify(pick(row))
  }

  function isDirty(row: T) {
    const snap = snapshots[row.id]
    return snap !== undefined && snap !== JSON.stringify(pick(row))
  }

  return { mark, isDirty }
}
