/** Message de confirmation / d'erreur partagé par les outils internes. */
export function useFlash() {
  const message = useState<string>('flash-message', () => '')
  let timer: ReturnType<typeof setTimeout> | undefined

  function flash(text: string) {
    message.value = text
    clearTimeout(timer)
    timer = setTimeout(() => (message.value = ''), 3000)
  }

  /** Exécute une action et affiche « ok » ou l'erreur. */
  async function run(action: () => Promise<unknown>, ok?: string) {
    try {
      await action()
      if (ok) flash(ok)
      return true
    } catch (e: any) {
      flash(`Erreur : ${e.message ?? e}`)
      return false
    }
  }

  return { message, flash, run }
}
