import type { VideoStatus } from './api'

export type VideoStatusLabel =
  | 'No video uploaded'
  | 'Ready'
  | 'Processing'
  | 'Uploaded'
  | 'Error'

export function getVideoStatusLabel(status: VideoStatus, videoUid: string | null): VideoStatusLabel {
  if (!videoUid || status === 'none') return 'No video uploaded'
  if (status === 'ready') return 'Ready'
  if (status === 'error') return 'Error'
  if (status === 'pending' || status === 'processing' || status === 'uploaded') return 'Processing'
  return 'Error'
}

export function getVideoStatusBadgeClass(status: VideoStatus, videoUid: string | null): string {
  const label = getVideoStatusLabel(status, videoUid)
  if (label === 'Ready') return 'admin-badge--success'
  if (label === 'Processing' || label === 'Uploaded') return 'admin-badge--warning'
  if (label === 'Error') return 'admin-badge--error'
  return 'admin-badge--muted'
}
