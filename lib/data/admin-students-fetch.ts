import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'

export type AdminStudentRow = Profile & {
  avgProgress: number | null
  avgQuizScore: number | null
  lastActiveLabel: string
}

export async function fetchAdminStudents(client: SupabaseClient): Promise<AdminStudentRow[]> {
  const [{ data: profiles }, { data: enrollments }, { data: attempts }] = await Promise.all([
    client.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
    client.from('enrollments').select('user_id, progress_pct'),
    client
      .from('quiz_attempts')
      .select('user_id, score, status')
      .neq('status', 'in_progress'),
  ])

  const progressByUser = (enrollments ?? []).reduce<Record<string, number[]>>((acc, e) => {
    acc[e.user_id] = [...(acc[e.user_id] ?? []), e.progress_pct ?? 0]
    return acc
  }, {})

  const scoresByUser = (attempts ?? []).reduce<Record<string, number[]>>((acc, a) => {
    if (a.status === 'in_progress') return acc
    acc[a.user_id] = [...(acc[a.user_id] ?? []), a.score ?? 0]
    return acc
  }, {})

  return ((profiles ?? []) as Profile[]).map((p) => {
    const progresses = progressByUser[p.id] ?? []
    const scores = scoresByUser[p.id] ?? []
    return {
      ...p,
      avgProgress: progresses.length
        ? Math.round(progresses.reduce((s, v) => s + v, 0) / progresses.length)
        : null,
      avgQuizScore: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
      lastActiveLabel: formatLastActive(p.last_active_at),
    }
  })
}

function formatLastActive(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export type AdminStudentDetail = {
  profile: Profile
  enrollments: { course_id: string; progress_pct: number; courses?: { title?: string; slug?: string } }[]
  quizAttempts: {
    id: string
    score: number
    passed: boolean
    attempt_number: number
    completed_at?: string | null
    modules?: { title?: string; courses?: { title?: string } }
  }[]
  modulesCompleted: number
  avgQuizScore: number
  coursesEnrolled: number
}

export async function fetchAdminStudentDetail(
  client: SupabaseClient,
  studentId: string,
): Promise<AdminStudentDetail | null> {
  const { data: profile } = await client.from('profiles').select('*').eq('id', studentId).maybeSingle()
  if (!profile) return null

  const [{ data: enrollments }, { data: attempts }, moduleProgressRes] = await Promise.all([
    client.from('enrollments').select('*, courses(title,slug)').eq('user_id', studentId),
    client
      .from('quiz_attempts')
      .select('*, modules(title, courses(title))')
      .eq('user_id', studentId)
      .neq('status', 'in_progress')
      .order('completed_at', { ascending: false }),
    client
      .from('module_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', studentId)
      .eq('completed', true),
  ])

  const completedAttempts = (attempts ?? []).filter(
    (a) => a.status === 'completed' || a.status === 'timed_out' || !a.status,
  )
  const avgQuizScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / completedAttempts.length)
    : 0

  return {
    profile: profile as Profile,
    enrollments: enrollments ?? [],
    quizAttempts: completedAttempts,
    modulesCompleted: moduleProgressRes.count ?? 0,
    avgQuizScore,
    coursesEnrolled: (enrollments ?? []).length,
  }
}
