import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { formatCoursePrice } from '../../data/courses'
import { adminDeleteCourse, adminGetCourses, type ApiCourse } from '../../lib/api'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)

  const refetchCourses = useCallback(async () => {
    const data = await adminGetCourses()
    setCourses(data)
    return data
  }, [])

  useEffect(() => {
    refetchCourses()
      .catch(() => setError('Could not load courses from the API.'))
      .finally(() => setLoading(false))
  }, [refetchCourses])

  async function handleDeleteCourse(course: ApiCourse) {
    const confirmed = window.confirm(
      'Delete this course? This will remove the course and its lesson metadata. Cloudflare Stream videos may still remain in your Stream account.',
    )
    if (!confirmed) return

    setDeletingCourseId(course.id)
    setError(null)
    setSuccessMessage(null)

    try {
      await adminDeleteCourse(course.id)
      await refetchCourses()
      setSuccessMessage(`"${course.title}" was deleted.`)
    } catch {
      setError('Could not delete course.')
    } finally {
      setDeletingCourseId(null)
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">Courses</h1>
          <p className="admin-page-head__subtitle">Manage academy course catalog.</p>
        </div>
        <Link to="/admin/courses/new" className="btn btn-primary">
          <Plus size={18} aria-hidden="true" />
          New course
        </Link>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="admin-note admin-note--success" role="status">
          {successMessage}
        </p>
      )}

      <div className="admin-panel admin-table-wrap">
        {loading ? (
          <p className="admin-empty-text">Loading courses…</p>
        ) : courses.length === 0 ? (
          <p className="admin-empty-text">No courses yet. Create your first course.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Lessons</th>
                <th>Price</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <p className="admin-table__title">{course.title}</p>
                    <p className="admin-table__meta">{course.id}</p>
                  </td>
                  <td>{course.category}</td>
                  <td>
                    <span
                      className={`admin-badge ${course.status === 'available' ? 'admin-badge--success' : 'admin-badge--muted'}`}
                    >
                      {course.status === 'available' ? 'Available' : 'Coming soon'}
                    </span>
                  </td>
                  <td>{course.lessons.length}</td>
                  <td>{formatCoursePrice(course.price)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <Link to={`/admin/courses/${course.id}/edit`} className="admin-table__action">
                        <Pencil size={15} aria-hidden="true" />
                        Edit
                      </Link>
                      <Link to={`/admin/courses/${course.id}/edit?tab=lessons`} className="admin-table__action">
                        Lessons
                      </Link>
                      <button
                        type="button"
                        className="admin-table__action admin-table__action--button admin-table__action--danger"
                        disabled={deletingCourseId === course.id}
                        onClick={() => {
                          void handleDeleteCourse(course)
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {deletingCourseId === course.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
