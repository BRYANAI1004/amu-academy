import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { isSupabaseConfigError, type Env } from './env'
import {
  adminCreateCourse,
  adminCreateLesson,
  adminDeleteCourse,
  adminDeleteLesson,
  adminGetLessons,
  adminListCourses,
  adminUpdateCourse,
  adminUpdateLesson,
  getCategories,
  getCoursePublic,
  getLessons,
  listCourses,
} from './store'
import type { CourseInput, LessonInput } from './types'

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

app.get('/api/categories', async (c) => {
  const names = await getCategories(c.env)
  return c.json({
    categories: names.map((name) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
    })),
  })
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
