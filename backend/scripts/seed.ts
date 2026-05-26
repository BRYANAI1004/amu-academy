import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { seedCourses } from '../src/seed'
import { parseDurationSeconds } from '../src/db/utils'

function loadDevVars(): Record<string, string> {
  const path = resolve(process.cwd(), '.dev.vars')
  if (!existsSync(path)) return {}

  const vars: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return vars
}

function requireEnv(name: string, vars: Record<string, string>): string {
  const value = process.env[name] ?? vars[name]
  if (!value) {
    throw new Error(`Missing ${name}. Set it in backend/.dev.vars or the environment.`)
  }
  return value
}

async function main() {
  const devVars = loadDevVars()
  const url = requireEnv('SUPABASE_URL', devVars)
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', devVars)

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  console.log(`Seeding ${seedCourses.length} courses into Supabase…`)

  for (const course of seedCourses) {
    const { data: upsertedCourse, error: courseError } = await supabase
      .from('courses')
      .upsert(
        {
          slug: course.slug,
          title: course.title,
          category: course.category,
          description: course.description,
          short_description: course.shortDescription,
          overview: course.overview,
          what_you_learn: course.whatYouLearn,
          price_cents: course.priceCents,
          currency: 'USD',
          status: course.status,
        },
        { onConflict: 'slug' },
      )
      .select('*')
      .single()

    if (courseError) {
      throw new Error(`Failed to upsert course ${course.slug}: ${courseError.message}`)
    }

    for (const lesson of course.lessons) {
      const { error: lessonError } = await supabase.from('lessons').upsert(
        {
          course_id: upsertedCourse.id,
          title: lesson.title,
          description: lesson.description,
          duration_seconds: parseDurationSeconds(lesson.duration),
          sort_order: lesson.sortOrder,
          is_preview: lesson.isPreview,
          objectives: lesson.objectives ?? [],
          notes: lesson.notes ?? '',
          video_provider: lesson.videoProvider,
          video_uid: lesson.videoUid,
          video_status: lesson.videoStatus,
        },
        { onConflict: 'course_id,sort_order' },
      )

      if (lessonError) {
        throw new Error(
          `Failed to upsert lesson ${course.slug}#${lesson.sortOrder}: ${lessonError.message}`,
        )
      }
    }

    const { count, error: countError } = await supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', upsertedCourse.id)

    if (countError) {
      throw new Error(`Failed to count lessons for ${course.slug}: ${countError.message}`)
    }

    const { error: syncError } = await supabase
      .from('courses')
      .update({ lesson_count: count ?? 0 })
      .eq('id', upsertedCourse.id)

    if (syncError) {
      throw new Error(`Failed to sync lesson_count for ${course.slug}: ${syncError.message}`)
    }

    console.log(`  ✓ ${course.slug} (${count ?? 0} lessons)`)
  }

  console.log('Seed complete.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
