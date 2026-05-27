import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  getStreamVideoStatus,
  saveLessonVideo,
  type ApiLesson,
  type StreamVideoStatus,
} from '../lib/api'
import {
  canPlayStreamStatus,
  lessonVideoStatusFromStream,
} from '../lib/streamPlayback'

interface CloudflareStreamStatusProps {
  lessonId: string
  lesson: ApiLesson
  title: string
  showPlayer?: boolean
  autoFetch?: boolean
  onLessonUpdated?: (lesson: ApiLesson) => void
  onStreamStatusChange?: (status: StreamVideoStatus | null) => void
}

const PROCESSING_ERROR_MESSAGE =
  'Cloudflare received the file but could not process it. Try re-exporting as MP4 with H.264 video and AAC audio, then upload again.'

export default function CloudflareStreamStatus({
  lessonId,
  lesson,
  title,
  showPlayer = false,
  autoFetch = true,
  onLessonUpdated,
  onStreamStatusChange,
}: CloudflareStreamStatusProps) {
  const [streamStatus, setStreamStatus] = useState<StreamVideoStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lessonRef = useRef(lesson)

  useEffect(() => {
    lessonRef.current = lesson
  }, [lesson])

  const syncLessonStatus = useCallback(
    async (status: StreamVideoStatus) => {
      const currentLesson = lessonRef.current
      if (!onLessonUpdated || !currentLesson.videoUid) return

      const nextVideoStatus = lessonVideoStatusFromStream(status)
      if (nextVideoStatus === currentLesson.videoStatus) return

      const updatedLesson = await saveLessonVideo(lessonId, {
        videoProvider: 'cloudflare_stream',
        videoUid: currentLesson.videoUid,
        videoStatus: nextVideoStatus,
      })
      onLessonUpdated(updatedLesson)
    },
    [lessonId, onLessonUpdated],
  )

  const refreshStatus = useCallback(
    async (syncLesson = false) => {
      const currentLesson = lessonRef.current
      if (!currentLesson.videoUid) return null

      setLoading(true)
      setError(null)

      try {
        const status = await getStreamVideoStatus(currentLesson.videoUid)
        setStreamStatus(status)
        onStreamStatusChange?.(status)
        if (syncLesson) {
          await syncLessonStatus(status)
        }
        return status
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Could not fetch video status'
        setError(message)
        onStreamStatusChange?.(null)
        return null
      } finally {
        setLoading(false)
      }
    },
    [onStreamStatusChange, syncLessonStatus],
  )

  useEffect(() => {
    if (!autoFetch || !lesson.videoUid) return
    void refreshStatus(true)
  }, [autoFetch, lesson.videoUid, refreshStatus])

  if (!lesson.videoUid) return null

  const playable =
    lesson.videoProvider === 'cloudflare_stream' &&
    canPlayStreamStatus(streamStatus)

  const processing =
    streamStatus &&
    !playable &&
    !streamStatus.requireSignedURLs &&
    streamStatus.statusState !== 'error'

  const signedRequired = Boolean(streamStatus?.requireSignedURLs)
  const cloudflareError =
    streamStatus?.statusState === 'error' || lesson.videoStatus === 'error'

  const processingPct =
    streamStatus?.pctComplete != null && Number.isFinite(streamStatus.pctComplete)
      ? Math.round(streamStatus.pctComplete)
      : null

  return (
    <div className="admin-stream-status">
      <div className="admin-stream-status__head">
        <h4 className="admin-stream-status__title">Cloudflare Stream status</h4>
        <button
          type="button"
          className="btn btn-secondary admin-stream-status__refresh"
          disabled={loading}
          onClick={() => {
            void refreshStatus(true)
          }}
        >
          <RefreshCw size={15} aria-hidden="true" />
          {loading ? 'Refreshing…' : 'Refresh video status'}
        </button>
      </div>

      {error && (
        <p className="admin-note admin-note--error" role="alert">
          {error}
        </p>
      )}

      {streamStatus && (
        <dl className="admin-stream-status__details">
          <div>
            <dt>Status</dt>
            <dd>{streamStatus.statusState}</dd>
          </div>
          <div>
            <dt>readyToStream</dt>
            <dd>{streamStatus.readyToStream ? 'true' : 'false'}</dd>
          </div>
          <div>
            <dt>requireSignedURLs</dt>
            <dd>{streamStatus.requireSignedURLs ? 'true' : 'false'}</dd>
          </div>
          {processingPct != null && (
            <div>
              <dt>Processing</dt>
              <dd>{processingPct}%</dd>
            </div>
          )}
        </dl>
      )}

      {processing && (
        <p className="admin-stream-status__notice">
          {processingPct != null
            ? `Cloudflare is processing this video (${processingPct}%). Playback will be available when ready.`
            : 'Video uploaded. Cloudflare is still processing. It may take a few minutes before playback is available.'}
        </p>
      )}

      {signedRequired && (
        <p className="admin-stream-status__notice admin-stream-status__notice--warning">
          This video requires signed playback. Public iframe playback is disabled.
        </p>
      )}

      {cloudflareError && (
        <p className="admin-stream-status__notice admin-stream-status__notice--error">
          {PROCESSING_ERROR_MESSAGE}
        </p>
      )}

      {showPlayer && playable && !cloudflareError && (
        <div className="admin-video-upload__preview">
          <iframe
            className="admin-video-upload__iframe"
            src={`https://iframe.videodelivery.net/${lesson.videoUid}`}
            title={`Preview for ${title}`}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}

export { canPlayStreamStatus }
