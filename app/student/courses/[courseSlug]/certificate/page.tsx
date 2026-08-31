import { StudentCertificateView } from '@/components/student/student-views'
import { requireStudent } from '@/lib/auth/guards'

export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { profile } = await requireStudent()
  const { courseSlug } = await params
  return <StudentCertificateView profile={profile} courseSlug={courseSlug} />
}
