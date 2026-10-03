/**
 * Compteur de visiteurs du pied de page (SQL : supabase/visites.sql).
 *
 * Une « personne » = un navigateur, comptée UNE fois, et seulement si elle a
 * l'air humaine :
 *  - le comptage se fait en JS : la plupart des robots (Google, aperçus de
 *    liens WhatsApp/Insta, aspirateurs) n'exécutent pas le JS ;
 *  - les robots déclarés (user-agent) et navigateurs pilotés sont écartés ;
 *  - il faut ~5 s d'onglet visible ou une vraie interaction (clic, touche,
 *    molette, doigt) ;
 *  - les membres connectés ne comptent pas, et leur navigateur plus jamais.
 * Rien de personnel n'est envoyé : la base ne reçoit qu'un « +1 aujourd'hui ».
 */

const STORAGE_KEY = 'soniklab:visit' // date du dernier comptage, ou 'member'
const MEMBER = 'member'
const PRESENCE_MS = 5000
const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|inspectiontool|prerender|phantom|puppeteer|playwright|selenium/i
const HUMAN_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

// Une seule tentative par chargement de page (navigation interne comprise).
let started = false

/** Total affiché (null tant qu'il n'est pas connu → compteur masqué). */
export function useVisitTotal() {
  return useState<number | null>('visit-total', () => null)
}

export function useVisitCounter() {
  const supabase = useSupabase()
  const total = useVisitTotal()

  function setTotal(n: unknown) {
    if (typeof n === 'number') total.value = Math.max(total.value ?? 0, n)
  }

  async function refresh() {
    const { data, error } = await supabase.rpc('visit_total')
    if (!error) setTotal(data)
  }

  async function register(firstTime: boolean) {
    const { data } = await supabase.auth.getSession()
    if (data.session) return writeMark(MEMBER)
    const res = await supabase.rpc('register_visit', { first_time: firstTime })
    if (res.error) return
    writeMark(today())
    setTotal(res.data)
  }

  /** À appeler côté client sur les pages publiques. */
  function track() {
    if (!import.meta.client || started) return
    started = true
    void refresh()

    const mark = readMark()
    // undefined = stockage bloqué : on ne pourrait pas éviter les doublons.
    if (mark === undefined || mark === MEMBER || mark === today()) return
    if (!looksHuman() || isLocal()) return
    onPresence(() => void register(mark === null))
  }

  return { total, track }
}

function looksHuman() {
  const ua = navigator.userAgent.replace(/cubot/gi, '') // marque de téléphone, pas un robot
  return !navigator.webdriver && !BOT_UA.test(ua)
}

// En dev / preview, on lit le vrai compteur sans le gonfler.
function isLocal() {
  return import.meta.dev || /^(localhost|127\.|\[::1\])/.test(location.hostname)
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readMark(): string | null | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return undefined
  }
}

function writeMark(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {}
}

/** Appelle `cb` après PRESENCE_MS d'onglet visible ou à la 1re vraie interaction. */
function onPresence(cb: () => void) {
  let left = PRESENCE_MS
  let since = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let fired = false

  function done() {
    if (fired) return
    fired = true
    clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisibility)
    HUMAN_EVENTS.forEach((e) => window.removeEventListener(e, onInput, true))
    cb()
  }
  function onInput(e: Event) {
    if (e.isTrusted) done()
  }
  function onVisibility() {
    if (document.visibilityState === 'visible') {
      since = Date.now()
      timer = setTimeout(done, left)
    } else {
      clearTimeout(timer)
      left -= Date.now() - since
    }
  }

  document.addEventListener('visibilitychange', onVisibility)
  HUMAN_EVENTS.forEach((e) => window.addEventListener(e, onInput, { capture: true, passive: true }))
  if (document.visibilityState === 'visible') onVisibility()
}
