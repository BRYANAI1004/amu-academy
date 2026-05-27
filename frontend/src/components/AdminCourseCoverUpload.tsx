import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Trash2, Upload } from 'lucide-react'
import { deleteCourseCover, uploadCourseCover } from '../lib/api'

type CoverUploadStatus = 'idle' | 'uploading' | 'saved' | 'error'

interface AdminCourseCoverUploadProps {
  courseId: string
  coverImageUrl?: string | null
  onCoverUpdated: (coverImageUrl: string | null) => void
}

function parseCoverError(message: string): string {
  try {
    const parsed = JSON.parse(message) as { error?: string; code?: string }
    if (parsed.error) return parsed.error
  } catch {
    // use raw message
  }
  return message || 'Could not update course cover.'
}

export default function AdminCourseCoverUpload({
  courseId,
  coverImageUrl,
  onCoverUpdated,
}: AdminCourseCoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(coverImageUrl ?? null)
  const [status, setStatus] = useState<CoverUploadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    setPreviewUrl(coverImageUrl ?? null)
  }, [coverImageUrl])

  async function handleUpload(file: File) {
    setStatus('uploading')
    setErrorMessage(null)

    try {
      const updated = await uploadCourseCover(courseId, file)
      setPreviewUrl(updated.coverImageUrl ?? null)
      onCoverUpdated(updated.coverImageUrl ?? null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setStatus('saved')
    } catch (error) {
      setStatus('error')
      setErrorMessage(parseCoverError(error instanceof Error ? error.message : ''))
    }
  }

  async function handleRemove() {
    if (!previewUrl && !coverImageUrl) return

    setRemoving(true)
    setErrorMessage(null)
    setStatus('idle')

    try {
      const updated = await deleteCourseCover(courseId)
      setPreviewUrl(null)
      onCoverUpdated(updated.coverImageUrl ?? null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setStatus('error')
      setErrorMessage(parseCoverError(error instanceof Error ? error.message : ''))
    } finally {
      setRemoving(false)
    }
  }

  const hasCover = Boolean(previewUrl)
  const uploadLabel = hasCover ? 'Replace cover' : 'Upload cover'
  const isBusy = status === 'uploading' || removing

  return (
    <section className="admin-cover-section" aria-labelledby="course-cover-heading">
      <h2 id="course-cover-heading" className="admin-cover-section__title">
        Course cover image
      </h2>
      <p className="admin-cover-section__hint">
        Recommended: 16:9 image, JPG/PNG/WebP, under 5MB.
      </p>

      <div className="admin-cover-section__preview-wrap">
        {hasCover ? (
          <img
            src={previewUrl ?? undefined}
            alt="Course cover preview"
            className="admin-cover-section__preview"
          />
        ) : (
          <div className="admin-cover-section__placeholder" aria-hidden="true">
            <ImageIcon size={28} />
            <span>No cover image</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="admin-cover-section__file-input"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void handleUpload(file)
          }
        }}
      />

      <div className="admin-cover-section__actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isBusy}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={16} aria-hidden="true" />
          {status === 'uploading' ? 'Uploading…' : uploadLabel}
        </button>

        {hasCover && (
          <button
            type="button"
            className="btn btn-secondary admin-cover-section__remove"
            disabled={isBusy}
            onClick={() => {
              void handleRemove()
            }}
          >
            <Trash2 size={16} aria-hidden="true" />
            {removing ? 'Removing…' : 'Remove cover'}
          </button>
        )}
      </div>

      {status === 'saved' && (
        <p className="admin-cover-section__status admin-cover-section__status--saved" role="status">
          Cover saved.
        </p>
      )}

      {status === 'uploading' && (
        <p className="admin-cover-section__status" role="status">
          Uploading cover…
        </p>
      )}

      {errorMessage && (
        <p className="admin-cover-section__status admin-cover-section__status--error" role="alert">
          {errorMessage}
        </p>
      )}
    </section>
  )
}
