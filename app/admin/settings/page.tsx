import { AdminSettingsView } from '@/components/admin/admin-views'
import { fetchSiteSettingsMap } from '@/lib/data/server-dashboard'
import { requireAdmin } from '@/lib/auth/guards'

export default async function Page() {
  await requireAdmin()
  const initialSettings = await fetchSiteSettingsMap()
  return <AdminSettingsView initialSettings={initialSettings} />
}
