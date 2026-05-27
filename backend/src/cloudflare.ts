import type { Env } from './env'

export class CloudflareConfigError extends Error {
  readonly code = 'CLOUDFLARE_STREAM_NOT_CONFIGURED'

  constructor(public readonly missingKeys: string[]) {
    super(`Cloudflare Stream is not configured. Missing: ${missingKeys.join(', ')}`)
    this.name = 'CloudflareConfigError'
  }
}

export function isCloudflareConfigError(error: unknown): error is CloudflareConfigError {
  return (
    error instanceof CloudflareConfigError ||
    (error instanceof Error &&
      error.name === 'CloudflareConfigError' &&
      'missingKeys' in error &&
      Array.isArray((error as CloudflareConfigError).missingKeys))
  )
}

export function requireCloudflareEnv(env: Env) {
  const missingKeys: string[] = []

  if (!env.CLOUDFLARE_ACCOUNT_ID?.trim()) missingKeys.push('CLOUDFLARE_ACCOUNT_ID')
  if (!env.CLOUDFLARE_STREAM_API_TOKEN?.trim()) missingKeys.push('CLOUDFLARE_STREAM_API_TOKEN')

  if (missingKeys.length > 0) {
    throw new CloudflareConfigError(missingKeys)
  }

  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID!.trim(),
    apiToken: env.CLOUDFLARE_STREAM_API_TOKEN!.trim(),
  }
}

export interface DirectUploadInput {
  lessonId: string
  fileName: string
  maxDurationSeconds: number
}

export interface DirectUploadResult {
  uploadURL: string
  uid: string
  uploadMethod: 'direct' | 'tus'
}

export interface StreamVideoStatus {
  uid: string
  readyToStream: boolean
  statusState:
    | 'pendingupload'
    | 'downloading'
    | 'queued'
    | 'inprogress'
    | 'ready'
    | 'error'
  requireSignedURLs: boolean
  duration: number | null
  thumbnail: string | null
  preview: string | null
  pctComplete: number | null
}

interface CloudflareDirectUploadResponse {
  success: boolean
  result?: {
    uploadURL: string
    uid: string
  }
  errors?: Array<{ message: string }>
}

export async function createStreamDirectUpload(
  env: Env,
  input: DirectUploadInput,
): Promise<DirectUploadResult> {
  const { accountId, apiToken } = requireCloudflareEnv(env)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: input.maxDurationSeconds,
        requireSignedURLs: false,
        meta: {
          lessonId: input.lessonId,
          fileName: input.fileName,
        },
      }),
    },
  )

  const data = (await response.json()) as CloudflareDirectUploadResponse

  if (!response.ok || !data.success || !data.result?.uploadURL || !data.result?.uid) {
    const message =
      data.errors?.map((e) => e.message).join('; ') ||
      `Cloudflare Stream direct upload failed (${response.status})`
    throw new Error(message)
  }

  return {
    uploadURL: data.result.uploadURL,
    uid: data.result.uid,
    uploadMethod: 'tus',
  }
}

interface CloudflareStreamVideoResponse {
  success: boolean
  result?: {
    uid: string
    readyToStream?: boolean
    requireSignedURLs?: boolean
    duration?: number
    thumbnail?: string
    preview?: string
    status?: {
      state?: string
      pctComplete?: string | number
    }
  }
  errors?: Array<{ message: string }>
}

function asStreamStatusState(state: string | undefined): StreamVideoStatus['statusState'] {
  switch (state) {
    case 'pendingupload':
    case 'downloading':
    case 'queued':
    case 'inprogress':
    case 'ready':
    case 'error':
      return state
    default:
      return 'queued'
  }
}

interface CloudflareDeleteResponse {
  success: boolean
  errors?: Array<{ message: string }>
}

export async function deleteStreamVideo(env: Env, uid: string): Promise<void> {
  const { accountId, apiToken } = requireCloudflareEnv(env)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )

  if (response.status === 404) {
    return
  }

  const data = (await response.json()) as CloudflareDeleteResponse

  if (!response.ok || !data.success) {
    const message =
      data.errors?.map((e) => e.message).join('; ') ||
      `Cloudflare Stream delete failed (${response.status})`
    throw new Error(message)
  }
}

export async function getStreamVideoStatus(env: Env, uid: string): Promise<StreamVideoStatus> {
  const { accountId, apiToken } = requireCloudflareEnv(env)

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  )

  const data = (await response.json()) as CloudflareStreamVideoResponse

  if (!response.ok || !data.success || !data.result?.uid) {
    const message =
      data.errors?.map((e) => e.message).join('; ') ||
      `Cloudflare Stream status lookup failed (${response.status})`
    throw new Error(message)
  }

  const result = data.result
  const rawPct = result.status?.pctComplete
  const pctComplete =
    rawPct === undefined || rawPct === null || rawPct === ''
      ? null
      : Math.min(100, Math.max(0, Number.parseFloat(String(rawPct))))

  return {
    uid: result.uid,
    readyToStream: Boolean(result.readyToStream),
    statusState: asStreamStatusState(result.status?.state),
    requireSignedURLs: Boolean(result.requireSignedURLs),
    duration: typeof result.duration === 'number' ? result.duration : null,
    thumbnail: result.thumbnail ?? null,
    preview: result.preview ?? null,
    pctComplete: Number.isFinite(pctComplete) ? pctComplete : null,
  }
}
