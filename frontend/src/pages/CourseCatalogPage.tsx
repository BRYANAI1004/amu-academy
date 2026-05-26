import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock } from 'lucide-react'
import PortalHeader from '../components/PortalHeader'
import { CATEGORIES, formatCoursePrice, type CourseCategory } from '../data/courses'
import { getCourses, getCoursesFallback, type ApiCourseSummary } from '../lib/api'

type FilterCategory = CourseCategory | 'All'

export default function CourseCatalogPage() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All')
  const [courses, setCourses] = useState<ApiCourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getCourses()
        if (cancelled) return
        setCourses(data)
        setUsedFallback(false)
      } catch {
        if (cancelled) return
        setCourses(getCoursesFallback())
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
    <div className="portal-page">
      <PortalHeader />

      <main className="portal-main">
        <section className="catalog-hero">
          <h1 className="catalog-hero__title">Online Academy</h1>
          <p className="catalog-hero__subtitle">
            Professional online courses for healthcare learners and medical teams.
          </p>
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

        <div className="catalog-filters" role="tablist" aria-label="Course categories">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'All'}
            className={`catalog-filter ${activeCategory === 'All' ? 'catalog-filter--active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={`catalog-filter ${activeCategory === category ? 'catalog-filter--active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="portal-empty">
            <p>Loading courses…</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="portal-empty">
            <p>No courses in this category yet.</p>
          </div>
        ) : (
          <div className="course-grid">
            {filteredCourses.map((course) => {
              const isAvailable = course.status === 'available'

              return (
                <article key={course.id} className="course-card">
                  <div className="course-card__top">
                    <span className="course-card__category">{course.category}</span>
                    <span
                      className={`course-card__status ${isAvailable ? 'course-card__status--available' : 'course-card__status--soon'}`}
                    >
                      {isAvailable ? 'Available' : 'Coming soon'}
                    </span>
                  </div>

                  <h2 className="course-card__title">{course.title}</h2>
                  <p className="course-card__description">{course.shortDescription}</p>

                  <div className="course-card__meta">
                    <span className="course-card__meta-item">
                      <BookOpen size={15} aria-hidden="true" />
                      {course.lessonCount} lessons
                    </span>
                    <span className="course-card__meta-item">
                      <Clock size={15} aria-hidden="true" />
                      {formatCoursePrice(course.price)}
                    </span>
                  </div>

                  {isAvailable ? (
                    <Link to={`/courses/${course.id}`} className="btn btn-primary course-card__btn">
                      View course
                    </Link>
                  ) : (
                    <button type="button" className="btn btn-secondary course-card__btn" disabled>
                      Coming soon
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
