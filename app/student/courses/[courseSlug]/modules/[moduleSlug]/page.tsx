import { StudentModuleView } from '@/components/student/student-views'
import { requireStudent } from '@/lib/auth/guards'
import type { SiteSettings } from '@/lib/types/database'

export default async function Page({ params }: { params: Promise<{ courseSlug: string; moduleSlug: string }> }) {
  const { supabase, profile } = await requireStudent()
  const { courseSlug, moduleSlug } = await params
  const { data } = await supabase.from('site_settings').select('key,value')
  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
  return <StudentModuleView profile={profile} courseSlug={courseSlug} moduleSlug={moduleSlug} settings={settings} />
}
