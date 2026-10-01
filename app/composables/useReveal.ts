/**
 * Apparition au scroll des éléments `.reveal` (cf. main.css).
 * Un MutationObserver repère aussi les éléments ajoutés plus tard
 * (données chargées en asynchrone, onglets…) : rien à rappeler à la main.
 */
export function useReveal() {
  if (!import.meta.client) return
  let io: IntersectionObserver | null = null
  let mo: MutationObserver | null = null

  function scan() {
    document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((el) => io!.observe(el))
  }

  onMounted(() => {
    io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, idx) => {
            const el = e.target as HTMLElement
            setTimeout(() => el.classList.add('in'), (idx % 4) * 90)
            io!.unobserve(el)
          })
      },
      { threshold: 0.12 },
    )
    scan()
    mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
  })

  onBeforeUnmount(() => {
    io?.disconnect()
    mo?.disconnect()
  })
}
