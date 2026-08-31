import { requireStudent } from '@/lib/auth/guards'
import { StudentShell } from '@/components/layouts/dashboard-shell'
import type { SiteSettings } from '@/lib/types/database'

async function loadSettings(supabase: Awaited<ReturnType<typeof requireStudent>>['supabase']) {
  const { data } = await supabase.from('site_settings').select('key,value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireStudent()
  const settings = await loadSettings(supabase)
  return <StudentShell profile={profile} settings={settings}>{children}</StudentShell>
}
