import { CategoryInUseError, CategorySlugConflictError } from './categoryErrors'
import { mapCategoryRow, mapCourseRow, mapCourseSummary, mapLessonRow, sortLessons } from './db/mappers'
import type {
  DbCategory,
  DbCategoryInsert,
  DbCourse,
  DbCourseInsert,
  DbLesson,
  DbLessonInsert,
} from './db/types'
import { isUuid, parseDurationSeconds, slugify, sortCoursesByRecency, uniqueCategorySlug, uniqueSlug } from './db/utils'
import { createSupabaseClient } from './supabase'
import type { Env } from './env'
import type {
  Category,
  CategoryInput,
  CategoryWithCourseCount,
  Course,
  CourseInput,
  Lesson,
  LessonInput,
  LessonVideoInput,
} from './types'
import {
  COURSE_COVER_BUCKET,
  CoverUploadError,
  MAX_COVER_FILE_SIZE,
  safeCoverFileName,
} from './courseCover'

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

async function findCategoryRow(env: Env, categoryRef: string): Promise<DbCategory | null> {
  const client = await getClient(env)

  let query = client.from('categories').select('*').limit(1)
  if (isUuid(categoryRef)) {
    query = query.or(`id.eq.${categoryRef},slug.eq.${categoryRef}`)
  } else {
    query = query.eq('slug', categoryRef)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

async function countCoursesInCategory(env: Env, categoryName: string): Promise<number> {
  const client = await getClient(env)
  const { count, error } = await client
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('category', categoryName)

  if (error) throw error
  return count ?? 0
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
}

export async function listActiveCategories(env: Env): Promise<Category[]> {
  const client = await getClient(env)
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return sortCategories((data ?? []).map(mapCategoryRow))
}

export async function adminListCategories(env: Env): Promise<CategoryWithCourseCount[]> {
  const client = await getClient(env)
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error

  const { data: courseRows, error: courseError } = await client.from('courses').select('category')
  if (courseError) throw courseError

  const counts = new Map<string, number>()
  for (const row of courseRows ?? []) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
  }

  return sortCategories((data ?? []).map(mapCategoryRow)).map((category) => ({
    ...category,
    courseCount: counts.get(category.name) ?? 0,
  }))
}

export async function adminCreateCategory(env: Env, input: CategoryInput): Promise<Category> {
  const client = await getClient(env)
  const baseSlug = slugify(input.slug ?? input.name) || 'category'
  const slug = await uniqueCategorySlug(client, baseSlug)

  const payload: DbCategoryInsert = {
    name: input.name.trim(),
    slug,
    description: input.description ?? null,
    sort_order: input.sortOrder ?? 0,
    is_active: input.isActive ?? true,
  }

  const { data, error } = await client.from('categories').insert(payload).select('*').single()
  if (error) {
    if (error.code === '23505') throw new CategorySlugConflictError()
    throw error
  }

  return mapCategoryRow(data)
}

export async function adminUpdateCategory(
  env: Env,
  categoryRef: string,
  input: Partial<CategoryInput>,
): Promise<Category | undefined> {
  const client = await getClient(env)
  const existing = await findCategoryRow(env, categoryRef)
  if (!existing) return undefined

  const patch: Partial<DbCategoryInsert> = {}

  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.description !== undefined) patch.description = input.description
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder
  if (input.isActive !== undefined) patch.is_active = input.isActive
  if (input.slug !== undefined) {
    const baseSlug = slugify(input.slug) || slugify(existing.name)
    patch.slug = await uniqueCategorySlug(client, baseSlug, existing.id)
  }

  if (input.name !== undefined && input.name.trim() !== existing.name) {
    const { error: renameError } = await client
      .from('courses')
      .update({ category: input.name.trim() })
      .eq('category', existing.name)

    if (renameError) throw renameError
  }

  const { data, error } = await client
    .from('categories')
    .update(patch)
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') throw new CategorySlugConflictError()
    throw error
  }

  return mapCategoryRow(data)
}

export async function adminDeleteCategory(env: Env, categoryRef: string): Promise<boolean> {
  const client = await getClient(env)
  const existing = await findCategoryRow(env, categoryRef)
  if (!existing) return false

  const courseCount = await countCoursesInCategory(env, existing.name)
  if (courseCount > 0) {
    throw new CategoryInUseError()
  }

  const { error, count } = await client
    .from('categories')
    .delete({ count: 'exact' })
    .eq('id', existing.id)

  if (error) throw error
  return (count ?? 0) > 0
}

export async function listCourses(env: Env) {
  const client = await getClient(env)
  const { data, error } = await client
    .from('courses')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .order('title', { ascending: true })

  if (error) throw error
  return sortCoursesByRecency((data ?? []).map(mapCourseSummary))
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
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .order('title', { ascending: true })
    .order('sort_order', { ascending: true, foreignTable: 'lessons' })

  if (error) throw error

  return sortCoursesByRecency(
    (data ?? []).map((row) => {
      const lessonRows = (row.lessons ?? []) as DbLesson[]
      const lessons = sortLessons(lessonRows.map(mapLessonRow))
      return mapCourseRow(row as DbCourse, lessons)
    }),
  )
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
    instructor: input.instructor?.trim() || null,
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
  if (input.instructor !== undefined) patch.instructor = input.instructor?.trim() || null
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

  // TODO: Later: delete associated Cloudflare Stream videos before deleting lessons.

  const { error: lessonsError } = await client.from('lessons').delete().eq('course_id', existing.id)
  if (lessonsError) throw lessonsError

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

export async function adminFindLessonById(env: Env, lessonId: string): Promise<Lesson | undefined> {
  const client = await getClient(env)

  const { data, error } = await client
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle()

  if (error) throw error
  if (!data) return undefined

  return mapLessonRow(data)
}

export async function adminUpdateLessonVideo(
  env: Env,
  lessonId: string,
  input: LessonVideoInput,
): Promise<Lesson | undefined> {
  const client = await getClient(env)

  const { data: existing, error: fetchError } = await client
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) return undefined

  const { data, error } = await client
    .from('lessons')
    .update({
      video_provider: input.videoProvider,
      video_uid: input.videoUid,
      video_status: input.videoStatus,
    })
    .eq('id', lessonId)
    .select('*')
    .single()

  if (error) throw error

  await client.from('courses').update({ updated_at: new Date().toISOString() }).eq('id', existing.course_id)

  return mapLessonRow(data)
}

export async function adminClearLessonVideo(env: Env, lessonId: string): Promise<Lesson | undefined> {
  const client = await getClient(env)

  const { data: existing, error: fetchError } = await client
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!existing) return undefined

  const { data, error } = await client
    .from('lessons')
    .update({
      video_provider: null,
      video_uid: null,
      video_status: null,
    })
    .eq('id', lessonId)
    .select('*')
    .single()

  if (error) throw error

  await client.from('courses').update({ updated_at: new Date().toISOString() }).eq('id', existing.course_id)

  return mapLessonRow(data)
}

export async function adminReorderLessons(
  env: Env,
  courseRef: string,
  lessonIds: string[],
): Promise<Lesson[] | undefined> {
  const client = await getClient(env)
  const course = await findCourseRow(env, courseRef)
  if (!course) return undefined

  const existingLessons = await fetchLessonsForCourse(env, course.id)
  const existingIds = new Set(existingLessons.map((lesson) => lesson.id))

  if (lessonIds.length !== existingLessons.length) {
    throw new Error('lessonIds must include every lesson for this course')
  }

  for (const lessonId of lessonIds) {
    if (!existingIds.has(lessonId)) {
      throw new Error('One or more lessons do not belong to this course')
    }
  }

  for (let index = 0; index < lessonIds.length; index++) {
    const { error } = await client
      .from('lessons')
      .update({ sort_order: -(index + 1) })
      .eq('id', lessonIds[index])
      .eq('course_id', course.id)

    if (error) throw error
  }

  for (let index = 0; index < lessonIds.length; index++) {
    const { error } = await client
      .from('lessons')
      .update({ sort_order: index + 1 })
      .eq('id', lessonIds[index])
      .eq('course_id', course.id)

    if (error) throw error
  }

  await client.from('courses').update({ updated_at: new Date().toISOString() }).eq('id', course.id)

  return fetchLessonsForCourse(env, course.id)
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

async function ensureCourseCoverBucket(env: Env) {
  const client = await getClient(env)
  const { data: buckets, error: listError } = await client.storage.listBuckets()
  if (listError) throw listError

  if (buckets?.some((bucket) => bucket.name === COURSE_COVER_BUCKET)) {
    return
  }

  const { error: createError } = await client.storage.createBucket(COURSE_COVER_BUCKET, {
    public: true,
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw createError
  }
}

export async function adminUploadCourseCover(
  env: Env,
  courseRef: string,
  file: { bytes: ArrayBuffer; contentType: string; fileName: string; size: number },
): Promise<Course | undefined> {
  if (!file.contentType.startsWith('image/')) {
    throw new CoverUploadError('COVER_FILE_TYPE_INVALID', 'Cover file must be an image.')
  }

  if (file.size > MAX_COVER_FILE_SIZE) {
    throw new CoverUploadError('COVER_FILE_TOO_LARGE', 'Cover file must be 5MB or smaller.')
  }

  const existing = await findCourseRow(env, courseRef)
  if (!existing) return undefined

  const client = await getClient(env)
  await ensureCourseCoverBucket(env)

  const storagePath = `courses/${existing.id}/${Date.now()}-${safeCoverFileName(file.fileName)}`
  const { error: uploadError } = await client.storage
    .from(COURSE_COVER_BUCKET)
    .upload(storagePath, file.bytes, {
      contentType: file.contentType,
      upsert: false,
    })

  if (uploadError) {
    throw new CoverUploadError('COVER_UPLOAD_FAILED', uploadError.message)
  }

  const { data: publicUrlData } = client.storage.from(COURSE_COVER_BUCKET).getPublicUrl(storagePath)
  const publicUrl = publicUrlData.publicUrl

  const { data, error } = await client
    .from('courses')
    .update({ cover_image_url: publicUrl })
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) {
    throw new CoverUploadError('COVER_UPLOAD_FAILED', error.message)
  }

  const lessons = await fetchLessonsForCourse(env, data.id)
  return mapCourseRow(data, lessons)
}

export async function adminDeleteCourseCover(
  env: Env,
  courseRef: string,
): Promise<Course | undefined> {
  const existing = await findCourseRow(env, courseRef)
  if (!existing) return undefined

  const client = await getClient(env)

  // TODO: delete the previous storage object when cover_image_url is cleared.
  const { data, error } = await client
    .from('courses')
    .update({ cover_image_url: null })
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) throw error

  const lessons = await fetchLessonsForCourse(env, data.id)
  return mapCourseRow(data, lessons)
}
