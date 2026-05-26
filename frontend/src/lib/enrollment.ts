const ENROLLED_KEY = 'amu-academy-enrolled-courseIds'

export function getEnrolledCourseIds(): string[] {
  try {
    const raw = localStorage.getItem(ENROLLED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function isEnrolled(courseId: string): boolean {
  return getEnrolledCourseIds().includes(courseId)
}

export function enrollCourse(courseId: string): void {
  const ids = getEnrolledCourseIds()
  if (!ids.includes(courseId)) {
    localStorage.setItem(ENROLLED_KEY, JSON.stringify([...ids, courseId]))
  }
}
