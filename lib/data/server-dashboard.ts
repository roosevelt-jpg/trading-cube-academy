import { createClient } from '@/lib/supabase/server'
import type { ActivityEvent, Course, Enrollment, Lesson, LessonProgress, Profile, SiteSettings } from '@/lib/types/database'

export async function fetchSiteSettingsMap(): Promise<SiteSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key,value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
}

export async function fetchStudentDashboardData(userId: string) {
  const supabase = await createClient()
  const [enrollmentsRes, activityRes, progressRes, coursesRes] = await Promise.all([
    supabase.from('enrollments').select('*').eq('user_id', userId),
    supabase.from('activity_events').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('lesson_progress').select('*').eq('user_id', userId),
    supabase.from('courses').select('*').order('sort_order'),
  ])

  const courses = (coursesRes.data ?? []) as Course[]
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]))
  const enrollments = ((enrollmentsRes.data ?? []) as Enrollment[])
    .map((e) => ({ ...e, course: courseMap[e.course_id] }))
    .filter((e) => e.course)

  const progress = (progressRes.data ?? []) as LessonProgress[]
  const incomplete = progress.find((p) => !p.completed && p.progress_pct > 0)
  let resume: { lesson: Lesson; course: Course; moduleTitle: string } | null = null

  if (incomplete) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('*, modules(title, courses(*))')
      .eq('id', incomplete.lesson_id)
      .maybeSingle()
    if (lesson) {
      const mod = (lesson as { modules?: { title?: string; courses?: Course } }).modules
      if (mod?.courses) {
        resume = {
          lesson: lesson as Lesson,
          course: mod.courses as Course,
          moduleTitle: mod.title ?? '',
        }
      }
    }
  }

  return {
    enrollments,
    resume,
    activity: (activityRes.data ?? []) as ActivityEvent[],
    lessonProgress: progress,
  }
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
