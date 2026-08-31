import { AdminDashboardView } from '@/components/admin/admin-views'
import { fetchAdminDashboardData } from '@/lib/data/server-dashboard'
import { requireAdmin } from '@/lib/auth/guards'

export default async function Page() {
  await requireAdmin()
  const initialData = await fetchAdminDashboardData()
  return <AdminDashboardView initialData={initialData} />
}
