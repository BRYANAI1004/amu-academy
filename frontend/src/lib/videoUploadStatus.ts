import type { ApiLesson, StreamVideoStatus, VideoStatus } from './api'
import { canPlayStreamStatus } from './streamPlayback'

export type VideoUploadDisplayStatus =
  | 'no_video'
  | 'upload_creating'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'ready'
  | 'upload_error'
  | 'processing_error'

export function getVideoUploadDisplayStatus(input: {
  hasVideoUid: boolean
  uploadPhase: VideoUploadDisplayStatus | null
  lessonVideoStatus: VideoStatus
  streamStatus: StreamVideoStatus | null
}): VideoUploadDisplayStatus {
  const { hasVideoUid, uploadPhase, lessonVideoStatus, streamStatus } = input

  if (uploadPhase === 'upload_creating' || uploadPhase === 'uploading' || uploadPhase === 'uploaded') {
    return uploadPhase
  }

  if (uploadPhase === 'upload_error') {
    return 'upload_error'
  }

  if (!hasVideoUid) {
    return 'no_video'
  }

  if (
    lessonVideoStatus === 'error' ||
    streamStatus?.statusState === 'error'
  ) {
    return 'processing_error'
  }

  if (
    lessonVideoStatus === 'ready' ||
    canPlayStreamStatus(streamStatus)
  ) {
    return 'ready'
  }

  return 'processing'
}

export function getVideoUploadStatusMessage(
  status: VideoUploadDisplayStatus,
  options?: {
    uploadProgress?: number
    resumable?: boolean
    pctComplete?: number | null
    uploadError?: string | null
  },
): string {
  const progress = options?.uploadProgress ?? 0
  const resumableLabel = options?.resumable ? ' (resumable)' : ''

  switch (status) {
    case 'no_video':
      return 'Ready to upload'
    case 'upload_creating':
      return 'Creating upload URL…'
    case 'uploading':
      return `Uploading${resumableLabel}… ${progress}%`
    case 'uploaded':
      return 'Upload complete. Saving video to lesson…'
    case 'processing': {
      if (options?.pctComplete != null && Number.isFinite(options.pctComplete)) {
        return `Cloudflare is processing this video… ${Math.round(options.pctComplete)}%`
      }
      return 'Video uploaded. Cloudflare is processing. Playback will be available when ready.'
    }
    case 'ready':
      return 'Video is ready for playback.'
    case 'upload_error':
      return options?.uploadError ?? 'Upload failed before Cloudflare could receive the file.'
    case 'processing_error':
      return 'Cloudflare received the file but could not process it. Try re-exporting as MP4 with H.264 video and AAC audio, then upload again.'
    default:
      return ''
  }
}

export function getLessonVideoBadgeLabel(
  lesson: ApiLesson,
  streamStatus: StreamVideoStatus | null,
): string {
  const display = getVideoUploadDisplayStatus({
    hasVideoUid: Boolean(lesson.videoUid),
    uploadPhase: null,
    lessonVideoStatus: lesson.videoStatus,
    streamStatus,
  })

  switch (display) {
    case 'ready':
      return 'Ready'
    case 'processing':
      return 'Processing'
    case 'processing_error':
      return 'Processing error'
    case 'no_video':
      return 'No video uploaded'
    default:
      return 'Processing'
  }
}
