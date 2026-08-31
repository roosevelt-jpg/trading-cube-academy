import type { SupabaseClient } from '@supabase/supabase-js'
import { findResumeLesson } from '@/lib/progress/sync-course-progress'
import type { ActivityEvent, Course, Enrollment } from '@/lib/types/database'

export type StudentDashboardResume = {
  kind: 'lesson' | 'quiz'
  title: string
  course: { slug: string; title: string }
  module: { slug: string; title: string }
  href: string
}

export type StudentDashboardData = {
  enrollments: (Enrollment & { course: Course })[]
  resume: StudentDashboardResume | null
  activity: ActivityEvent[]
  modulesCompleted: number
  avgQuizScore: number
}

export async function fetchStudentDashboardData(
  client: SupabaseClient,
  userId: string,
): Promise<StudentDashboardData> {
  const [enrollmentsRes, activityRes, coursesRes, moduleProgressRes, quizAttemptsRes, resumeRaw] =
    await Promise.all([
      client.from('enrollments').select('*').eq('user_id', userId),
      client
        .from('activity_events')
        .select('*')
        .contains('meta', { user_id: userId })
        .order('created_at', { ascending: false })
        .limit(10),
      client.from('courses').select('*').order('sort_order'),
      client
        .from('module_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true),
      client
        .from('quiz_attempts')
        .select('score, status')
        .eq('user_id', userId)
        .neq('status', 'in_progress'),
      findResumeLesson(client, userId),
    ])

  const courses = (coursesRes.data ?? []) as Course[]
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]))
  const enrollments = ((enrollmentsRes.data ?? []) as Enrollment[])
    .map((e) => ({ ...e, course: courseMap[e.course_id] }))
    .filter((e) => e.course)

  const completedAttempts = (quizAttemptsRes.data ?? []).filter(
    (a) => a.status === 'completed' || a.status === 'timed_out' || !a.status,
  )
  const avgQuizScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / completedAttempts.length)
    : 0

  let resume: StudentDashboardResume | null = null
  if (resumeRaw) {
    const { course, module, lesson, kind } = resumeRaw
    resume = {
      kind,
      title: kind === 'quiz' ? `${module.title} · Quiz` : lesson.title,
      course: { slug: course.slug, title: course.title },
      module: { slug: module.slug, title: module.title },
      href:
        kind === 'quiz'
          ? `/student/courses/${course.slug}/modules/${module.slug}/quiz`
          : `/student/courses/${course.slug}/lessons/${lesson.slug}`,
    }
  }

  return {
    enrollments,
    resume,
    activity: (activityRes.data ?? []) as ActivityEvent[],
    modulesCompleted: moduleProgressRes.count ?? 0,
    avgQuizScore,
  }
}
