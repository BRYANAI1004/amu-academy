import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, UserRound } from 'lucide-react'
import PortalHeader from '../components/PortalHeader'
import { formatCoursePrice } from '../data/courses'
import { getCategories, getCategoriesFallback, getCourses, getCoursesFallback, type ApiCategory, type ApiCourseSummary } from '../lib/api'

type FilterCategory = string | 'All'

const MOBILE_CATALOG_QUERY = '(max-width: 640px)'

function useMobileCatalogScrollLock() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_CATALOG_QUERY)

    function syncScrollLock() {
      document.documentElement.classList.toggle('student-catalog-mobile', mediaQuery.matches)
    }

    syncScrollLock()
    mediaQuery.addEventListener('change', syncScrollLock)

    return () => {
      mediaQuery.removeEventListener('change', syncScrollLock)
      document.documentElement.classList.remove('student-catalog-mobile')
    }
  }, [])
}

export default function CourseCatalogPage() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All')
  const [courses, setCourses] = useState<ApiCourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const [categories, setCategories] = useState<ApiCategory[]>([])

  useMobileCatalogScrollLock()

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [courseData, categoryData] = await Promise.all([getCourses(), getCategories()])
        if (cancelled) return
        setCourses(courseData)
        setCategories(categoryData)
        setUsedFallback(false)
      } catch {
        if (cancelled) return
        setCourses(getCoursesFallback())
        setCategories(getCategoriesFallback())
        setUsedFallback(true)
        setError('Could not reach the academy API. Showing cached catalog data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredCourses = useMemo(() => {
    if (activeCategory === 'All') return courses
    return courses.filter((course) => course.category === activeCategory)
  }, [courses, activeCategory])

  return (
    <div className="portal-page amu-gradient-page student-catalog-page">
      <div className="login-gradient-art" aria-hidden="true">
        <span className="login-blob login-blob--yellow" />
        <span className="login-blob login-blob--orange" />
        <span className="login-blob login-blob--peach" />
        <span className="login-blob login-blob--pink" />
        <span className="login-blob login-blob--lavender" />
        <span className="login-blob login-blob--red" />
      </div>

      <PortalHeader className="student-header" />

      <main className="portal-main course-catalog-content student-catalog-main">
        <div className="catalog-mobile-shell">
          <section className="catalog-hero">
            <h1 className="catalog-hero__title">Online Academy</h1>
          </section>

          {error && (
            <p className="portal-api-notice" role="status">
              {error}
            </p>
          )}

          {usedFallback && !error && (
            <p className="portal-api-notice" role="status">
              Showing offline catalog data.
            </p>
          )}

          <div className="catalog-filters category-pills" role="tablist" aria-label="Course categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'All'}
              className={`catalog-filter ${activeCategory === 'All' ? 'catalog-filter--active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.name}
                className={`catalog-filter ${activeCategory === category.name ? 'catalog-filter--active' : ''}`}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="catalog-scroll-area">
            {loading ? (
              <div className="portal-empty">
                <p>Loading courses…</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="portal-empty">
                <p>No courses in this category yet.</p>
              </div>
            ) : (
              <div className="course-grid student-course-grid">
                {filteredCourses.map((course) => {
                  const isAvailable = course.status === 'available'
                  const cardClassName = [
                    'course-card',
                    'student-course-card',
                    !isAvailable ? 'course-card--coming-soon' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <article key={course.id} className={cardClassName}>
                      <div className="course-card__cover-wrap">
                        {course.coverImageUrl ? (
                          <img
                            src={course.coverImageUrl}
                            alt=""
                            className="course-card__cover"
                          />
                        ) : (
                          <div className="course-card__cover-placeholder" aria-hidden="true" />
                        )}
                      </div>

                      <div className="course-card__body">
                        <h2 className="course-card__title">{course.title}</h2>

                        {course.shortDescription && (
                          <p className="course-card__description">{course.shortDescription}</p>
                        )}

                        <p className="course-card__meta">
                          <span className="course-card__meta-item">
                            <BookOpen size={14} className="course-card__meta-icon" aria-hidden="true" />
                            {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
                          </span>
                          {course.instructor && (
                            <>
                              <span className="course-card__meta-separator" aria-hidden="true">
                                ·
                              </span>
                              <span className="course-card__meta-item course-card__meta-instructor">
                                <UserRound size={14} className="course-card__meta-icon" aria-hidden="true" />
                                {course.instructor}
                              </span>
                            </>
                          )}
                          <span className="course-card__meta-separator" aria-hidden="true">
                            ·
                          </span>
                          <span className="course-card__meta-price">{formatCoursePrice(course.price)}</span>
                        </p>

                        {isAvailable ? (
                          <Link to={`/courses/${course.id}`} className="btn btn-primary course-card__btn">
                            View course
                          </Link>
                        ) : (
                          <button type="button" className="btn btn-primary course-card__btn" disabled>
                            Coming soon
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
