import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Play,
  Target,
} from 'lucide-react'
import PortalHeader from '../components/PortalHeader'
import { getCourse, getCourseFallback, type ApiCourse, type ApiLesson } from '../lib/api'
import { canPlayStreamLesson, isStreamVideoProcessing } from '../lib/streamPlayback'

function AmuGradientShell({ children }: { children: ReactNode }) {
  return (
    <div className="portal-page amu-gradient-page learn-page">
      <div className="login-gradient-art" aria-hidden="true">
        <span className="login-blob login-blob--yellow" />
        <span className="login-blob login-blob--orange" />
        <span className="login-blob login-blob--peach" />
        <span className="login-blob login-blob--pink" />
        <span className="login-blob login-blob--lavender" />
        <span className="login-blob login-blob--red" />
      </div>
      {children}
    </div>
  )
}

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
      <AmuGradientShell>
        <PortalHeader />
        <main className="portal-main portal-main--narrow">
          <div className="portal-empty">
            <p>Loading course…</p>
          </div>
        </main>
      </AmuGradientShell>
    )
  }

  if (!course) {
    return (
      <AmuGradientShell>
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
      </AmuGradientShell>
    )
  }

  return (
    <LearnPageContent course={course} error={error} />
  )
}

function LearnPageContent({ course, error }: { course: ApiCourse; error: string | null }) {
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
      <AmuGradientShell>
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
      </AmuGradientShell>
    )
  }

  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId)
  const activeLesson = lessons[activeIndex] ?? lessons[0]!
  const completedCount = completedLessons.size
  const progressPercent = Math.round((completedCount / lessons.length) * 100)
  const isActiveComplete = completedLessons.has(activeLesson.id)
  const nextLesson = lessons[activeIndex + 1]
  const showStreamVideo = canPlayStreamLesson(activeLesson)
  const showProcessingMessage = isStreamVideoProcessing(activeLesson.videoStatus) &&
    activeLesson.videoProvider === 'cloudflare_stream' &&
    Boolean(activeLesson.videoUid)
  const showVideoError =
    activeLesson.videoStatus === 'error' &&
    activeLesson.videoProvider === 'cloudflare_stream' &&
    Boolean(activeLesson.videoUid)

  function handleMarkComplete() {
    setCompletedLessons((prev) => new Set(prev).add(activeLesson.id))
  }

  function handleNextLesson() {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id)
    }
  }

  return (
    <AmuGradientShell>
      <PortalHeader subtitle={course.title} />

      {error && (
        <p className="portal-api-notice" role="status">
          {error}
        </p>
      )}

      <div className="learn-body">
        <main className="learn-main">
          <div className="video-section">
            <div className="video-player">
              {showStreamVideo ? (
                <iframe
                  className="video-stream-iframe"
                  src={`https://iframe.videodelivery.net/${activeLesson.videoUid}`}
                  title={activeLesson.title}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              ) : showProcessingMessage ? (
                <VideoProcessingPlaceholder lesson={activeLesson} />
              ) : showVideoError ? (
                <VideoErrorPlaceholder lesson={activeLesson} />
              ) : (
                <VideoPlaceholder courseTitle={course.title} lesson={activeLesson} />
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
                  >
                    Next lesson
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                )}
              </div>

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

                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      className={`lesson-item ${isActive ? 'lesson-item--active' : ''} ${isComplete ? 'lesson-item--complete' : ''}`}
                      onClick={() => setActiveLessonId(lesson.id)}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span className="lesson-item-status" aria-hidden="true">
                        {isComplete ? (
                          <CheckCircle2 size={18} className="lesson-status-icon lesson-status-icon--done" />
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
    </AmuGradientShell>
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

function VideoProcessingPlaceholder({ lesson }: { lesson: ApiLesson }) {
  return (
    <div className="video-placeholder video-placeholder--processing">
      <span className="video-duration-badge">{lesson.duration}</span>
      <div className="video-placeholder-center">
        <p className="video-processing-message">
          Video uploaded and processing. Please check back shortly.
        </p>
      </div>
      <div className="video-overlay-bottom">
        <span className="video-overlay-lesson">Lesson {lesson.sortOrder}</span>
        <h2 className="video-overlay-title">{lesson.title}</h2>
      </div>
    </div>
  )
}

function VideoErrorPlaceholder({ lesson }: { lesson: ApiLesson }) {
  return (
    <div className="video-placeholder video-placeholder--error">
      <span className="video-duration-badge">{lesson.duration}</span>
      <div className="video-placeholder-center">
        <p className="video-processing-message">
          This lesson video could not be processed. Please contact support.
        </p>
      </div>
      <div className="video-overlay-bottom">
        <span className="video-overlay-lesson">Lesson {lesson.sortOrder}</span>
        <h2 className="video-overlay-title">{lesson.title}</h2>
      </div>
    </div>
  )
}
