import type { ApiLesson, StreamVideoStatus, VideoStatus } from './api'

export function isStreamVideoProcessing(videoStatus: VideoStatus): boolean {
  return (
    videoStatus === 'pending' ||
    videoStatus === 'processing' ||
    videoStatus === 'uploaded'
  )
}

export function canPlayStreamLesson(lesson: ApiLesson): boolean {
  return (
    lesson.videoProvider === 'cloudflare_stream' &&
    Boolean(lesson.videoUid) &&
    lesson.videoStatus === 'ready'
  )
}

export function canPlayStreamStatus(
  streamStatus: StreamVideoStatus | null | undefined,
): boolean {
  if (!streamStatus) return false
  return (
    streamStatus.readyToStream &&
    streamStatus.statusState === 'ready' &&
    !streamStatus.requireSignedURLs
  )
}

export function lessonVideoStatusFromStream(
  streamStatus: StreamVideoStatus,
): VideoStatus {
  if (streamStatus.statusState === 'error') return 'error'
  if (canPlayStreamStatus(streamStatus)) return 'ready'
  return 'processing'
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function pollStreamVideoReady(
  uid: string,
  fetchStatus: (uid: string) => Promise<StreamVideoStatus>,
  options?: {
    intervalMs?: number
    maxAttempts?: number
    onUpdate?: (status: StreamVideoStatus) => void
  },
): Promise<StreamVideoStatus> {
  const intervalMs = options?.intervalMs ?? 5000
  const maxAttempts = options?.maxAttempts ?? 24

  let latest = await fetchStatus(uid)
  options?.onUpdate?.(latest)

  if (canPlayStreamStatus(latest) || latest.statusState === 'error' || latest.requireSignedURLs) {
    return latest
  }

  for (let attempt = 1; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs)
    latest = await fetchStatus(uid)
    options?.onUpdate?.(latest)

    if (canPlayStreamStatus(latest) || latest.statusState === 'error' || latest.requireSignedURLs) {
      return latest
    }
  }

  return latest
}
