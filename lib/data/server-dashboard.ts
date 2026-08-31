import { createClient } from '@/lib/supabase/server'
import { fetchAdminDashboardData as fetchAdminDashboardShared } from '@/lib/data/admin-dashboard-fetch'
import { fetchStudentDashboardData as fetchStudentDashboardShared } from '@/lib/data/student-dashboard-fetch'
import type { ActivityEvent, Course, Profile, SiteSettings } from '@/lib/types/database'

export async function fetchSiteSettingsMap(): Promise<SiteSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key,value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
}

export async function fetchStudentDashboardData(userId: string) {
  const supabase = await createClient()
  return fetchStudentDashboardShared(supabase, userId)
}

export async function fetchAdminDashboardData() {
  const supabase = await createClient()
  return fetchAdminDashboardShared(supabase)
}

export type StudentDashboardData = Awaited<ReturnType<typeof fetchStudentDashboardData>>
export type AdminDashboardData = Awaited<ReturnType<typeof fetchAdminDashboardData>>

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return (data as Profile | null) ?? null
}
