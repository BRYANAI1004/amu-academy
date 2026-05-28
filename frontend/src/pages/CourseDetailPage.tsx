import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, CheckCircle2, UserRound } from 'lucide-react'
import AmuGradientArt from '../components/AmuGradientArt'
import PortalHeader from '../components/PortalHeader'
import { formatCoursePrice } from '../data/courses'
import { getCourse, getCourseFallback, type ApiCourse } from '../lib/api'
import { useMobilePortalScrollLock } from '../lib/useMobilePortalScrollLock'

export default function CourseDetailPage() {
  const { courseId = '' } = useParams()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useMobilePortalScrollLock()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getCourse(courseId)
        if (!cancelled) setCourse(data)
      } catch {
        if (cancelled) return
        const fallback = getCourseFallback(courseId)
        if (fallback) {
          setCourse(fallback)
          setError('Could not reach the academy API. Showing cached course data.')
        } else {
          setCourse(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="portal-page amu-gradient-page student-portal-page student-course-detail-page">
        <AmuGradientArt />
        <PortalHeader className="student-header" />
        <div className="student-portal-shell course-detail-shell">
          <div className="student-portal-scroll-area course-detail-scroll-area">
            <main className="course-detail-main">
              <div className="portal-empty">
                <p>Loading course…</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="portal-page amu-gradient-page student-portal-page student-course-detail-page">
        <AmuGradientArt />
        <PortalHeader className="student-header" />
        <div className="student-portal-shell course-detail-shell">
          <div className="student-portal-scroll-area course-detail-scroll-area">
            <main className="course-detail-main">
              <div className="portal-empty">
                <h1>Course not found</h1>
                <p>The course you are looking for is not available.</p>
                <Link to="/courses" className="btn btn-primary">
                  Back to courses
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CourseDetailContent course={course} error={error} />
  )
}

function CourseDetailContent({
  course,
  error,
}: {
  course: ApiCourse
  error: string | null
}) {
  const navigate = useNavigate()
  const isAvailable = course.status === 'available'
  const sortedLessons = [...course.lessons].sort((a, b) => a.sortOrder - b.sortOrder)

  function handleStartLearning() {
    if (course.status !== 'available') return
    navigate(`/learn/${course.id}`)
  }

  return (
    <div className="portal-page amu-gradient-page student-portal-page student-course-detail-page">
      <AmuGradientArt />
      <PortalHeader className="student-header" subtitle={course.title} />

      <div className="student-portal-shell course-detail-shell">
        {error && (
          <p className="portal-api-notice" role="status">
            {error}
          </p>
        )}

        <div className="student-portal-scroll-area course-detail-scroll-area">
          <main className="course-detail-main">
            <div className="course-detail">
              <div className="course-detail__main">
                {course.coverImageUrl && (
                  <img
                    src={course.coverImageUrl}
                    alt=""
                    className="course-detail__cover"
                  />
                )}

                <h1 className="course-detail__title">{course.title}</h1>
                {course.shortDescription && (
                  <p className="course-detail__description">{course.shortDescription}</p>
                )}

                <div className="course-detail__stats">
                  <span className="course-detail__stats-item">
                    <BookOpen size={16} className="course-detail__stats-icon" aria-hidden="true" />
                    {sortedLessons.length} {sortedLessons.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                  {course.instructor && (
                    <>
                      <span className="course-detail__stats-separator" aria-hidden="true">
                        ·
                      </span>
                      <span className="course-detail__stats-item course-detail__instructor">
                        <UserRound size={16} className="course-detail__stats-icon" aria-hidden="true" />
                        {course.instructor}
                      </span>
                    </>
                  )}
                  <span className="course-detail__stats-separator" aria-hidden="true">
                    ·
                  </span>
                  <span className="course-detail__price">{formatCoursePrice(course.price)}</span>
                </div>

                <section className="course-detail__section">
                  <h2>Course overview</h2>
                  <p>{course.overview}</p>
                </section>

                <section className="course-detail__section">
                  <h2>What you&apos;ll learn</h2>
                  <ul className="course-detail__learn-list">
                    {course.whatYouLearn.map((item) => (
                      <li key={item}>
                        <CheckCircle2 size={16} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <aside className="course-detail__aside">
                <div className="course-detail__panel course-detail__panel--inline">
                  <p className="course-detail__panel-price">{formatCoursePrice(course.price)}</p>
                  <p className="course-detail__panel-meta">
                    {sortedLessons.length} {sortedLessons.length === 1 ? 'lesson' : 'lessons'} included
                  </p>

                  {isAvailable ? (
                    <button type="button" className="btn btn-primary btn-full" onClick={handleStartLearning}>
                      Start learning
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-full" disabled>
                      Coming soon
                    </button>
                  )}

                  <Link to="/courses" className="course-detail__back">
                    ← Back to catalog
                  </Link>
                </div>

                <section className="course-detail__section course-detail__curriculum">
                  <h2>Curriculum</h2>
                  <ol className="course-detail__curriculum-list">
                    {sortedLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <span className="course-detail__lesson-num">{lesson.sortOrder}</span>
                        <span className="course-detail__lesson-info">
                          <span className="course-detail__lesson-title">{lesson.title}</span>
                          <span className="course-detail__lesson-duration">{lesson.duration}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              </aside>
            </div>
          </main>
        </div>

        <footer className="student-portal-footer course-detail-mobile-footer">
          <p className="course-detail__panel-price">{formatCoursePrice(course.price)}</p>
          <p className="course-detail__panel-meta">
            {sortedLessons.length} {sortedLessons.length === 1 ? 'lesson' : 'lessons'} included
          </p>

          {isAvailable ? (
            <button type="button" className="btn btn-primary btn-full" onClick={handleStartLearning}>
              Start learning
            </button>
          ) : (
            <button type="button" className="btn btn-secondary btn-full" disabled>
              Coming soon
            </button>
          )}

          <Link to="/courses" className="course-detail__back">
            ← Back to catalog
          </Link>
        </footer>
      </div>
    </div>
  )
}
