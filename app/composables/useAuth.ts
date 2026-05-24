import type { User } from '@supabase/supabase-js'

/**
 * Authentification admin via Supabase Auth (email + mot de passe).
 * La session est conservée dans le navigateur (localStorage).
 */
export function useAuth() {
  const supabase = useSupabase()
  const user = useState<User | null>('auth-user', () => null)
  const ready = useState<boolean>('auth-ready', () => false)

  /** À appeler une fois côté client pour charger la session existante. */
  async function init() {
    if (!import.meta.client || ready.value) return
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
    ready.value = true
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
    return data.user
  }

  /** Connexion via Google. Redirige vers /admin au retour. */
  async function signInWithGoogle() {
    const base = useRuntimeConfig().app.baseURL
    const redirectTo = `${window.location.origin}${base}admin`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  async function changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  // Le rôle admin vit dans app_metadata (non modifiable par l'utilisateur).
  const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')
  const isLoggedIn = computed(() => !!user.value)

  return {
    user,
    ready,
    init,
    signIn,
    signInWithGoogle,
    signOut,
    changePassword,
    isAdmin,
    isLoggedIn,
  }
}
