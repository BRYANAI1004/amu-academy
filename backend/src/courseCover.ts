export const COURSE_COVER_BUCKET = 'course-covers'
export const MAX_COVER_FILE_SIZE = 5 * 1024 * 1024

export type CoverErrorCode =
  | 'COVER_UPLOAD_FAILED'
  | 'COVER_FILE_REQUIRED'
  | 'COVER_FILE_TOO_LARGE'
  | 'COVER_FILE_TYPE_INVALID'

export class CoverUploadError extends Error {
  readonly code: CoverErrorCode

  constructor(code: CoverErrorCode, message: string) {
    super(message)
    this.name = 'CoverUploadError'
    this.code = code
  }
}

export function isCoverUploadError(error: unknown): error is CoverUploadError {
  return error instanceof CoverUploadError
}

export function safeCoverFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'cover'
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'cover'
}
