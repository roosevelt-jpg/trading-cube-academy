import { StudentProfileView } from '@/components/student/student-views'
import { requireStudent } from '@/lib/auth/guards'

export default async function Page() {
  const { profile } = await requireStudent()
  return <StudentProfileView profile={profile} />
}
