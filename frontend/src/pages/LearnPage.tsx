import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Lock,
  Play,
  Target,
} from 'lucide-react'
import PortalHeader from '../components/PortalHeader'
import { isEnrolled } from '../lib/enrollment'
import { getCourse, getCourseFallback, type ApiCourse, type ApiLesson } from '../lib/api'

export default function LearnPage() {
  const { courseId = '' } = useParams()
  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      <div className="learn-page">
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
      <div className="learn-page">
        <PortalHeader />
        <main className="portal-main portal-main--narrow">
          <div className="portal-empty">
            <h1>Course not found</h1>
            <p>This course is not available or the link may be incorrect.</p>
            <Link to="/courses" className="btn btn-primary">
              Back to courses
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <LearnPageContent course={course} error={error} />
  )
}

function LearnPageContent({ course, error }: { course: ApiCourse; error: string | null }) {
  const enrolled = isEnrolled(course.id)
  const lessons = useMemo(
    () => [...course.lessons].sort((a, b) => a.sortOrder - b.sortOrder),
    [course.lessons],
  )
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id ?? '')
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (lessons.length > 0 && !lessons.some((l) => l.id === activeLessonId)) {
      setActiveLessonId(lessons[0]!.id)
    }
  }, [lessons, activeLessonId])

  if (lessons.length === 0) {
    return (
      <div className="learn-page">
        <PortalHeader subtitle={course.title} />
        <main className="portal-main portal-main--narrow">
          <div className="portal-empty">
            <h1>No lessons yet</h1>
            <p>This course does not have any lessons yet.</p>
            <Link to={`/courses/${course.id}`} className="btn btn-primary">
              Back to course
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId)
  const activeLesson = lessons[activeIndex] ?? lessons[0]!
  const completedCount = completedLessons.size
  const progressPercent = Math.round((completedCount / lessons.length) * 100)
  const isActiveComplete = completedLessons.has(activeLesson.id)
  const nextLesson = lessons[activeIndex + 1]
  const showVideoPlaceholder = !activeLesson.videoUid

  function handleMarkComplete() {
    setCompletedLessons((prev) => new Set(prev).add(activeLesson.id))
  }

  function handleNextLesson() {
    if (nextLesson && isLessonUnlocked(nextLesson.id)) {
      setActiveLessonId(nextLesson.id)
    }
  }

  function isLessonUnlocked(lessonId: string) {
    const index = lessons.findIndex((l) => l.id === lessonId)
    if (index <= 0) return true
    if (completedLessons.has(lessonId)) return true
    const previousId = lessons[index - 1]!.id
    return completedLessons.has(previousId)
  }

  return (
    <div className="learn-page">
      <PortalHeader subtitle={course.title} />

      {error && (
        <p className="portal-api-notice" role="status">
          {error}
        </p>
      )}

      {!enrolled && (
        <div className="learn-demo-notice" role="status">
          Demo access enabled for this prototype.
        </div>
      )}

      <div className="learn-body">
        <main className="learn-main">
          <div className="video-section">
            <div className="video-player">
              {showVideoPlaceholder ? (
                <VideoPlaceholder courseTitle={course.title} lesson={activeLesson} />
              ) : (
                <div className="video-placeholder">
                  <p className="lesson-platform-note">Video player will connect in a future release.</p>
                </div>
              )}
            </div>

            <article className="lesson-detail">
              <header className="lesson-detail-header">
                <span className="lesson-badge">Lesson {activeLesson.sortOrder}</span>
                <h1 className="lesson-title">{activeLesson.title}</h1>
                <p className="lesson-description">
                  {activeLesson.description || 'Lesson content will be available in a future release.'}
                </p>
              </header>

              {activeLesson.objectives && activeLesson.objectives.length > 0 && (
                <section className="lesson-objectives" aria-labelledby="objectives-heading">
                  <div className="lesson-objectives-head">
                    <Target size={18} aria-hidden="true" />
                    <h2 id="objectives-heading">Learning objectives</h2>
                  </div>
                  <ul className="lesson-objectives-list">
                    {activeLesson.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="lesson-actions">
                <button
                  type="button"
                  className={`btn ${isActiveComplete ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleMarkComplete}
                  disabled={isActiveComplete}
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {isActiveComplete ? 'Completed' : 'Mark as complete'}
                </button>
                {nextLesson && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleNextLesson}
                    disabled={!isLessonUnlocked(nextLesson.id)}
                  >
                    Next lesson
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                )}
              </div>

              <p className="lesson-platform-note">
                Full video hosting and payment access will be connected later.
              </p>

              {activeLesson.notes && (
                <section className="lesson-notes" aria-labelledby="notes-heading">
                  <h2 id="notes-heading">Lesson notes</h2>
                  <div className="lesson-notes-body">
                    <p>{activeLesson.notes}</p>
                  </div>
                </section>
              )}
            </article>
          </div>
        </main>

        <aside className="learn-sidebar" aria-label="Course curriculum">
          <div className="sidebar-card">
            <div className="progress-section">
              <div className="progress-labels">
                <span>Course progress</span>
                <span className="progress-percent">{progressPercent}%</span>
              </div>
              <div
                className="progress-bar"
                role="progressbar"
                aria-label="Course progress"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="progress-detail">
                {completedCount} of {lessons.length} lessons completed
              </p>
            </div>

            <div className="sidebar-header">
              <h2>Course Curriculum</h2>
              <span className="sidebar-lesson-count">{lessons.length} lessons</span>
            </div>

            <ul className="lesson-list">
              {lessons.map((lesson) => {
                const isActive = lesson.id === activeLesson.id
                const isComplete = completedLessons.has(lesson.id)
                const isLocked = !isLessonUnlocked(lesson.id)

                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className={`lesson-item ${isActive ? 'lesson-item--active' : ''} ${isComplete ? 'lesson-item--complete' : ''} ${isLocked ? 'lesson-item--locked' : ''}`}
                      onClick={() => !isLocked && setActiveLessonId(lesson.id)}
                      disabled={isLocked}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="lesson-item-status" aria-hidden="true">
                        {isComplete ? (
                          <CheckCircle2 size={18} className="lesson-status-icon lesson-status-icon--done" />
                        ) : isLocked ? (
                          <Lock size={16} className="lesson-status-icon lesson-status-icon--locked" />
                        ) : (
                          <span className="lesson-status-num">{lesson.sortOrder}</span>
                        )}
                      </span>
                      <span className="lesson-item-content">
                        <span className="lesson-item-title">{lesson.title}</span>
                        <span className="lesson-item-meta">
                          <span className="lesson-item-duration">{lesson.duration}</span>
                          {isActive && <span className="lesson-item-now">Now playing</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function VideoPlaceholder({ courseTitle, lesson }: { courseTitle: string; lesson: ApiLesson }) {
  return (
    <div className="video-placeholder">
      <span className="video-preview-tag">{courseTitle}</span>
      <span className="video-duration-badge">{lesson.duration}</span>

      <div className="video-placeholder-center">
        <button type="button" className="video-play-btn" aria-label={`Play ${lesson.title}`}>
          <Play size={36} fill="currentColor" />
        </button>
      </div>

      <div className="video-overlay-bottom">
        <span className="video-overlay-lesson">Lesson {lesson.sortOrder}</span>
        <h2 className="video-overlay-title">{lesson.title}</h2>
      </div>
    </div>
  )
}
