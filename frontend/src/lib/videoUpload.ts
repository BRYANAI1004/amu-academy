import * as tus from 'tus-js-client'

export const VIDEO_FILE_ACCEPT =
  'video/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.flv,.mpg,.mpeg,.m2ts,.ts,.3gp,.mxf,.rm,.rmvb'

export const ALLOWED_VIDEO_EXTENSIONS = new Set([
  'mp4',
  'mov',
  'm4v',
  'webm',
  'mkv',
  'avi',
  'flv',
  'mpg',
  'mpeg',
  'm2ts',
  'ts',
  '3gp',
  'mxf',
  'rm',
  'rmvb',
])

/** Cloudflare recommends tus for files larger than 200 MB. */
export const TUS_UPLOAD_THRESHOLD_BYTES = 200 * 1024 * 1024

export const LARGE_FILE_WARNING_BYTES = 200 * 1024 * 1024

export function getFileExtension(fileName: string): string {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? (parts.pop() ?? '') : ''
}

export function isAllowedVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  return ALLOWED_VIDEO_EXTENSIONS.has(getFileExtension(file.name))
}

export function getRealMediaWarning(file: File): string | null {
  const ext = getFileExtension(file.name)
  if (ext === 'rm' || ext === 'rmvb') {
    return 'This is an older RealMedia format. Cloudflare may not process it directly. If it fails, re-encode as MP4 H.264/AAC.'
  }
  return null
}

export function validateVideoFileForUpload(file: File): {
  ok: boolean
  error?: string
  warning?: string
} {
  if (!file) {
    return { ok: false, error: 'Choose a video file to upload.' }
  }

  if (!isAllowedVideoFile(file)) {
    return {
      ok: false,
      error:
        'Unsupported file type. Choose a common video format (MP4, MOV, WebM, MKV, AVI, and others).',
    }
  }

  const warnings: string[] = []
  const realMediaWarning = getRealMediaWarning(file)
  if (realMediaWarning) warnings.push(realMediaWarning)

  if (file.size > LARGE_FILE_WARNING_BYTES) {
    warnings.push(
      `This file is ${formatBytes(file.size)}. Uploads over 200 MB use resumable upload and may take longer.`,
    )
  }

  return {
    ok: true,
    warning: warnings.length > 0 ? warnings.join(' ') : undefined,
  }
}

export function shouldUseTusUpload(file: File): boolean {
  return file.size > TUS_UPLOAD_THRESHOLD_BYTES
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function uploadWithFormPost(
  file: File,
  uploadURL: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadURL)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed due to a network error'))
    xhr.send(formData)
  })
}

function uploadWithTus(
  file: File,
  uploadURL: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl: uploadURL,
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: file.name,
        filetype: file.type || 'application/octet-stream',
      },
      onError: (error) => {
        reject(error instanceof Error ? error : new Error('Resumable upload failed'))
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal > 0) {
          onProgress(Math.round((bytesUploaded / bytesTotal) * 100))
        }
      },
      onSuccess: () => resolve(),
    })

    upload.start()
  })
}

export async function uploadFileToCloudflareStream(
  file: File,
  uploadURL: string,
  options: {
    onProgress: (percent: number) => void
    onResumable?: () => void
    preferTus?: boolean
  },
): Promise<'direct' | 'tus'> {
  const useTusFirst = options.preferTus ?? shouldUseTusUpload(file)

  if (useTusFirst) {
    options.onResumable?.()
    await uploadWithTus(file, uploadURL, options.onProgress)
    return 'tus'
  }

  try {
    await uploadWithFormPost(file, uploadURL, options.onProgress)
    return 'direct'
  } catch (directError) {
    options.onResumable?.()
    try {
      await uploadWithTus(file, uploadURL, options.onProgress)
      return 'tus'
    } catch {
      throw directError instanceof Error ? directError : new Error('Upload failed')
    }
  }
}
