import { StudentLessonView } from '@/components/student/student-views'
import { requireStudent } from '@/lib/auth/guards'
import type { SiteSettings } from '@/lib/types/database'

export default async function Page({ params }: { params: Promise<{ courseSlug: string; lessonSlug: string }> }) {
  const { supabase, profile } = await requireStudent()
  const { courseSlug, lessonSlug } = await params
  const { data } = await supabase.from('site_settings').select('key,value')
  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
  return <StudentLessonView profile={profile} courseSlug={courseSlug} lessonSlug={lessonSlug} settings={settings} />
}
