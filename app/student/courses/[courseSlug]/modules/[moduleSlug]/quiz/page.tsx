import { StudentQuizView } from '@/components/student/student-views'
import { requireStudent } from '@/lib/auth/guards'

export default async function Page({ params }: { params: Promise<{ courseSlug: string; moduleSlug: string }> }) {
  const { profile } = await requireStudent()
  const { courseSlug, moduleSlug } = await params
  return <StudentQuizView profile={profile} courseSlug={courseSlug} moduleSlug={moduleSlug} />
}
