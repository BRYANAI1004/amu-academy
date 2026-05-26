import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminCourseForm from '../../components/AdminCourseForm'
import {
  adminGetCourse,
  adminUpdateCourse,
  courseFormToInput,
  courseToFormData,
  type ApiCourse,
} from '../../lib/api'

export default function AdminCourseEditPage() {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminGetCourse(courseId)
      .then((data) => setCourse(data))
      .catch(() => setError('Could not load course from the API.'))
      .finally(() => setLoading(false))
  }, [courseId])

  async function handleSubmit(data: ReturnType<typeof courseToFormData>) {
    if (!course) return
    setSaving(true)
    setError(null)
    try {
      await adminUpdateCourse(course.id, courseFormToInput(data))
      navigate('/admin/courses')
    } catch {
      setError('Could not save course changes.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-panel admin-empty">
          <p>Loading course…</p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="admin-content">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">Edit course</h1>
          <p className="admin-page-head__subtitle">{course.title}</p>
        </div>
        <div className="admin-page-head__links">
          <Link to={`/admin/courses/${course.id}/lessons`} className="admin-link-action">
            Manage lessons
          </Link>
          <Link to="/admin/courses" className="admin-link-back">
            ← Back to courses
          </Link>
        </div>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-panel">
        <AdminCourseForm
          initial={courseToFormData(course)}
          submitLabel={saving ? 'Saving…' : 'Save changes'}
          onSubmit={(data) => {
            void handleSubmit(data)
          }}
        />
      </div>
    </div>
  )
}
