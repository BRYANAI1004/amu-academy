import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import PortalHeader from '../components/PortalHeader'
import { formatCoursePrice } from '../data/courses'
import { enrollCourse, isEnrolled } from '../lib/enrollment'
import { getCourse, getCourseFallback, type ApiCourse } from '../lib/api'

export default function CourseDetailPage() {
  const { courseId = '' } = useParams()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const enrolled = course ? isEnrolled(course.id) : false

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
      <div className="portal-page">
        <PortalHeader />
        <main className="portal-main portal-main--narrow">
          <div className="portal-empty">
            <p>Loading course…</p>
          </div>
        </main>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="portal-page">
        <PortalHeader />
        <main className="portal-main portal-main--narrow">
          <div className="portal-empty">
            <h1>Course not found</h1>
            <p>The course you are looking for is not available.</p>
            <Link to="/courses" className="btn btn-primary">
              Back to courses
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <CourseDetailContent course={course} enrolled={enrolled} error={error} />
  )
}

function CourseDetailContent({
  course,
  enrolled,
  error,
}: {
  course: ApiCourse
  enrolled: boolean
  error: string | null
}) {
  const navigate = useNavigate()
  const isAvailable = course.status === 'available'
  const sortedLessons = [...course.lessons].sort((a, b) => a.sortOrder - b.sortOrder)

  function handleEnroll() {
    if (course.status !== 'available') return
    enrollCourse(course.id)
    navigate(`/learn/${course.id}`)
  }

  return (
    <div className="portal-page">
      <PortalHeader subtitle={course.title} />

      {error && (
        <p className="portal-api-notice" role="status">
          {error}
        </p>
      )}

      <main className="portal-main portal-main--detail">
        <div className="course-detail">
          <div className="course-detail__main">
            <div className="course-detail__badges">
              <span className="course-card__category">{course.category}</span>
              <span
                className={`course-card__status ${isAvailable ? 'course-card__status--available' : 'course-card__status--soon'}`}
              >
                {isAvailable ? 'Available' : 'Coming soon'}
              </span>
            </div>

            <h1 className="course-detail__title">{course.title}</h1>
            <p className="course-detail__description">{course.description}</p>

            <div className="course-detail__stats">
              <span>
                <BookOpen size={16} aria-hidden="true" />
                {sortedLessons.length} lessons
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
            <div className="course-detail__panel">
              <p className="course-detail__panel-price">{formatCoursePrice(course.price)}</p>
              <p className="course-detail__panel-meta">{sortedLessons.length} lessons included</p>

              {isAvailable ? (
                <>
                  <button type="button" className="btn btn-primary btn-full" onClick={handleEnroll}>
                    {enrolled ? 'Continue learning' : 'Enroll & Watch'}
                  </button>
                  <p className="course-detail__payment-note">
                    Stripe payment will be connected in the next phase.
                  </p>
                </>
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
  )
}
