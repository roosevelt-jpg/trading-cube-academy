import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityEvent, Course } from '@/lib/types/database'

export type AdminDashboardData = {
  courses: Course[]
  studentCount: number
  studentGrowthPct: number
  coursesLive: number
  coursesDraft: number
  avgCompletion: number
  avgQuizScore: number
  quizPassRate: number
  openTickets: number
  courseCompletion: { courseId: string; title: string; slug: string; avgProgress: number }[]
  activity: ActivityEvent[]
}

export async function fetchAdminDashboardData(client: SupabaseClient): Promise<AdminDashboardData> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    coursesRes,
    studentsRes,
    studentsThisMonthRes,
    studentsPrevMonthRes,
    ticketsRes,
    activityRes,
    enrollmentsRes,
    attemptsRes,
  ] = await Promise.all([
    client.from('courses').select('*').order('sort_order'),
    client.from('profiles').select('id').eq('role', 'student'),
    client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .gte('created_at', monthStart),
    client
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .gte('created_at', prevMonthStart)
      .lt('created_at', monthStart),
    client.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    client.from('activity_events').select('*').order('created_at', { ascending: false }).limit(10),
    client.from('enrollments').select('course_id, progress_pct'),
    client
      .from('quiz_attempts')
      .select('score, passed, status')
      .neq('status', 'in_progress'),
  ])

  const courses = (coursesRes.data ?? []) as Course[]
  const studentCount = studentsRes.data?.length ?? 0
  const thisMonth = studentsThisMonthRes.count ?? 0
  const prevMonth = studentsPrevMonthRes.count ?? 0
  const studentGrowthPct =
    prevMonth === 0 ? (thisMonth > 0 ? 100 : 0) : Math.round(((thisMonth - prevMonth) / prevMonth) * 100)

  const enrollments = enrollmentsRes.data ?? []
  const avgCompletion = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress_pct ?? 0), 0) / enrollments.length)
    : 0

  const completedAttempts = (attemptsRes.data ?? []).filter(
    (a) => a.status === 'completed' || a.status === 'timed_out' || !a.status,
  )
  const avgQuizScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / completedAttempts.length)
    : 0
  const passedCount = completedAttempts.filter((a) => a.passed).length
  const quizPassRate = completedAttempts.length
    ? Math.round((passedCount / completedAttempts.length) * 100)
    : 0

  const progressByCourse = enrollments.reduce<Record<string, { sum: number; count: number }>>((acc, e) => {
    if (!acc[e.course_id]) acc[e.course_id] = { sum: 0, count: 0 }
    acc[e.course_id].sum += e.progress_pct ?? 0
    acc[e.course_id].count += 1
    return acc
  }, {})

  const courseCompletion = courses.map((c) => ({
    courseId: c.id,
    title: c.title,
    slug: c.slug,
    avgProgress: progressByCourse[c.id]
      ? Math.round(progressByCourse[c.id].sum / progressByCourse[c.id].count)
      : 0,
  }))

  return {
    courses,
    studentCount,
    studentGrowthPct,
    coursesLive: courses.filter((c) => c.status === 'live').length,
    coursesDraft: courses.filter((c) => c.status !== 'live').length,
    avgCompletion,
    avgQuizScore,
    quizPassRate,
    openTickets: ticketsRes.count ?? 0,
    courseCompletion,
    activity: (activityRes.data ?? []) as ActivityEvent[],
  }
}
