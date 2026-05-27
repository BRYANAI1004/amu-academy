import { Navigate, useParams } from 'react-router-dom'

export default function AdminCourseLessonsPage() {
  const { courseId = '' } = useParams()
  return <Navigate to={`/admin/courses/${courseId}/edit?tab=lessons`} replace />
}
