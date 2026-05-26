import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { adminGetCourse, type ApiCourse, type ApiLesson } from '../../lib/api'

export default function AdminCourseLessonsPage() {
  const { courseId = '' } = useParams()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [lessons, setLessons] = useState<ApiLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminGetCourse(courseId)
      .then((data) => {
        setCourse(data)
        if (data) {
          setLessons([...data.lessons].sort((a, b) => a.sortOrder - b.sortOrder))
        }
      })
      .catch(() => setError('Could not load lessons from the API.'))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-panel admin-empty">
          <p>Loading lessons…</p>
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
          <h1 className="admin-page-head__title">Lessons</h1>
          <p className="admin-page-head__subtitle">{course.title}</p>
        </div>
        <div className="admin-page-head__links">
          <Link
            to={`/admin/lessons/new/edit?courseId=${course.id}`}
            className="btn btn-primary"
          >
            <Plus size={18} aria-hidden="true" />
            Add lesson
          </Link>
          <Link to={`/admin/courses/${course.id}/edit`} className="admin-link-back">
            ← Edit course
          </Link>
        </div>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      <div className="admin-panel admin-table-wrap">
        {lessons.length === 0 ? (
          <p className="admin-empty-text">No lessons yet. Add the first lesson for this course.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Duration</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td>{lesson.sortOrder}</td>
                  <td>{lesson.title}</td>
                  <td>{lesson.duration}</td>
                  <td>
                    <Link to={`/admin/lessons/${lesson.id}/edit`} className="admin-table__action">
                      <Pencil size={15} aria-hidden="true" />
                      Edit
                    </Link>
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
