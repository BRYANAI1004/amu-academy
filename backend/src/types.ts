export type CourseStatus = 'available' | 'coming_soon'

export type VideoStatus = 'none' | 'pending' | 'ready'

export interface Lesson {
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

export interface Course {
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
  lessons: Lesson[]
  createdAt: string
  updatedAt: string
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
