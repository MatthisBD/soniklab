/**
 * Copie un texte dans le presse-papier, avec un état « copié » temporaire
 * pour afficher un retour (« Copié ✓ ») à côté du bouton.
 */
export function useCopy(duration = 1800) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Repli (vieux navigateurs / contexte non sécurisé) : textarea temporaire.
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), duration)
  }

  return { copied, copy }
}

/** Lien « nouveau message » Gmail (web), utile quand aucune appli mail n'est installée. */
export function gmailComposeUrl(to: string, subject = '', body = '') {
  const p = new URLSearchParams({ view: 'cm', fs: '1', to })
  if (subject) p.set('su', subject)
  if (body) p.set('body', body)
  return `https://mail.google.com/mail/?${p.toString().replace(/\+/g, '%20')}`
}

export function mailtoUrl(to: string, subject = '', body = '') {
  const p = new URLSearchParams()
  if (subject) p.set('subject', subject)
  if (body) p.set('body', body)
  const q = p.toString().replace(/\+/g, '%20') // mailto attend %20, pas « + »
  return `mailto:${to}${q ? `?${q}` : ''}`
}
