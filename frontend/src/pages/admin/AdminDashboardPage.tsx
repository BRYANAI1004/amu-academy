import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Layers, Plus } from 'lucide-react'
import { adminGetStats } from '../../lib/api'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ courseCount: 0, lessonCount: 0, availableCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminGetStats()
      .then(setStats)
      .catch(() => setError('Could not load dashboard stats from the API.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="admin-content">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">Dashboard</h1>
          <p className="admin-page-head__subtitle">Manage courses, lessons, and academy content.</p>
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

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <BookOpen size={22} aria-hidden="true" />
          <p className="admin-stat-card__value">{loading ? '—' : stats.courseCount}</p>
          <p className="admin-stat-card__label">Courses</p>
        </article>
        <article className="admin-stat-card">
          <Layers size={22} aria-hidden="true" />
          <p className="admin-stat-card__value">{loading ? '—' : stats.lessonCount}</p>
          <p className="admin-stat-card__label">Lessons</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-card__value">{loading ? '—' : stats.availableCount}</p>
          <p className="admin-stat-card__label">Available courses</p>
        </article>
      </div>

      <section className="admin-panel">
        <h2>Quick actions</h2>
        <div className="admin-quick-actions">
          <Link to="/admin/courses" className="admin-quick-action">
            View all courses
          </Link>
          <Link to="/admin/courses/new" className="admin-quick-action">
            Create a course
          </Link>
        </div>
        <p className="admin-note">
          Course and lesson data is stored in the backend API. Supabase, Stripe, and video upload will
          be connected in later phases.
        </p>
      </section>
    </div>
  )
}
