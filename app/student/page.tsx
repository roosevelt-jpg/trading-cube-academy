import { StudentDashboard } from '@/components/student/student-dashboard'
import { fetchStudentDashboardData } from '@/lib/data/server-dashboard'
import { requireStudent } from '@/lib/auth/guards'

export default async function Page() {
  const { profile } = await requireStudent()
  const initialData = await fetchStudentDashboardData(profile.id)
  return <StudentDashboard profile={profile} initialData={initialData} />
}
