import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import LearnPage from './pages/LearnPage'
import CourseCatalogPage from './pages/CourseCatalogPage'
import CourseDetailPage from './pages/CourseDetailPage'
import AdminLayout from './components/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminCourseNewPage from './pages/admin/AdminCourseNewPage'
import AdminCourseEditPage from './pages/admin/AdminCourseEditPage'
import AdminCourseLessonsPage from './pages/admin/AdminCourseLessonsPage'
import AdminLessonEditPage from './pages/admin/AdminLessonEditPage'
import { DEFAULT_LEARN_COURSE_ID } from './data/courses'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/courses" element={<CourseCatalogPage />} />
      <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      <Route path="/learn" element={<Navigate to={`/learn/${DEFAULT_LEARN_COURSE_ID}`} replace />} />
      <Route path="/learn/:courseId" element={<LearnPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="courses/new" element={<AdminCourseNewPage />} />
        <Route path="courses/:courseId/edit" element={<AdminCourseEditPage />} />
        <Route path="courses/:courseId/lessons" element={<AdminCourseLessonsPage />} />
        <Route path="lessons/:lessonId/edit" element={<AdminLessonEditPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  )
}
