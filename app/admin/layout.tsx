import { requireAdmin } from '@/lib/auth/guards'
import { AdminShell } from '@/components/layouts/dashboard-shell'
import type { SiteSettings } from '@/lib/types/database'

async function loadSettings(supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase']) {
  const { data } = await supabase.from('site_settings').select('key,value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await requireAdmin()
  const [settings, ticketsRes] = await Promise.all([
    loadSettings(supabase),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ])
  return (
    <AdminShell profile={profile} settings={settings} openTicketCount={ticketsRes.count ?? 0}>
      {children}
    </AdminShell>
  )
}
