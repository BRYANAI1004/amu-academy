import {
  CATEGORIES as fallbackCategoryNames,
  courses as fallbackCourses,
  getCourseById as getFallbackCourseById,
  type CourseStatus,
} from '../data/courses'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export type { CourseStatus }

export interface ApiCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiCategoryWithCourseCount extends ApiCategory {
  courseCount: number
}

export interface CategoryInput {
  name: string
  slug?: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

export type VideoStatus = 'none' | 'pending' | 'processing' | 'uploaded' | 'ready' | 'error'

export type StreamStatusState =
  | 'pendingupload'
  | 'downloading'
  | 'queued'
  | 'inprogress'
  | 'ready'
  | 'error'

export interface StreamVideoStatus {
  uid: string
  readyToStream: boolean
  statusState: StreamStatusState
  requireSignedURLs: boolean
  duration: number | null
  thumbnail: string | null
  preview: string | null
  pctComplete: number | null
}

export interface ApiLesson {
  id: string
  courseId: string
  title: string
  description: string
  duration: string
  durationSeconds: number
  sortOrder: number
  isPreview: boolean
  videoProvider: string | null
  videoUid: string | null
  videoStatus: VideoStatus
  objectives?: string[]
  notes?: string
}

export interface ApiCourseSummary {
  id: string
  slug: string
  title: string
  category: string
  shortDescription: string
  instructor?: string | null
  description: string
  overview: string
  whatYouLearn: string[]
  price: number
  priceCents: number
  status: CourseStatus
  coverImageUrl?: string | null
  lessonCount: number
  createdAt: string
  updatedAt: string
}

export interface ApiCourse extends Omit<ApiCourseSummary, 'lessonCount'> {
  lessons: ApiLesson[]
}

export interface CourseFormData {
  title: string
  shortDescription: string
  instructor: string
  description: string
  overview: string
  category: string
  status: CourseStatus
  price: number
  whatYouLearn: string[]
}

export interface LessonFormData {
  title: string
  duration: string
  sortOrder: number
  description: string
  objectives: string[]
  notes: string
}

export interface CourseInput {
  title: string
  slug?: string
  category: string
  shortDescription?: string
  instructor?: string | null
  description: string
  overview?: string
  whatYouLearn?: string[]
  price: number
  status: CourseStatus
}

export interface LessonInput {
  title: string
  description?: string
  duration: string
  sortOrder: number
  isPreview?: boolean
  objectives?: string[]
  notes?: string
}

export interface DirectVideoUploadInput {
  lessonId: string
  fileName: string
  maxDurationSeconds?: number
}

export interface DirectVideoUploadResult {
  uploadURL: string
  uid: string
  uploadMethod?: 'direct' | 'tus'
}

export interface LessonVideoInput {
  videoProvider: string
  videoUid: string
  videoStatus: VideoStatus
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let message = body || `Request failed: ${res.status} ${path}`
    let code: string | undefined

    try {
      const parsed = JSON.parse(body) as { error?: string; code?: string }
      if (parsed.error) message = parsed.error
      code = parsed.code
    } catch {
      // body is not JSON
    }

    throw new ApiRequestError(message, res.status, code)
  }

  return res.json() as Promise<T>
}

async function apiFormFetch<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    body: formData,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `Request failed: ${res.status} ${path}`)
  }

  return res.json() as Promise<T>
}

function fallbackCourseToApi(course: (typeof fallbackCourses)[number]): ApiCourse {
  return {
    id: course.id,
    slug: course.id,
    title: course.title,
    category: course.category,
    shortDescription: course.shortDescription,
    instructor: null,
    description: course.description,
    overview: course.overview,
    whatYouLearn: course.whatYouLearn,
    price: course.price,
    priceCents: Math.round(course.price * 100),
    status: course.status,
    coverImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    lessons: course.lessons.map((lesson) => {
      const content = course.lessonContent[lesson.id]
      return {
        id: lesson.id,
        courseId: course.id,
        title: lesson.title,
        description: content?.description ?? '',
        duration: lesson.duration,
        durationSeconds: 0,
        sortOrder: lesson.number,
        isPreview: lesson.number === 1,
        videoProvider: null,
        videoUid: null,
        videoStatus: 'none' as const,
        objectives: content?.objectives ?? [],
        notes: content?.notes ?? '',
      }
    }),
  }
}

function fallbackCourseSummaries(): ApiCourseSummary[] {
  return fallbackCourses.map((course) => {
    const full = fallbackCourseToApi(course)
    const { lessons, ...rest } = full
    return { ...rest, lessonCount: lessons.length }
  })
}

function fallbackCourse(courseId: string): ApiCourse | undefined {
  const course = getFallbackCourseById(courseId)
  return course ? fallbackCourseToApi(course) : undefined
}

function fallbackCategories(): ApiCategory[] {
  return fallbackCategoryNames.map((name, index) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: null,
    sortOrder: index + 1,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }))
}

export async function getCategories(): Promise<ApiCategory[]> {
  const data = await apiFetch<{ categories: ApiCategory[] }>('/api/categories')
  return data.categories
}

export function getCategoriesFallback(): ApiCategory[] {
  return fallbackCategories()
}

export async function adminGetCategories(): Promise<ApiCategoryWithCourseCount[]> {
  const data = await apiFetch<{ categories: ApiCategoryWithCourseCount[] }>('/api/admin/categories')
  return data.categories
}

export async function adminCreateCategory(input: CategoryInput): Promise<ApiCategory> {
  const data = await apiFetch<{ category: ApiCategory }>('/api/admin/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.category
}

export async function adminUpdateCategory(
  categoryId: string,
  input: Partial<CategoryInput>,
): Promise<ApiCategory> {
  const data = await apiFetch<{ category: ApiCategory }>(`/api/admin/categories/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return data.category
}

export async function adminDeleteCategory(categoryId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/admin/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

function sortCoursesByRecency<T extends { updatedAt: string; createdAt: string; title: string }>(
  courses: T[],
): T[] {
  return [...courses].sort((a, b) => {
    const updatedDiff = Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
    if (updatedDiff !== 0) return updatedDiff

    const createdDiff = Date.parse(b.createdAt) - Date.parse(a.createdAt)
    if (createdDiff !== 0) return createdDiff

    return a.title.localeCompare(b.title)
  })
}

export async function getCourses(): Promise<ApiCourseSummary[]> {
  const data = await apiFetch<{ courses: ApiCourseSummary[] }>('/api/courses')
  return sortCoursesByRecency(data.courses)
}

export function getCoursesFallback(): ApiCourseSummary[] {
  return sortCoursesByRecency(fallbackCourseSummaries())
}

export async function getCourse(courseId: string): Promise<ApiCourse> {
  const data = await apiFetch<{ course: ApiCourse }>(`/api/courses/${courseId}`)
  return data.course
}

export function getCourseFallback(courseId: string): ApiCourse | undefined {
  return fallbackCourse(courseId)
}

export async function getCourseLessons(courseId: string): Promise<ApiLesson[]> {
  const data = await apiFetch<{ lessons: ApiLesson[] }>(`/api/courses/${courseId}/lessons`)
  return data.lessons
}

export async function adminGetCourses(): Promise<ApiCourse[]> {
  const data = await apiFetch<{ courses: ApiCourse[] }>('/api/admin/courses')
  return sortCoursesByRecency(data.courses)
}

export async function adminCreateCourse(input: CourseInput): Promise<ApiCourse> {
  const data = await apiFetch<{ course: ApiCourse }>('/api/admin/courses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.course
}

export async function adminUpdateCourse(
  courseId: string,
  input: Partial<CourseInput>,
): Promise<ApiCourse> {
  const data = await apiFetch<{ course: ApiCourse }>(`/api/admin/courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return data.course
}

export async function adminDeleteCourse(courseId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/admin/courses/${courseId}`, {
    method: 'DELETE',
  })
}

export async function uploadCourseCover(courseId: string, file: File): Promise<ApiCourse> {
  const formData = new FormData()
  formData.append('file', file)
  const data = await apiFormFetch<{ course: ApiCourse }>(
    `/api/admin/courses/${courseId}/cover`,
    formData,
  )
  return data.course
}

export async function deleteCourseCover(courseId: string): Promise<ApiCourse> {
  const res = await fetch(`${API_BASE_URL}/api/admin/courses/${courseId}/cover`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `Request failed: ${res.status} /api/admin/courses/${courseId}/cover`)
  }

  const data = (await res.json()) as { course: ApiCourse }
  return data.course
}

export async function adminGetLessons(courseId: string): Promise<ApiLesson[]> {
  const data = await apiFetch<{ lessons: ApiLesson[] }>(
    `/api/admin/courses/${courseId}/lessons`,
  )
  return data.lessons
}

export async function adminCreateLesson(
  courseId: string,
  input: LessonInput,
): Promise<ApiLesson> {
  const data = await apiFetch<{ lesson: ApiLesson }>(
    `/api/admin/courses/${courseId}/lessons`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return data.lesson
}

export async function adminUpdateLesson(
  lessonId: string,
  input: Partial<LessonInput>,
): Promise<ApiLesson> {
  const data = await apiFetch<{ lesson: ApiLesson }>(`/api/admin/lessons/${lessonId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  return data.lesson
}

export async function adminDeleteLesson(lessonId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/admin/lessons/${lessonId}`, {
    method: 'DELETE',
  })
}

export async function adminReorderLessons(
  courseId: string,
  lessonIds: string[],
): Promise<ApiLesson[]> {
  const data = await apiFetch<{ lessons: ApiLesson[] }>(
    `/api/admin/courses/${courseId}/lessons/reorder`,
    {
      method: 'PATCH',
      body: JSON.stringify({ lessonIds }),
    },
  )
  return data.lessons
}

export async function createDirectVideoUpload(
  input: DirectVideoUploadInput,
): Promise<DirectVideoUploadResult> {
  return apiFetch<DirectVideoUploadResult>('/api/admin/videos/direct-upload', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function createTusVideoUpload(
  input: DirectVideoUploadInput,
): Promise<DirectVideoUploadResult> {
  return apiFetch<DirectVideoUploadResult>('/api/admin/videos/tus-upload', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function saveLessonVideo(
  lessonId: string,
  input: LessonVideoInput,
): Promise<ApiLesson> {
  const data = await apiFetch<{ lesson: ApiLesson }>(
    `/api/admin/lessons/${lessonId}/video`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
  return data.lesson
}

export async function getStreamVideoStatus(uid: string): Promise<StreamVideoStatus> {
  return apiFetch<StreamVideoStatus>(`/api/admin/videos/${uid}/status`)
}

export async function deleteStreamVideo(uid: string): Promise<void> {
  await apiFetch<{ ok: boolean; uid: string }>(`/api/admin/videos/${uid}`, {
    method: 'DELETE',
  })
}

export async function deleteLessonVideo(lessonId: string): Promise<ApiLesson> {
  const data = await apiFetch<{ lesson: ApiLesson }>(`/api/admin/lessons/${lessonId}/video`, {
    method: 'DELETE',
  })
  return data.lesson
}

export async function adminGetCourse(courseId: string): Promise<ApiCourse | null> {
  const courses = await adminGetCourses()
  return courses.find((course) => course.id === courseId) ?? null
}

export async function adminFindLesson(
  lessonId: string,
): Promise<{ course: ApiCourse; lesson: ApiLesson } | null> {
  const courses = await adminGetCourses()
  for (const course of courses) {
    const lesson = course.lessons.find((item) => item.id === lessonId)
    if (lesson) return { course, lesson }
  }
  return null
}

export function courseFormToInput(data: CourseFormData): CourseInput {
  return {
    title: data.title,
    category: data.category,
    shortDescription: data.shortDescription,
    instructor: data.instructor.trim() || null,
    description: data.description,
    overview: data.overview,
    whatYouLearn: data.whatYouLearn,
    price: data.price,
    status: data.status,
  }
}

export function lessonFormToInput(data: LessonFormData): LessonInput {
  return {
    title: data.title,
    duration: data.duration,
    sortOrder: data.sortOrder,
    description: data.description,
    objectives: data.objectives,
    notes: data.notes,
  }
}

export function courseToFormData(course: {
  title: string
  shortDescription: string
  instructor?: string | null
  description: string
  overview: string
  category: string
  status: CourseStatus
  price: number
  whatYouLearn: string[]
}): CourseFormData {
  return {
    title: course.title,
    shortDescription: course.shortDescription,
    instructor: course.instructor ?? '',
    description: course.description,
    overview: course.overview,
    category: course.category,
    status: course.status,
    price: course.price,
    whatYouLearn: course.whatYouLearn,
  }
}

export function lessonToFormData(lesson: ApiLesson): LessonFormData {
  return {
    sortOrder: lesson.sortOrder,
    title: lesson.title,
    duration: lesson.duration,
    description: lesson.description,
    objectives: lesson.objectives ?? [],
    notes: lesson.notes ?? '',
  }
}

export async function adminGetStats() {
  const courses = await adminGetCourses()
  const lessonCount = courses.reduce((sum, course) => sum + course.lessons.length, 0)
  const availableCount = courses.filter((course) => course.status === 'available').length

  return {
    courseCount: courses.length,
    lessonCount,
    availableCount,
  }
}
