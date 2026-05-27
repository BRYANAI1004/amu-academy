import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import CloudflareStreamStatus from './CloudflareStreamStatus'
import {
  createDirectVideoUpload,
  createTusVideoUpload,
  deleteLessonVideo,
  getStreamVideoStatus,
  saveLessonVideo,
  type ApiLesson,
  type StreamVideoStatus,
} from '../lib/api'
import { lessonVideoStatusFromStream, pollStreamVideoReady } from '../lib/streamPlayback'
import {
  uploadFileToCloudflareStream,
  validateVideoFileForUpload,
  VIDEO_FILE_ACCEPT,
} from '../lib/videoUpload'
import {
  getVideoUploadDisplayStatus,
  getVideoUploadStatusMessage,
  type VideoUploadDisplayStatus,
} from '../lib/videoUploadStatus'
import { getVideoStatusLabel } from '../lib/videoStatus'

interface AdminLessonVideoUploadProps {
  lessonId: string
  lesson: ApiLesson
  onLessonUpdated: (lesson: ApiLesson) => void
  compact?: boolean
  showPlayerPreview?: boolean
  uploadButtonLabel?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminLessonVideoUpload({
  lessonId,
  lesson,
  onLessonUpdated,
  compact = false,
  showPlayerPreview = false,
  uploadButtonLabel = 'Upload video',
}: AdminLessonVideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadPhase, setUploadPhase] = useState<VideoUploadDisplayStatus | null>(null)
  const [progress, setProgress] = useState(0)
  const [resumableUpload, setResumableUpload] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileWarning, setFileWarning] = useState<string | null>(null)
  const [videoUid, setVideoUid] = useState(lesson.videoUid)
  const [videoProvider, setVideoProvider] = useState(lesson.videoProvider)
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<StreamVideoStatus | null>(null)

  const displayStatus = getVideoUploadDisplayStatus({
    hasVideoUid: Boolean(videoUid),
    uploadPhase,
    lessonVideoStatus: lesson.videoStatus,
    streamStatus,
  })

  const isFailedVideo = displayStatus === 'processing_error'

  useEffect(() => {
    setVideoUid(lesson.videoUid)
    setVideoProvider(lesson.videoProvider)
    if (!uploadPhase) return
    if (!lesson.videoUid && uploadPhase !== 'upload_creating' && uploadPhase !== 'uploading' && uploadPhase !== 'uploaded') {
      setUploadPhase(null)
    }
  }, [lesson.videoUid, lesson.videoProvider, lesson.videoStatus, uploadPhase])

  function handleFileChange(file: File | null) {
    setSelectedFile(file)
    setUploadError(null)
    setFileWarning(null)

    if (!file) return

    const validation = validateVideoFileForUpload(file)
    if (!validation.ok) {
      setUploadError(validation.error ?? 'Unsupported file.')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (validation.warning) {
      setFileWarning(validation.warning)
    }
  }

  async function syncStreamStatus(uid: string) {
    try {
      const latest = await pollStreamVideoReady(uid, getStreamVideoStatus, {
        onUpdate: (status) => {
          setStreamStatus(status)
        },
      })

      setStreamStatus(latest)
      const nextVideoStatus = lessonVideoStatusFromStream(latest)
      const updatedLesson = await saveLessonVideo(lessonId, {
        videoProvider: 'cloudflare_stream',
        videoUid: uid,
        videoStatus: nextVideoStatus,
      })
      onLessonUpdated(updatedLesson)
    } catch {
      // Lesson stays in processing; admin can refresh status manually.
    } finally {
      setUploadPhase(null)
    }
  }

  async function handleDeleteVideo() {
    if (!videoUid) return

    const confirmed = window.confirm(
      'Delete this video from Cloudflare Stream and clear it from this lesson?',
    )
    if (!confirmed) return

    setDeleting(true)
    setUploadError(null)
    setDeleteSuccessMessage(null)

    try {
      const updatedLesson = await deleteLessonVideo(lessonId)
      setVideoUid(null)
      setVideoProvider(null)
      setStreamStatus(null)
      setUploadPhase(null)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onLessonUpdated(updatedLesson)
      setDeleteSuccessMessage('Video deleted from Cloudflare Stream and removed from this lesson.')
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not delete video')
      setUploadPhase('upload_error')
    } finally {
      setDeleting(false)
    }
  }

  function handleUpload() {
    if (!selectedFile) return

    const validation = validateVideoFileForUpload(selectedFile)
    if (!validation.ok) {
      setUploadError(validation.error ?? 'Unsupported file.')
      return
    }

    setUploadError(null)
    setProgress(0)
    setResumableUpload(false)
    setUploadPhase('upload_creating')

    void (async () => {
      try {
        const createUpload = selectedFile.size > 200 * 1024 * 1024 ? createTusVideoUpload : createDirectVideoUpload
        const { uploadURL, uid } = await createUpload({
          lessonId,
          fileName: selectedFile.name,
          maxDurationSeconds: 7200,
        })

        setUploadPhase('uploading')

        await uploadFileToCloudflareStream(selectedFile, uploadURL, {
          preferTus: selectedFile.size > 200 * 1024 * 1024,
          onProgress: setProgress,
          onResumable: () => setResumableUpload(true),
        })

        setUploadPhase('uploaded')

        const updatedLesson = await saveLessonVideo(lessonId, {
          videoProvider: 'cloudflare_stream',
          videoUid: uid,
          videoStatus: 'processing',
        })

        setVideoUid(updatedLesson.videoUid)
        setVideoProvider(updatedLesson.videoProvider)
        onLessonUpdated(updatedLesson)
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        setUploadPhase('processing')
        void syncStreamStatus(uid)
      } catch (error) {
        setUploadPhase('upload_error')
        setUploadError(error instanceof Error ? error.message : 'Upload failed')
      }
    })()
  }

  const statusMessage = getVideoUploadStatusMessage(displayStatus, {
    uploadProgress: progress,
    resumable: resumableUpload,
    pctComplete: streamStatus?.pctComplete ?? null,
    uploadError,
  })

  const isBusy =
    deleting ||
    uploadPhase === 'upload_creating' ||
    uploadPhase === 'uploading' ||
    uploadPhase === 'uploaded' ||
    uploadPhase === 'processing'

  const showProgressBar =
    uploadPhase === 'uploading' ||
    uploadPhase === 'upload_creating' ||
    uploadPhase === 'uploaded'

  const statusIsError = displayStatus === 'upload_error' || displayStatus === 'processing_error'
  const statusIsPositive =
    displayStatus === 'ready' ||
    displayStatus === 'processing' ||
    displayStatus === 'uploaded'

  return (
    <section
      className={`admin-video-upload${compact ? ' admin-video-upload--compact' : ''}`}
      aria-label="Video upload"
    >
      {!compact && (
        <div className="admin-video-upload__head">
          <Upload size={22} aria-hidden="true" />
          <h2 className="admin-video-upload__title">Video upload</h2>
        </div>
      )}

      <p className="admin-video-upload__helper">
        Upload a video file. Cloudflare supports many formats, but MP4/H.264/AAC is recommended for
        best compatibility.
      </p>

      {videoUid && displayStatus !== 'no_video' && displayStatus !== 'upload_error' && (
        <div className="admin-video-upload__meta">
          <p className="admin-video-upload__success">
            {getVideoStatusLabel(lesson.videoStatus, videoUid)}
          </p>
          <p>
            Provider: {videoProvider === 'cloudflare_stream' ? 'Cloudflare Stream' : videoProvider}
          </p>
          <p className="admin-video-upload__uid">UID: {videoUid}</p>
        </div>
      )}

      {videoUid && showPlayerPreview && (
        <CloudflareStreamStatus
          lessonId={lessonId}
          lesson={lesson}
          title={lesson.title}
          showPlayer
          autoFetch
          onLessonUpdated={onLessonUpdated}
          onStreamStatusChange={setStreamStatus}
        />
      )}

      <label className="admin-video-upload__file">
        <span className="admin-field__label">Video file</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={VIDEO_FILE_ACCEPT}
          className="admin-video-upload__input"
          disabled={isBusy}
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </label>

      {selectedFile && (
        <p className="admin-video-upload__file-info">
          {selectedFile.name} · {formatFileSize(selectedFile.size)}
        </p>
      )}

      {fileWarning && (
        <p className="admin-video-upload__warning" role="status">
          {fileWarning}
        </p>
      )}

      {showProgressBar && (
        <div
          className="admin-video-upload__progress"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="admin-video-upload__progress-bar"
            style={{
              width:
                uploadPhase === 'uploading' ? `${progress}%` : uploadPhase === 'uploaded' ? '100%' : '12%',
            }}
          />
        </div>
      )}

      <p
        className={`admin-video-upload__status${statusIsError ? ' admin-video-upload__status--error' : ''}${statusIsPositive ? ' admin-video-upload__status--success' : ''}`}
        role="status"
      >
        {statusMessage}
      </p>

      <div className="admin-video-upload__actions">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={!selectedFile || isBusy}
          onClick={handleUpload}
        >
          {videoUid ? 'Replace video' : uploadButtonLabel}
        </button>

        {videoUid && (
          <button
            type="button"
            className={`btn ${isFailedVideo ? 'btn-primary admin-video-upload__delete--failed' : 'btn-secondary admin-video-upload__delete'}`}
            disabled={isBusy}
            onClick={() => {
              void handleDeleteVideo()
            }}
          >
            {deleting ? 'Deleting…' : isFailedVideo ? 'Delete failed video' : 'Delete video'}
          </button>
        )}
      </div>

      {deleteSuccessMessage && (
        <p className="admin-video-upload__status admin-video-upload__status--success" role="status">
          {deleteSuccessMessage}
        </p>
      )}
    </section>
  )
}
