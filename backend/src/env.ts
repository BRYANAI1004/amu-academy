export interface Env {
  SUPABASE_URL?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_STREAM_API_TOKEN?: string
}

export class SupabaseConfigError extends Error {
  readonly code = 'SUPABASE_NOT_CONFIGURED'

  constructor(
    message = 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env.',
  ) {
    super(message)
    this.name = 'SupabaseConfigError'
  }
}

export function isSupabaseConfigError(error: unknown): error is SupabaseConfigError {
  return (
    error instanceof SupabaseConfigError ||
    (error instanceof Error && error.name === 'SupabaseConfigError')
  )
}

export function requireSupabaseEnv(env: Env): { url: string; serviceRoleKey: string } {
  const url = env.SUPABASE_URL?.trim()
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceRoleKey) {
    throw new SupabaseConfigError()
  }

  return { url, serviceRoleKey }
}
