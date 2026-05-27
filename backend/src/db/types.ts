export interface DbCourse {
  id: string
  slug: string
  title: string
  category: string
  description: string | null
  short_description: string | null
  instructor: string | null
  overview: string | null
  what_you_learn: string[] | null
  price_cents: number
  currency: string
  status: string
  lesson_count: number
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface DbLesson {
  id: string
  course_id: string
  title: string
  description: string | null
  duration_seconds: number | null
  sort_order: number
  is_preview: boolean
  objectives: string[] | null
  notes: string | null
  video_provider: string | null
  video_uid: string | null
  video_status: string | null
  created_at: string
  updated_at: string
}

export interface DbCourseInsert {
  slug: string
  title: string
  category: string
  description?: string | null
  short_description?: string | null
  instructor?: string | null
  overview?: string | null
  what_you_learn?: string[]
  price_cents: number
  currency?: string
  status: string
}

export interface DbCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbCategoryInsert {
  name: string
  slug: string
  description?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface DbLessonInsert {
  course_id: string
  title: string
  description?: string | null
  duration_seconds?: number | null
  sort_order: number
  is_preview?: boolean
  objectives?: string[]
  notes?: string | null
  video_provider?: string | null
  video_uid?: string | null
  video_status?: string | null
}
