import {
  courses as fallbackCourses,
  getCourseById as getFallbackCourseById,
  type CourseCategory,
  type CourseStatus,
} from '../data/courses'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

export type { CourseCategory, CourseStatus }

export type VideoStatus = 'none' | 'pending' | 'ready'

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
  description: string
  overview: string
  whatYouLearn: string[]
  price: number
  priceCents: number
  status: CourseStatus
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
  description: string
  overview: string
  category: CourseCategory
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
    description: course.description,
    overview: course.overview,
    whatYouLearn: course.whatYouLearn,
    price: course.price,
    priceCents: Math.round(course.price * 100),
    status: course.status,
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

export async function getCourses(): Promise<ApiCourseSummary[]> {
  const data = await apiFetch<{ courses: ApiCourseSummary[] }>('/api/courses')
  return data.courses
}

export function getCoursesFallback(): ApiCourseSummary[] {
  return fallbackCourseSummaries()
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
  return data.courses
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
    description: course.description,
    overview: course.overview,
    category: course.category as CourseCategory,
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
