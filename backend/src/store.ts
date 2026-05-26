import { mapCourseRow, mapCourseSummary, mapLessonRow, sortLessons } from './db/mappers'
import type { DbCourse, DbCourseInsert, DbLesson, DbLessonInsert } from './db/types'
import { isUuid, parseDurationSeconds, slugify, uniqueSlug } from './db/utils'
import { createSupabaseClient } from './supabase'
import type { Env } from './env'
import type { Course, CourseInput, Lesson, LessonInput } from './types'

async function getClient(env: Env) {
  return createSupabaseClient(env)
}

async function findCourseRow(env: Env, courseRef: string): Promise<DbCourse | null> {
  const client = await getClient(env)

  let query = client.from('courses').select('*').limit(1)
  if (isUuid(courseRef)) {
    query = query.or(`id.eq.${courseRef},slug.eq.${courseRef}`)
  } else {
    query = query.eq('slug', courseRef)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

async function fetchLessonsForCourse(env: Env, courseId: string): Promise<Lesson[]> {
  const client = await getClient(env)
  const { data, error } = await client
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapLessonRow)
}

export async function getCategories(env: Env): Promise<string[]> {
  const client = await getClient(env)
  const { data, error } = await client.from('courses').select('category')
  if (error) throw error

  return [...new Set((data ?? []).map((row) => row.category))].sort()
}

export async function listCourses(env: Env) {
  const client = await getClient(env)
  const { data, error } = await client
    .from('courses')
    .select('*')
    .order('title', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapCourseSummary)
}

export async function getCoursePublic(env: Env, courseRef: string) {
  const row = await findCourseRow(env, courseRef)
  if (!row) return undefined

  const lessons = await fetchLessonsForCourse(env, row.id)
  return {
    ...mapCourseSummary(row),
    lessons: sortLessons(lessons),
  }
}

export async function getLessons(env: Env, courseRef: string): Promise<Lesson[]> {
  const row = await findCourseRow(env, courseRef)
  if (!row) return []
  return fetchLessonsForCourse(env, row.id)
}

export async function adminListCourses(env: Env): Promise<Course[]> {
  const client = await getClient(env)
  const { data, error } = await client
    .from('courses')
    .select('*, lessons(*)')
    .order('title', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'lessons' })

  if (error) throw error

  return (data ?? []).map((row) => {
    const lessonRows = (row.lessons ?? []) as DbLesson[]
    const lessons = sortLessons(lessonRows.map(mapLessonRow))
    return mapCourseRow(row as DbCourse, lessons)
  })
}

export async function adminCreateCourse(env: Env, input: CourseInput): Promise<Course> {
  const client = await getClient(env)
  const baseSlug = slugify(input.slug ?? input.title) || 'new-course'
  const slug = await uniqueSlug(client, baseSlug)

  const payload: DbCourseInsert = {
    slug,
    title: input.title,
    category: input.category,
    short_description: input.shortDescription ?? input.description.slice(0, 120),
    description: input.description,
    overview: input.overview ?? input.description,
    what_you_learn: input.whatYouLearn ?? [],
    price_cents: Math.round(input.price * 100),
    currency: 'USD',
    status: input.status,
  }

  const { data, error } = await client.from('courses').insert(payload).select('*').single()
  if (error) throw error

  return mapCourseRow(data, [])
}

export async function adminUpdateCourse(
  env: Env,
  courseRef: string,
  input: Partial<CourseInput>,
): Promise<Course | undefined> {
  const client = await getClient(env)
  const existing = await findCourseRow(env, courseRef)
  if (!existing) return undefined

  const patch: Partial<DbCourseInsert> & { updated_at?: string } = {}

  if (input.title !== undefined) patch.title = input.title
  if (input.category !== undefined) patch.category = input.category
  if (input.shortDescription !== undefined) patch.short_description = input.shortDescription
  if (input.description !== undefined) patch.description = input.description
  if (input.overview !== undefined) patch.overview = input.overview
  if (input.whatYouLearn !== undefined) patch.what_you_learn = input.whatYouLearn
  if (input.price !== undefined) patch.price_cents = Math.round(input.price * 100)
  if (input.status !== undefined) patch.status = input.status
  if (input.slug !== undefined) {
    patch.slug = await uniqueSlug(client, slugify(input.slug), existing.id)
  }

  const { data, error } = await client
    .from('courses')
    .update(patch)
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) throw error

  const lessons = await fetchLessonsForCourse(env, data.id)
  return mapCourseRow(data, lessons)
}

export async function adminDeleteCourse(env: Env, courseRef: string): Promise<boolean> {
  const client = await getClient(env)
  const existing = await findCourseRow(env, courseRef)
  if (!existing) return false

  const { error, count } = await client
    .from('courses')
    .delete({ count: 'exact' })
    .eq('id', existing.id)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function adminGetLessons(env: Env, courseRef: string): Promise<Lesson[] | undefined> {
  const row = await findCourseRow(env, courseRef)
  if (!row) return undefined
  return fetchLessonsForCourse(env, row.id)
}

export async function adminCreateLesson(
  env: Env,
  courseRef: string,
  input: LessonInput,
): Promise<Lesson | undefined> {
  const client = await getClient(env)
  const course = await findCourseRow(env, courseRef)
  if (!course) return undefined

  const payload: DbLessonInsert = {
    course_id: course.id,
    title: input.title,
    description: input.description ?? '',
    duration_seconds: parseDurationSeconds(input.duration),
    sort_order: input.sortOrder,
    is_preview: input.isPreview ?? input.sortOrder === 1,
    objectives: input.objectives ?? [],
    notes: input.notes ?? '',
    video_provider: null,
    video_uid: null,
    video_status: 'none',
  }

  const { data, error } = await client.from('lessons').insert(payload).select('*').single()
  if (error) throw error

  return mapLessonRow(data)
}

export async function adminUpdateLesson(
  env: Env,
  lessonId: string,
  input: Partial<LessonInput>,
): Promise<Lesson | undefined> {
  const client = await getClient(env)

  const { data: existing, error: fetchError } = await client
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) return undefined

  const patch: Partial<DbLessonInsert> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder
  if (input.isPreview !== undefined) patch.is_preview = input.isPreview
  if (input.objectives !== undefined) patch.objectives = input.objectives
  if (input.notes !== undefined) patch.notes = input.notes
  if (input.duration !== undefined) {
    patch.duration_seconds = parseDurationSeconds(input.duration)
  }

  const { data, error } = await client
    .from('lessons')
    .update(patch)
    .eq('id', lessonId)
    .select('*')
    .single()

  if (error) throw error

  await client.from('courses').update({ updated_at: new Date().toISOString() }).eq('id', existing.course_id)

  return mapLessonRow(data)
}

export async function adminDeleteLesson(env: Env, lessonId: string): Promise<boolean> {
  const client = await getClient(env)

  const { data: existing, error: fetchError } = await client
    .from('lessons')
    .select('course_id')
    .eq('id', lessonId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) return false

  const { error, count } = await client
    .from('lessons')
    .delete({ count: 'exact' })
    .eq('id', lessonId)

  if (error) throw error
  return (count ?? 0) > 0
}
