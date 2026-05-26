export function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)/)
  return match ? Number(match[1]) * 60 : 0
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '0 min'
  return `${Math.round(seconds / 60)} min`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function uniqueSlug(
  client: ReturnType<typeof import('../supabase').createSupabaseClient>,
  base: string,
  excludeId?: string,
): Promise<string> {
  let slug = base
  let n = 1

  while (true) {
    let query = client.from('courses').select('id').eq('slug', slug).limit(1)
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) return slug

    slug = `${base}-${n++}`
  }
}
