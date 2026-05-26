import {
  courses as seedCourses,
  type Course,
  type CourseCategory,
  type CourseLesson,
  type CourseStatus,
  type LessonContent,
} from '../data/courses'

const ADMIN_STORE_KEY = 'amu-academy-admin-courses'

function cloneCourses(data: Course[]): Course[] {
  return JSON.parse(JSON.stringify(data)) as Course[]
}

function loadStore(): Course[] {
  try {
    const raw = localStorage.getItem(ADMIN_STORE_KEY)
    if (!raw) {
      const seeded = cloneCourses(seedCourses)
      localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(seeded))
      return seeded
    }
    return JSON.parse(raw) as Course[]
  } catch {
    return cloneCourses(seedCourses)
  }
}

function saveStore(courses: Course[]): void {
  localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(courses))
}

export function getAdminCourses(): Course[] {
  return loadStore()
}

export function getAdminCourse(courseId: string): Course | undefined {
  return loadStore().find((course) => course.id === courseId)
}

export function getAdminLesson(lessonId: string): { course: Course; lesson: CourseLesson } | undefined {
  for (const course of loadStore()) {
    const lesson = course.lessons.find((item) => item.id === lessonId)
    if (lesson) return { course, lesson }
  }
  return undefined
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
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
  number: number
  description: string
  objectives: string[]
  notes: string
}

export function createAdminCourse(data: CourseFormData): Course {
  const courses = loadStore()
  const baseId = slugify(data.title) || 'new-course'
  let id = baseId
  let suffix = 1
  while (courses.some((course) => course.id === id)) {
    id = `${baseId}-${suffix}`
    suffix += 1
  }

  const course: Course = {
    id,
    ...data,
    lessons: [],
    lessonContent: {},
  }

  saveStore([...courses, course])
  return course
}

export function updateAdminCourse(courseId: string, data: CourseFormData): Course | undefined {
  const courses = loadStore()
  const index = courses.findIndex((course) => course.id === courseId)
  if (index === -1) return undefined

  const updated: Course = {
    ...courses[index]!,
    ...data,
  }
  courses[index] = updated
  saveStore(courses)
  return updated
}

export function createAdminLesson(courseId: string, data: LessonFormData): CourseLesson | undefined {
  const courses = loadStore()
  const courseIndex = courses.findIndex((course) => course.id === courseId)
  if (courseIndex === -1) return undefined

  const course = courses[courseIndex]!
  const lessonId = `${courseId}-l${Date.now()}`
  const lesson: CourseLesson = {
    id: lessonId,
    number: data.number,
    title: data.title,
    duration: data.duration,
  }

  const lessonContent: LessonContent = {
    description: data.description,
    objectives: data.objectives,
    notes: data.notes,
  }

  course.lessons = [...course.lessons, lesson].sort((a, b) => a.number - b.number)
  course.lessonContent = { ...course.lessonContent, [lessonId]: lessonContent }
  courses[courseIndex] = course
  saveStore(courses)
  return lesson
}

export function updateAdminLesson(lessonId: string, data: LessonFormData): CourseLesson | undefined {
  const courses = loadStore()

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i]!
    const lessonIndex = course.lessons.findIndex((lesson) => lesson.id === lessonId)
    if (lessonIndex === -1) continue

    const updatedLesson: CourseLesson = {
      ...course.lessons[lessonIndex]!,
      number: data.number,
      title: data.title,
      duration: data.duration,
    }

    course.lessons[lessonIndex] = updatedLesson
    course.lessons.sort((a, b) => a.number - b.number)
    course.lessonContent[lessonId] = {
      description: data.description,
      objectives: data.objectives,
      notes: data.notes,
    }
    courses[i] = course
    saveStore(courses)
    return updatedLesson
  }

  return undefined
}

export function getAdminStats() {
  const courses = loadStore()
  const lessonCount = courses.reduce((sum, course) => sum + course.lessons.length, 0)
  const availableCount = courses.filter((course) => course.status === 'available').length

  return {
    courseCount: courses.length,
    lessonCount,
    availableCount,
  }
}

export function resetAdminStore(): void {
  localStorage.removeItem(ADMIN_STORE_KEY)
}
