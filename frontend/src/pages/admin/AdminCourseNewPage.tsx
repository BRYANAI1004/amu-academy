import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminCourseForm, { emptyCourseForm } from '../../components/AdminCourseForm'
import { adminCreateCourse, courseFormToInput } from '../../lib/api'

export default function AdminCourseNewPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(data: typeof emptyCourseForm) {
    setSaving(true)
    setError(null)
    try {
      const course = await adminCreateCourse(courseFormToInput(data))
      navigate(`/admin/courses/${course.id}/edit`)
    } catch {
      setError('Could not create course. Is the backend running?')
      setSaving(false)
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">Create course</h1>
          <p className="admin-page-head__subtitle">Add a new course to the academy catalog.</p>
        </div>
        <Link to="/admin/courses" className="admin-link-back">
          ← Back to courses
        </Link>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-panel">
        <AdminCourseForm
          initial={emptyCourseForm}
          submitLabel={saving ? 'Creating…' : 'Create course'}
          onSubmit={(data) => {
            void handleSubmit(data)
          }}
        />
      </div>
    </div>
  )
}
