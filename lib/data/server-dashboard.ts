import { createClient } from '@/lib/supabase/server'
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
  const [{ data: courses }, { data: students }, { data: tickets }, { data: activity }] = await Promise.all([
    supabase.from('courses').select('*').order('sort_order'),
    supabase.from('profiles').select('*').eq('role', 'student'),
    supabase.from('support_tickets').select('*').eq('status', 'open'),
    supabase.from('activity_events').select('*').order('created_at', { ascending: false }).limit(10),
  ])
  return {
    courses: (courses ?? []) as Course[],
    studentCount: (students ?? []).length,
    openTickets: (tickets ?? []).length,
    activity: (activity ?? []) as ActivityEvent[],
  }
}

export type StudentDashboardData = Awaited<ReturnType<typeof fetchStudentDashboardData>>
export type AdminDashboardData = Awaited<ReturnType<typeof fetchAdminDashboardData>>

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  return (data as Profile | null) ?? null
}
