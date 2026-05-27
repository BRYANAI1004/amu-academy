import type { Category, Course, CourseStatus, Lesson, VideoStatus } from '../types'
import type { DbCategory, DbCourse, DbLesson } from './types'
import { formatDuration } from './utils'

function asCourseStatus(status: string): CourseStatus {
  if (status === 'available' || status === 'coming_soon') return status
  return 'coming_soon'
}

function asVideoStatus(status: string | null | undefined): VideoStatus {
  if (
    status === 'pending' ||
    status === 'processing' ||
    status === 'ready' ||
    status === 'uploaded' ||
    status === 'error'
  ) {
    return status
  }
  return 'none'
}

export function mapLessonRow(row: DbLesson): Lesson {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description ?? '',
    duration: formatDuration(row.duration_seconds),
    durationSeconds: row.duration_seconds ?? 0,
    sortOrder: row.sort_order,
    isPreview: row.is_preview,
    videoProvider: row.video_provider,
    videoUid: row.video_uid,
    videoStatus: asVideoStatus(row.video_status),
    objectives: row.objectives ?? [],
    notes: row.notes ?? '',
  }
}

export function mapCourseRow(row: DbCourse, lessons: Lesson[] = []): Course {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    shortDescription: row.short_description ?? '',
    instructor: row.instructor ?? null,
    description: row.description ?? '',
    overview: row.overview ?? row.description ?? '',
    whatYouLearn: row.what_you_learn ?? [],
    price: row.price_cents / 100,
    priceCents: row.price_cents,
    status: asCourseStatus(row.status),
    coverImageUrl: row.cover_image_url ?? null,
    lessons,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCourseSummary(row: DbCourse) {
  const { lessons: _lessons, ...course } = mapCourseRow(row)
  return {
    ...course,
    lessonCount: row.lesson_count,
  }
}

export function sortLessons(lessons: Lesson[]): Lesson[] {
  return [...lessons].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function mapCategoryRow(row: DbCategory): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
