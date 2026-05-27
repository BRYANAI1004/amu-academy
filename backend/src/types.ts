export type CourseStatus = 'available' | 'coming_soon'

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
  instructor: string | null
  description: string
  overview: string
  whatYouLearn: string[]
  price: number
  priceCents: number
  status: CourseStatus
  coverImageUrl?: string | null
  lessons: Lesson[]
  createdAt: string
  updatedAt: string
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

export interface LessonVideoInput {
  videoProvider: string
  videoUid: string
  videoStatus: VideoStatus
}

export interface DirectVideoUploadInput {
  lessonId: string
  fileName: string
  maxDurationSeconds?: number
}

export interface LessonReorderInput {
  lessonIds: string[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryInput {
  name: string
  slug?: string
  description?: string | null
  sortOrder?: number
  isActive?: boolean
}

export interface CategoryWithCourseCount extends Category {
  courseCount: number
}
