import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireSupabaseEnv, type Env } from './env'

export function createSupabaseClient(env: Env): SupabaseClient {
  const { url, serviceRoleKey } = requireSupabaseEnv(env)
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
