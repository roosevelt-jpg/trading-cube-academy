import { StudentCoursesList } from '@/components/student/student-dashboard'
import { requireStudent } from '@/lib/auth/guards'

export default async function Page() {
  const { profile } = await requireStudent()
  return <StudentCoursesList profile={profile} />
}
