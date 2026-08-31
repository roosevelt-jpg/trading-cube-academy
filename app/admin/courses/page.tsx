import { AdminCoursesView } from '@/components/admin/admin-views'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/guards'
import type { Course } from '@/lib/types/database'

export default async function Page() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from('courses').select('*').order('sort_order')
  return <AdminCoursesView initialCourses={(data ?? []) as Course[]} />
}
