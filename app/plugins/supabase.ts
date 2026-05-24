import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Crée un client Supabase unique, partagé dans toute l'app.
// Fonctionne aussi bien au build (prerender Node) que dans le navigateur.
// La persistance de session (localStorage) ne s'active que côté client.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const supabase: SupabaseClient = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey,
    {
      auth: {
        persistSession: import.meta.client,
        autoRefreshToken: import.meta.client,
        detectSessionInUrl: import.meta.client,
      },
    },
  )

  return { provide: { supabase } }
})
