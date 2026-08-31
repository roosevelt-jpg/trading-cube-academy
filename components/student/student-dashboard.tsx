'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel, Pill, ProgressTrack } from '@/components/ui/academy-ui'
import type { ActivityEvent, Course, Enrollment, Lesson, LessonProgress, Profile } from '@/lib/types/database'
import { formatDateTime } from '@/lib/utils/datetime'

type DashboardData = {
  enrollments: (Enrollment & { course: Course })[]
  resume: { lesson: Lesson; course: Course; moduleTitle: string } | null
  activity: ActivityEvent[]
  lessonProgress: LessonProgress[]
}

async function fetchStudentDashboard(client: ReturnType<typeof createClient>, userId: string): Promise<DashboardData> {
  const [enrollmentsRes, activityRes, progressRes, coursesRes] = await Promise.all([
    client.from('enrollments').select('*').eq('user_id', userId),
    client.from('activity_events').select('*').order('created_at', { ascending: false }).limit(8),
    client.from('lesson_progress').select('*').eq('user_id', userId),
    client.from('courses').select('*').order('sort_order'),
  ])

  const courses = (coursesRes.data ?? []) as Course[]
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c]))
  const enrollments = ((enrollmentsRes.data ?? []) as Enrollment[]).map((e) => ({ ...e, course: courseMap[e.course_id] })).filter((e) => e.course)

  // Find in-progress lesson (first incomplete with progress)
  const progress = (progressRes.data ?? []) as LessonProgress[]
  const incomplete = progress.find((p) => !p.completed && p.progress_pct > 0)
  let resume: DashboardData['resume'] = null
  if (incomplete) {
    const { data: lesson } = await client.from('lessons').select('*, modules(title, courses(*))').eq('id', incomplete.lesson_id).maybeSingle()
    if (lesson) {
      const mod = (lesson as any).modules
      resume = { lesson: lesson as Lesson, course: mod?.courses as Course, moduleTitle: mod?.title ?? '' }
    }
  }

  return {
    enrollments,
    resume,
    activity: (activityRes.data ?? []) as ActivityEvent[],
    lessonProgress: progress,
  }
}

import type { StudentDashboardData } from '@/lib/data/server-dashboard'

export function StudentDashboard({ profile, initialData }: { profile: Profile; initialData?: StudentDashboardData }) {
  const fetcher = useMemo(() => (client: ReturnType<typeof createClient>) => fetchStudentDashboard(client, profile.id), [profile.id])
  const { data, loading, error } = useRealtimeQuery('enrollments', fetcher, [profile.id], initialData)

  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load dashboard.'} />

  return (
    <div className="content-pad">
      {data.resume && (
        <Panel className="mb-8 p-6" style={{ borderColor: 'var(--yellow)' }}>
          <Eyebrow className="mb-2">Continue learning</Eyebrow>
          <h2 className="h2 mb-1.5 text-xl">{data.resume.course.title} — {data.resume.moduleTitle}</h2>
          <p className="muted mb-4 text-sm">{data.resume.lesson.title}</p>
          <Btn size="sm" href={`/student/courses/${data.resume.course.slug}/lessons/${data.resume.lesson.slug}`}>Resume Lesson →</Btn>
        </Panel>
      )}

      <div className="mb-8 grid gap-5 md:grid-cols-3">
        <Panel className="p-5"><p className="mono muted text-[11px]">COURSES ENROLLED</p><p className="h1 mono mt-2 text-3xl text-yellow">{data.enrollments.length}</p></Panel>
        <Panel className="p-5"><p className="mono muted text-[11px]">LESSONS COMPLETED</p><p className="h1 mono mt-2 text-3xl">{data.lessonProgress.filter((p) => p.completed).length}</p></Panel>
        <Panel className="p-5"><p className="mono muted text-[11px]">AVG PROGRESS</p><p className="h1 mono mt-2 text-3xl text-green">{data.enrollments.length ? Math.round(data.enrollments.reduce((a, e) => a + e.progress_pct, 0) / data.enrollments.length) : 0}%</p></Panel>
      </div>

      <Eyebrow className="mb-4">Course progress</Eyebrow>
      <div className="mb-10 space-y-4">
        {data.enrollments.map((e) => (
          <Panel key={e.course_id} className="p-5">
            <div className="mb-2 flex justify-between text-sm">
              <Link href={`/student/courses/${e.course.slug}`} className="font-semibold hover:text-yellow">{e.course.title}</Link>
              <span className="mono muted">{e.progress_pct}%</span>
            </div>
            <ProgressTrack value={e.progress_pct} green={e.progress_pct === 100} />
          </Panel>
        ))}
      </div>

      <Eyebrow className="mb-4">Recent activity</Eyebrow>
      <Panel className="divide-y divide-[var(--border-soft)]">
        {data.activity.map((ev) => (
          <div key={ev.id} className="flex justify-between px-5 py-4 text-sm">
            <span>{ev.title}</span>
            <span className="mono muted text-xs">{formatDateTime(ev.created_at)}</span>
          </div>
        ))}
      </Panel>
    </div>
  )
}

export function StudentCoursesList({ profile }: { profile: Profile }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const [{ data: enrollments }, { data: courses }] = await Promise.all([
      client.from('enrollments').select('*').eq('user_id', profile.id),
      client.from('courses').select('*').eq('published', true).order('sort_order'),
    ])
    const prog = Object.fromEntries(((enrollments ?? []) as Enrollment[]).map((e) => [e.course_id, e.progress_pct]))
    return ((courses ?? []) as Course[]).filter((c) => prog[c.id] !== undefined).map((c) => ({ ...c, progress_pct: prog[c.id] ?? 0 }))
  }, [profile.id])

  const { data, loading, error } = useRealtimeQuery('courses', fetcher, [profile.id])
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load courses.'} />

  return (
    <div className="content-pad">
      <Eyebrow>My Courses</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Your learning path</h1>
      <div className="mt-8 space-y-4">
        {(data ?? []).map((course) => (
          <Link key={course.id} href={`/student/courses/${course.slug}`}>
            <Panel className="p-6 transition-colors hover:border-yellow">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="muted mt-1 text-sm">{course.description}</p>
                </div>
                <Pill tone={course.progress_pct === 100 ? 'green' : 'yellow'}>{course.progress_pct === 100 ? 'Completed' : `${course.progress_pct}%`}</Pill>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  )
}
