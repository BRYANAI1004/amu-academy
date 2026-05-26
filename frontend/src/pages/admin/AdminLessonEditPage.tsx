import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import AdminLessonForm, { emptyLessonForm } from '../../components/AdminLessonForm'
import {
  adminCreateLesson,
  adminFindLesson,
  adminGetCourse,
  adminUpdateLesson,
  lessonFormToInput,
  lessonToFormData,
  type ApiCourse,
  type ApiLesson,
} from '../../lib/api'

export default function AdminLessonEditPage() {
  const { lessonId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = lessonId === 'new'
  const courseIdFromQuery = searchParams.get('courseId') ?? ''

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [lesson, setLesson] = useState<ApiLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (isNew) {
          const data = await adminGetCourse(courseIdFromQuery)
          setCourse(data)
        } else {
          const result = await adminFindLesson(lessonId)
          if (result) {
            setCourse(result.course)
            setLesson(result.lesson)
          }
        }
      } catch {
        setError('Could not load lesson data from the API.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [isNew, courseIdFromQuery, lessonId])

  async function handleCreate(data: typeof emptyLessonForm) {
    if (!course) return
    setSaving(true)
    setError(null)
    try {
      await adminCreateLesson(course.id, lessonFormToInput(data))
      navigate(`/admin/courses/${course.id}/lessons`)
    } catch {
      setError('Could not create lesson.')
      setSaving(false)
    }
  }

  async function handleUpdate(data: typeof emptyLessonForm) {
    if (!course || !lesson) return
    setSaving(true)
    setError(null)
    try {
      await adminUpdateLesson(lesson.id, lessonFormToInput(data))
      navigate(`/admin/courses/${course.id}/lessons`)
    } catch {
      setError('Could not save lesson changes.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-panel admin-empty">
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  if (isNew) {
    if (!course) {
      return (
        <div className="admin-content">
          <div className="admin-panel admin-empty">
            <h1>Course not found</h1>
            <Link to="/admin/courses" className="btn btn-primary">
              Back to courses
            </Link>
          </div>
        </div>
      )
    }

    const nextSortOrder = course.lessons.length + 1

    return (
      <div className="admin-content">
        <div className="admin-page-head">
          <div>
            <h1 className="admin-page-head__title">Create lesson</h1>
            <p className="admin-page-head__subtitle">{course.title}</p>
          </div>
          <Link to={`/admin/courses/${course.id}/lessons`} className="admin-link-back">
            ← Back to lessons
          </Link>
        </div>

        {error && (
          <p className="admin-note admin-note--error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-panel">
          <AdminLessonForm
            initial={{ ...emptyLessonForm, sortOrder: nextSortOrder }}
            submitLabel={saving ? 'Creating…' : 'Create lesson'}
            onSubmit={(data) => {
              void handleCreate(data)
            }}
          />
        </div>
      </div>
    )
  }

  if (!course || !lesson) {
    return (
      <div className="admin-content">
        <div className="admin-panel admin-empty">
          <h1>Lesson not found</h1>
          <Link to="/admin/courses" className="btn btn-primary">
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-content">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">Edit lesson</h1>
          <p className="admin-page-head__subtitle">
            {course.title} · Lesson {lesson.sortOrder}
          </p>
        </div>
        <Link to={`/admin/courses/${course.id}/lessons`} className="admin-link-back">
          ← Back to lessons
        </Link>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-panel">
        <AdminLessonForm
          initial={lessonToFormData(lesson)}
          submitLabel={saving ? 'Saving…' : 'Save lesson'}
          onSubmit={(data) => {
            void handleUpdate(data)
          }}
        />
      </div>
    </div>
  )
}
