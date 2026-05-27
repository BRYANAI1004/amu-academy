import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  createStreamDirectUpload,
  deleteStreamVideo,
  getStreamVideoStatus,
  type CloudflareConfigError,
  isCloudflareConfigError,
  requireCloudflareEnv,
} from './cloudflare'
import { isSupabaseConfigError, type Env } from './env'
import {
  isCategoryInUseError,
  isCategorySlugConflictError,
} from './categoryErrors'
import { isCoverUploadError } from './courseCover'
import {
  adminCreateCategory,
  adminCreateCourse,
  adminCreateLesson,
  adminDeleteCategory,
  adminDeleteCourse,
  adminDeleteCourseCover,
  adminDeleteLesson,
  adminFindLessonById,
  adminGetLessons,
  adminListCategories,
  adminListCourses,
  adminReorderLessons,
  adminUpdateCategory,
  adminUpdateCourse,
  adminClearLessonVideo,
  adminUpdateLesson,
  adminUpdateLessonVideo,
  adminUploadCourseCover,
  getCoursePublic,
  getLessons,
  listActiveCategories,
  listCourses,
} from './store'
import type {
  CategoryInput,
  CourseInput,
  DirectVideoUploadInput,
  LessonInput,
  LessonReorderInput,
  LessonVideoInput,
} from './types'

const demoUser = {
  id: 'demo-user',
  name: 'AMU Learner',
  email: 'demo@amu.edu',
  role: 'learner' as const,
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'https://academy.wanpanel.ai',
    ],
  }),
)

function cloudflareConfigErrorResponse(error: CloudflareConfigError) {
  return {
    error: 'Cloudflare Stream is not configured.',
    code: error.code,
    missingKeys: error.missingKeys,
  }
}

app.use('/api/*', async (c, next) => {
  try {
    await next()
  } catch (error) {
    if (isSupabaseConfigError(error)) {
      return c.json(
        {
          error: error.message,
          code: error.code,
        },
        503,
      )
    }

    if (isCloudflareConfigError(error)) {
      return c.json(cloudflareConfigErrorResponse(error), 503)
    }

    console.error(error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.onError((error, c) => {
  if (isSupabaseConfigError(error)) {
    return c.json(
      {
        error: error.message,
        code: error.code,
      },
      503,
    )
  }

  if (isCloudflareConfigError(error)) {
    return c.json(cloudflareConfigErrorResponse(error), 503)
  }

  console.error(error)
  return c.json({ error: 'Internal server error' }, 500)
})

app.get('/', (c) => {
  return c.json({
    service: 'AMU Academy API',
    status: 'ok',
  })
})

app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'amu-academy-backend',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/debug/env', (c) => {
  const env = c.env

  const supabaseMissing = []
  if (!env.SUPABASE_URL) supabaseMissing.push('SUPABASE_URL')
  if (!env.SUPABASE_SERVICE_ROLE_KEY) supabaseMissing.push('SUPABASE_SERVICE_ROLE_KEY')

  const cloudflareMissing = []
  if (!env.CLOUDFLARE_ACCOUNT_ID) cloudflareMissing.push('CLOUDFLARE_ACCOUNT_ID')
  if (!env.CLOUDFLARE_STREAM_API_TOKEN) cloudflareMissing.push('CLOUDFLARE_STREAM_API_TOKEN')

  return c.json({
    supabase: {
      configured: supabaseMissing.length === 0,
      hasUrl: Boolean(env.SUPABASE_URL),
      hasServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      missingKeys: supabaseMissing,
    },
    cloudflareStream: {
      configured: cloudflareMissing.length === 0,
      hasAccountId: Boolean(env.CLOUDFLARE_ACCOUNT_ID),
      hasApiToken: Boolean(env.CLOUDFLARE_STREAM_API_TOKEN),
      missingKeys: cloudflareMissing,
    },
  })
})

app.get('/api/categories', async (c) => {
  return c.json({ categories: await listActiveCategories(c.env) })
})

app.get('/api/admin/categories', async (c) => {
  return c.json({ categories: await adminListCategories(c.env) })
})

app.post('/api/admin/categories', async (c) => {
  const body = (await c.req.json()) as CategoryInput
  if (!body.name?.trim()) {
    return c.json({ error: 'Missing required field: name' }, 400)
  }

  try {
    const category = await adminCreateCategory(c.env, body)
    return c.json({ category }, 201)
  } catch (error) {
    if (isCategorySlugConflictError(error)) {
      return c.json({ error: error.message, code: error.code }, 409)
    }
    throw error
  }
})

app.patch('/api/admin/categories/:categoryId', async (c) => {
  const body = (await c.req.json()) as Partial<CategoryInput>

  try {
    const category = await adminUpdateCategory(c.env, c.req.param('categoryId'), body)
    if (!category) {
      return c.json({ error: 'Category not found' }, 404)
    }
    return c.json({ category })
  } catch (error) {
    if (isCategorySlugConflictError(error)) {
      return c.json({ error: error.message, code: error.code }, 409)
    }
    throw error
  }
})

app.delete('/api/admin/categories/:categoryId', async (c) => {
  try {
    const ok = await adminDeleteCategory(c.env, c.req.param('categoryId'))
    if (!ok) {
      return c.json({ error: 'Category not found' }, 404)
    }
    return c.json({ ok: true })
  } catch (error) {
    if (isCategoryInUseError(error)) {
      return c.json({ error: error.message, code: error.code }, 409)
    }
    throw error
  }
})

app.get('/api/courses', async (c) => {
  return c.json({ courses: await listCourses(c.env) })
})

app.get('/api/courses/:courseId', async (c) => {
  const course = await getCoursePublic(c.env, c.req.param('courseId'))
  if (!course) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ course })
})

app.get('/api/courses/:courseId/lessons', async (c) => {
  const courseRef = c.req.param('courseId')
  const course = await getCoursePublic(c.env, courseRef)
  if (!course) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ lessons: await getLessons(c.env, courseRef) })
})

app.get('/api/admin/courses', async (c) => {
  return c.json({ courses: await adminListCourses(c.env) })
})

app.post('/api/admin/courses', async (c) => {
  const body = (await c.req.json()) as CourseInput
  if (!body.title || !body.category || body.price === undefined || !body.status) {
    return c.json({ error: 'Missing required fields: title, category, price, status' }, 400)
  }
  const course = await adminCreateCourse(c.env, body)
  return c.json({ course }, 201)
})

app.patch('/api/admin/courses/:courseId', async (c) => {
  const body = (await c.req.json()) as Partial<CourseInput>
  const course = await adminUpdateCourse(c.env, c.req.param('courseId'), body)
  if (!course) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ course })
})

app.delete('/api/admin/courses/:courseId', async (c) => {
  const ok = await adminDeleteCourse(c.env, c.req.param('courseId'))
  if (!ok) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ ok: true })
})

app.post('/api/admin/courses/:courseId/cover', async (c) => {
  const body = await c.req.parseBody()
  const fileField = body.file

  if (!fileField || typeof fileField === 'string') {
    return c.json({ error: 'Cover image file is required.', code: 'COVER_FILE_REQUIRED' }, 400)
  }

  const file = fileField as File

  try {
    const course = await adminUploadCourseCover(c.env, c.req.param('courseId'), {
      bytes: await file.arrayBuffer(),
      contentType: file.type || 'application/octet-stream',
      fileName: file.name || 'cover',
      size: file.size,
    })

    if (!course) {
      return c.json({ error: 'Course not found' }, 404)
    }

    return c.json({ course })
  } catch (error) {
    if (isCoverUploadError(error)) {
      return c.json({ error: error.message, code: error.code }, 400)
    }
    throw error
  }
})

app.delete('/api/admin/courses/:courseId/cover', async (c) => {
  const course = await adminDeleteCourseCover(c.env, c.req.param('courseId'))
  if (!course) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ course })
})

app.get('/api/admin/courses/:courseId/lessons', async (c) => {
  const lessons = await adminGetLessons(c.env, c.req.param('courseId'))
  if (lessons === undefined) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ lessons })
})

app.post('/api/admin/courses/:courseId/lessons', async (c) => {
  const body = (await c.req.json()) as LessonInput
  if (!body.title || !body.duration || body.sortOrder === undefined) {
    return c.json({ error: 'Missing required fields: title, duration, sortOrder' }, 400)
  }
  const lesson = await adminCreateLesson(c.env, c.req.param('courseId'), body)
  if (!lesson) {
    return c.json({ error: 'Course not found' }, 404)
  }
  return c.json({ lesson }, 201)
})

app.patch('/api/admin/courses/:courseId/lessons/reorder', async (c) => {
  const body = (await c.req.json()) as LessonReorderInput
  if (!Array.isArray(body.lessonIds) || body.lessonIds.length === 0) {
    return c.json({ error: 'Missing required field: lessonIds' }, 400)
  }

  try {
    const lessons = await adminReorderLessons(c.env, c.req.param('courseId'), body.lessonIds)
    if (!lessons) {
      return c.json({ error: 'Course not found' }, 404)
    }
    return c.json({ lessons })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder lessons'
    return c.json({ error: message }, 400)
  }
})

app.patch('/api/admin/lessons/:lessonId', async (c) => {
  const body = (await c.req.json()) as Partial<LessonInput>
  const lesson = await adminUpdateLesson(c.env, c.req.param('lessonId'), body)
  if (!lesson) {
    return c.json({ error: 'Lesson not found' }, 404)
  }
  return c.json({ lesson })
})

app.delete('/api/admin/lessons/:lessonId', async (c) => {
  const ok = await adminDeleteLesson(c.env, c.req.param('lessonId'))
  if (!ok) {
    return c.json({ error: 'Lesson not found' }, 404)
  }
  return c.json({ ok: true })
})

async function handleCreateVideoUpload(c: { env: Env; req: { json: () => Promise<DirectVideoUploadInput> } }) {
  const body = await c.req.json()
  if (!body.lessonId || !body.fileName) {
    return { error: 'Missing required fields: lessonId, fileName', status: 400 as const }
  }

  const lesson = await adminFindLessonById(c.env, body.lessonId)
  if (!lesson) {
    return { error: 'Lesson not found', status: 404 as const }
  }

  requireCloudflareEnv(c.env)

  const result = await createStreamDirectUpload(c.env, {
    lessonId: body.lessonId,
    fileName: body.fileName,
    maxDurationSeconds: body.maxDurationSeconds ?? 7200,
  })

  return { result, status: 200 as const }
}

app.post('/api/admin/videos/direct-upload', async (c) => {
  try {
    const outcome = await handleCreateVideoUpload(c)
    if ('error' in outcome) {
      return c.json({ error: outcome.error }, outcome.status)
    }
    return c.json(outcome.result)
  } catch (error) {
    if (isCloudflareConfigError(error)) {
      return c.json(cloudflareConfigErrorResponse(error), 503)
    }
    const message = error instanceof Error ? error.message : 'Failed to create direct upload'
    return c.json({ error: message }, 502)
  }
})

app.post('/api/admin/videos/tus-upload', async (c) => {
  try {
    const outcome = await handleCreateVideoUpload(c)
    if ('error' in outcome) {
      return c.json({ error: outcome.error }, outcome.status)
    }
    return c.json({ ...outcome.result, uploadMethod: 'tus' as const })
  } catch (error) {
    if (isCloudflareConfigError(error)) {
      return c.json(cloudflareConfigErrorResponse(error), 503)
    }
    const message = error instanceof Error ? error.message : 'Failed to create resumable upload'
    return c.json({ error: message }, 502)
  }
})

app.get('/api/admin/videos/:uid/status', async (c) => {
  const uid = c.req.param('uid')
  if (!uid) {
    return c.json({ error: 'Missing video uid' }, 400)
  }

  requireCloudflareEnv(c.env)

  try {
    const status = await getStreamVideoStatus(c.env, uid)
    return c.json(status)
  } catch (error) {
    if (isCloudflareConfigError(error)) {
      return c.json(cloudflareConfigErrorResponse(error), 503)
    }
    const message = error instanceof Error ? error.message : 'Failed to fetch video status'
    return c.json({ error: message }, 502)
  }
})

app.delete('/api/admin/videos/:uid', async (c) => {
  const uid = c.req.param('uid')
  if (!uid) {
    return c.json({ error: 'Missing video uid' }, 400)
  }

  requireCloudflareEnv(c.env)

  try {
    await deleteStreamVideo(c.env, uid)
    return c.json({ ok: true, uid })
  } catch (error) {
    if (isCloudflareConfigError(error)) {
      return c.json(cloudflareConfigErrorResponse(error), 503)
    }
    const message = error instanceof Error ? error.message : 'Failed to delete video'
    return c.json({ error: message }, 502)
  }
})

app.delete('/api/admin/lessons/:lessonId/video', async (c) => {
  const lessonId = c.req.param('lessonId')
  const lesson = await adminFindLessonById(c.env, lessonId)
  if (!lesson) {
    return c.json({ error: 'Lesson not found' }, 404)
  }

  if (lesson.videoUid) {
    requireCloudflareEnv(c.env)

    try {
      await deleteStreamVideo(c.env, lesson.videoUid)
    } catch (error) {
      if (isCloudflareConfigError(error)) {
        return c.json(cloudflareConfigErrorResponse(error), 503)
      }
      const message = error instanceof Error ? error.message : 'Failed to delete video from Cloudflare Stream'
      return c.json({ error: message }, 502)
    }
  }

  const updatedLesson = await adminClearLessonVideo(c.env, lessonId)
  if (!updatedLesson) {
    return c.json({ error: 'Lesson not found' }, 404)
  }

  return c.json({ lesson: updatedLesson })
})

app.patch('/api/admin/lessons/:lessonId/video', async (c) => {
  const body = (await c.req.json()) as LessonVideoInput
  if (!body.videoProvider || !body.videoUid || !body.videoStatus) {
    return c.json(
      { error: 'Missing required fields: videoProvider, videoUid, videoStatus' },
      400,
    )
  }

  const lesson = await adminUpdateLessonVideo(c.env, c.req.param('lessonId'), body)
  if (!lesson) {
    return c.json({ error: 'Lesson not found' }, 404)
  }
  return c.json({ lesson })
})

app.get('/api/me', (c) => {
  return c.json(demoUser)
})

app.post('/api/demo-login', (c) => {
  return c.json({
    ok: true,
    user: demoUser,
  })
})

export default app
