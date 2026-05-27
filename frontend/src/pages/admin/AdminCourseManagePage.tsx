import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import AdminCourseForm from '../../components/AdminCourseForm'
import AdminCourseCoverUpload from '../../components/AdminCourseCoverUpload'
import AdminLessonForm, { emptyLessonForm } from '../../components/AdminLessonForm'
import AdminLessonVideoUpload from '../../components/AdminLessonVideoUpload'
import { formatCoursePrice } from '../../data/courses'
import {
  adminCreateLesson,
  adminDeleteLesson,
  adminGetCourse,
  adminGetLessons,
  adminReorderLessons,
  adminUpdateCourse,
  adminUpdateLesson,
  courseFormToInput,
  courseToFormData,
  getCategories,
  getCategoriesFallback,
  lessonFormToInput,
  type ApiCategory,
  type ApiCourse,
  type ApiLesson,
} from '../../lib/api'
import { getVideoStatusBadgeClass, getVideoStatusLabel } from '../../lib/videoStatus'

type ManageTab = 'info' | 'lessons' | 'media' | 'preview'

const TABS: { id: ManageTab; label: string }[] = [
  { id: 'info', label: 'Course Info' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'media', label: 'Media' },
  { id: 'preview', label: 'Preview' },
]

function parseTab(value: string | null): ManageTab {
  if (value === 'lessons' || value === 'media' || value === 'preview') return value
  return 'info'
}

export default function AdminCourseManagePage() {
  const { courseId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = parseTab(searchParams.get('tab'))
  const highlightLessonId = searchParams.get('lesson')

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [lessons, setLessons] = useState<ApiLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [categories, setCategories] = useState<ApiCategory[]>([])

  const refetchLessons = useCallback(async () => {
    const data = await adminGetLessons(courseId)
    setLessons([...data].sort((a, b) => a.sortOrder - b.sortOrder))
    return data
  }, [courseId])

  const refetchCourse = useCallback(async () => {
    const data = await adminGetCourse(courseId)
    if (data) {
      setCourse(data)
      setLessons([...data.lessons].sort((a, b) => a.sortOrder - b.sortOrder))
    }
    return data
  }, [courseId])

  useEffect(() => {
    setLoading(true)
    setError(null)
    refetchCourse()
      .then((data) => {
        if (!data) setError('Course not found.')
      })
      .catch(() => setError('Could not load course from the API.'))
      .finally(() => setLoading(false))
  }, [refetchCourse])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories(getCategoriesFallback()))
  }, [])

  function setTab(tab: ManageTab, lessonId?: string) {
    const next = new URLSearchParams(searchParams)
    next.set('tab', tab)
    if (lessonId) {
      next.set('lesson', lessonId)
    } else {
      next.delete('lesson')
    }
    setSearchParams(next, { replace: true })
  }

  async function handleSaveCourse(data: ReturnType<typeof courseToFormData>) {
    if (!course) return
    setSaving(true)
    setActionError(null)
    try {
      const updated = await adminUpdateCourse(course.id, courseFormToInput(data))
      setCourse(updated)
      setLessons([...updated.lessons].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch {
      setActionError('Could not save course changes.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateLesson(data: typeof emptyLessonForm) {
    if (!course) return
    setCreatingLesson(true)
    setActionError(null)
    try {
      await adminCreateLesson(course.id, lessonFormToInput(data))
      await refetchLessons()
      setShowAddLesson(false)
    } catch {
      setActionError('Could not create lesson.')
    } finally {
      setCreatingLesson(false)
    }
  }

  async function handleDeleteLesson(lesson: ApiLesson) {
    const confirmed = window.confirm(
      'Delete this lesson? This will remove the lesson metadata. It will not automatically delete the Cloudflare Stream video.',
    )
    if (!confirmed) return

    setDeletingLessonId(lesson.id)
    setActionError(null)
    try {
      await adminDeleteLesson(lesson.id)
      await refetchLessons()
    } catch {
      setActionError('Could not delete lesson.')
    } finally {
      setDeletingLessonId(null)
    }
  }

  async function handleMoveLesson(lessonId: string, direction: 'up' | 'down') {
    const index = lessons.findIndex((lesson) => lesson.id === lessonId)
    if (index === -1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= lessons.length) return

    const reordered = [...lessons]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    setReordering(true)
    setActionError(null)
    try {
      const updated = await adminReorderLessons(
        courseId,
        reordered.map((lesson) => lesson.id),
      )
      setLessons(updated)
    } catch {
      setActionError('Could not reorder lessons.')
    } finally {
      setReordering(false)
    }
  }

  async function handleTogglePreview(lesson: ApiLesson) {
    setActionError(null)
    try {
      const updated = await adminUpdateLesson(lesson.id, { isPreview: !lesson.isPreview })
      setLessons((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)).sort((a, b) => a.sortOrder - b.sortOrder),
      )
    } catch {
      setActionError('Could not update preview setting.')
    }
  }

  function handleLessonUpdated(updatedLesson: ApiLesson) {
    setLessons((current) =>
      current.map((item) => (item.id === updatedLesson.id ? updatedLesson : item)),
    )
  }

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.sortOrder - b.sortOrder),
    [lessons],
  )

  useEffect(() => {
    if (activeTab !== 'media' || !highlightLessonId) return
    const element = document.getElementById(`lesson-media-${highlightLessonId}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeTab, highlightLessonId, sortedLessons.length])

  const firstLesson = sortedLessons[0]
  const studentCoursePath = course ? `/courses/${course.slug || course.id}` : '#'
  const learnPath = course ? `/learn/${course.slug || course.id}` : '#'
  const firstLessonLearnPath =
    course && firstLesson
      ? `/learn/${course.slug || course.id}?lesson=${firstLesson.id}`
      : learnPath

  if (loading) {
    return (
      <div className="admin-content">
        <div className="admin-panel admin-empty">
          <p>Loading course…</p>
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
          <h1 className="admin-page-head__title">Manage course</h1>
          <p className="admin-page-head__subtitle">{course.title}</p>
        </div>
        <div className="admin-page-head__links">
          <a href={studentCoursePath} target="_blank" rel="noreferrer" className="admin-link-action">
            <ExternalLink size={14} aria-hidden="true" />
            View student page
          </a>
          <Link to="/admin/courses" className="admin-link-back">
            ← Back to courses
          </Link>
          {activeTab === 'info' && (
            <button
              type="submit"
              form="admin-course-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
        </div>
      </div>

      {(error || actionError) && (
        <p className="admin-note admin-note--error" role="alert">
          {error ?? actionError}
        </p>
      )}

      <nav className="admin-tabs" aria-label="Course management">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tabs__tab${activeTab === tab.id ? ' admin-tabs__tab--active' : ''}`}
            onClick={() => setTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'info' && (
        <div className="admin-panel">
          <AdminCourseCoverUpload
            courseId={course.id}
            coverImageUrl={course.coverImageUrl}
            onCoverUpdated={(coverImageUrl) => {
              setCourse((current) => (current ? { ...current, coverImageUrl } : current))
            }}
          />
          <AdminCourseForm
            formId="admin-course-form"
            initial={courseToFormData(course)}
            categories={categories}
            submitLabel={saving ? 'Saving…' : 'Save changes'}
            onSubmit={(data) => {
              void handleSaveCourse(data)
            }}
          />
        </div>
      )}

      {activeTab === 'lessons' && (
        <div className="admin-panel admin-table-wrap">
          <div className="admin-panel__toolbar">
            <h2>Lessons</h2>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddLesson(true)}>
              <Plus size={18} aria-hidden="true" />
              Add lesson
            </button>
          </div>

          {sortedLessons.length === 0 ? (
            <p className="admin-empty-text">No lessons yet. Add the first lesson for this course.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Duration</th>
                  <th>Preview</th>
                  <th>Video</th>
                  <th>UID</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {sortedLessons.map((lesson, index) => (
                  <tr key={lesson.id}>
                    <td>{lesson.sortOrder}</td>
                    <td>{lesson.title}</td>
                    <td>{lesson.duration}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-toggle${lesson.isPreview ? ' admin-toggle--on' : ''}`}
                        onClick={() => {
                          void handleTogglePreview(lesson)
                        }}
                        aria-pressed={lesson.isPreview}
                      >
                        {lesson.isPreview ? 'Free' : 'Paid'}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${getVideoStatusBadgeClass(lesson.videoStatus, lesson.videoUid)}`}
                      >
                        {getVideoStatusLabel(lesson.videoStatus, lesson.videoUid)}
                      </span>
                    </td>
                    <td>
                      <span className="admin-table__meta">
                        {lesson.videoUid ?? '—'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <Link
                          to={`/admin/lessons/${lesson.id}/edit?courseId=${course.id}`}
                          className="admin-table__action"
                        >
                          <Pencil size={15} aria-hidden="true" />
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-table__action admin-table__action--button"
                          onClick={() => setTab('media', lesson.id)}
                        >
                          <Upload size={15} aria-hidden="true" />
                          Upload video
                        </button>
                        <button
                          type="button"
                          className="admin-table__action admin-table__action--button"
                          disabled={index === 0 || reordering}
                          onClick={() => {
                            void handleMoveLesson(lesson.id, 'up')
                          }}
                        >
                          <ArrowUp size={15} aria-hidden="true" />
                          Up
                        </button>
                        <button
                          type="button"
                          className="admin-table__action admin-table__action--button"
                          disabled={index === sortedLessons.length - 1 || reordering}
                          onClick={() => {
                            void handleMoveLesson(lesson.id, 'down')
                          }}
                        >
                          <ArrowDown size={15} aria-hidden="true" />
                          Down
                        </button>
                        <button
                          type="button"
                          className="admin-table__action admin-table__action--button admin-table__action--danger"
                          disabled={deletingLessonId === lesson.id}
                          onClick={() => {
                            void handleDeleteLesson(lesson)
                          }}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'media' && (
        <>
        <details className="admin-media-compat-note">
          <summary>Video format compatibility</summary>
          <p>
            Older formats such as RM/RMVB may play locally but fail cloud encoding. Re-encode with
            H.264/AAC MP4 if Cloudflare reports an error.
          </p>
        </details>
        <div className="admin-media-grid">
          {sortedLessons.length === 0 ? (
            <div className="admin-panel admin-empty">
              <p className="admin-empty-text">Add lessons before uploading media.</p>
            </div>
          ) : (
            sortedLessons.map((lesson) => (
              <article
                key={lesson.id}
                id={`lesson-media-${lesson.id}`}
                className={`admin-media-card${highlightLessonId === lesson.id ? ' admin-media-card--highlight' : ''}`}
              >
                <div className="admin-media-card__head">
                  <div>
                    <p className="admin-media-card__label">Lesson {lesson.sortOrder}</p>
                    <h3 className="admin-media-card__title">{lesson.title}</h3>
                  </div>
                  <span
                    className={`admin-badge ${getVideoStatusBadgeClass(lesson.videoStatus, lesson.videoUid)}`}
                  >
                    {getVideoStatusLabel(lesson.videoStatus, lesson.videoUid)}
                  </span>
                </div>

                <div className="admin-media-card__meta">
                  <p>Provider: Cloudflare Stream</p>
                  <p className="admin-media-card__uid">UID: {lesson.videoUid ?? 'Not uploaded'}</p>
                </div>

                <AdminLessonVideoUpload
                  lessonId={lesson.id}
                  lesson={lesson}
                  compact
                  showPlayerPreview
                  uploadButtonLabel="Upload video"
                  onLessonUpdated={handleLessonUpdated}
                />
              </article>
            ))
          )}
        </div>
        </>
      )}

      {activeTab === 'preview' && (
        <div className="admin-preview-layout">
          <div className="admin-panel">
            <h2>Student preview links</h2>
            <div className="admin-quick-actions">
              <a href={studentCoursePath} target="_blank" rel="noreferrer" className="admin-quick-action">
                <Eye size={16} aria-hidden="true" />
                View course detail
              </a>
              <a href={learnPath} target="_blank" rel="noreferrer" className="admin-quick-action">
                <ExternalLink size={16} aria-hidden="true" />
                Open learn page
              </a>
              {firstLesson && (
                <a
                  href={firstLessonLearnPath}
                  target="_blank"
                  rel="noreferrer"
                  className="admin-quick-action"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Preview first lesson
                </a>
              )}
            </div>
          </div>

          <article className="admin-panel admin-preview-card">
            {course.coverImageUrl && (
              <img
                src={course.coverImageUrl}
                alt=""
                className="admin-preview-card__cover"
              />
            )}
            <p className="admin-preview-card__category">{course.category}</p>
            <h2>{course.title}</h2>
            <p className="admin-preview-card__description">{course.shortDescription}</p>
            <div className="admin-preview-card__meta">
              <span>{formatCoursePrice(course.price)}</span>
              <span>{sortedLessons.length} lessons</span>
              <span className={`admin-badge ${course.status === 'available' ? 'admin-badge--success' : 'admin-badge--muted'}`}>
                {course.status === 'available' ? 'Available' : 'Coming soon'}
              </span>
            </div>
            {course.whatYouLearn.length > 0 && (
              <ul className="admin-preview-card__list">
                {course.whatYouLearn.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        </div>
      )}

      {showAddLesson && (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setShowAddLesson(false)}>
          <div
            className="admin-modal"
            role="dialog"
            aria-labelledby="add-lesson-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal__head">
              <h2 id="add-lesson-title">Add lesson</h2>
              <button
                type="button"
                className="admin-modal__close"
                aria-label="Close"
                onClick={() => setShowAddLesson(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <AdminLessonForm
              initial={{ ...emptyLessonForm, sortOrder: sortedLessons.length + 1 }}
              submitLabel={creatingLesson ? 'Creating…' : 'Create lesson'}
              onSubmit={(data) => {
                void handleCreateLesson(data)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
