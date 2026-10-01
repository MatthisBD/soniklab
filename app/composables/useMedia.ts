import type { MediaKind } from './useShowcase'

// ============================================================
//  Médias : upload vers Supabase Storage (bucket public « media »)
//  + détection du type d'un lien (YouTube, Vimeo, fichier vidéo…).
// ============================================================

const BUCKET = 'media'
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // limite du plan gratuit Supabase

/**
 * Réduit une photo (≤ 1600 px de côté, WebP) avant l'envoi : une photo de
 * téléphone passe de ~5 Mo à ~300 Ko, ça préserve le quota de stockage et
 * le site reste rapide. Les GIF (animés) et les vidéos passent tels quels.
 */
async function shrinkImage(file: File, max = 1600, quality = 0.84): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  // Si le navigateur ne sait pas encoder en WebP, ou que l'original était déjà plus léger.
  return blob && blob.type === 'image/webp' && blob.size < file.size ? blob : file
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

export function useMedia() {
  const supabase = useSupabase()

  /** Envoie un fichier dans `dossier/` et renvoie son URL publique + son type. */
  async function upload(file: File, folder: string): Promise<{ url: string; kind: MediaKind }> {
    const isVideo = file.type.startsWith('video/')
    if (!isVideo && !file.type.startsWith('image/')) throw new Error(`Format non supporté : ${file.name}`)
    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      throw new Error(
        `« ${file.name} » dépasse 50 Mo. Mets la vidéo sur YouTube/Instagram et colle le lien à la place.`,
      )
    }

    const body = isVideo ? file : await shrinkImage(file)
    const ext = EXT[body.type] ?? file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
      contentType: body.type,
      cacheControl: '31536000',
    })
    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return { url: data.publicUrl, kind: isVideo ? 'video' : 'image' }
  }

  /** Supprime le fichier s'il vient de notre bucket (sans erreur sinon). */
  async function removeFile(url: string | null | undefined) {
    const marker = `/storage/v1/object/public/${BUCKET}/`
    const at = url?.indexOf(marker) ?? -1
    if (!url || at < 0) return
    await supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(at + marker.length))])
  }

  return { upload, removeFile }
}

// ---------------- Liens externes ----------------

/** URL d'intégration (iframe) pour YouTube / Vimeo, sinon null. */
export function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

/** Devine le type d'un média à partir d'un lien collé dans l'admin. */
export function kindFromUrl(url: string): MediaKind {
  if (embedUrl(url)) return 'embed'
  const path = url.split(/[?#]/)[0]!.toLowerCase()
  if (/\.(mp4|webm|mov)$/.test(path)) return 'video'
  if (/\.(jpe?g|png|webp|gif|avif)$/.test(path)) return 'image'
  return 'link'
}

/** Icône à afficher pour un lien d'artiste / de réseau (cf. AppIcon). */
export function linkIcon(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('soundcloud')) return 'soundcloud'
  if (u.includes('instagram')) return 'instagram'
  if (u.includes('youtu')) return 'play'
  if (u.startsWith('mailto:')) return 'mail'
  return 'arrow'
}
