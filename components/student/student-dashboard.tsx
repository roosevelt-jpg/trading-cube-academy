'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { fetchStudentDashboardData } from '@/lib/data/student-dashboard-fetch'
import { Btn, Eyebrow, LoadingState, Panel, Pill, ProgressTrack } from '@/components/ui/academy-ui'
import type { Course, Enrollment, Profile } from '@/lib/types/database'
import { formatDateTime } from '@/lib/utils/datetime'
import type { StudentDashboardData } from '@/lib/data/server-dashboard'

export function StudentDashboard({ profile, initialData }: { profile: Profile; initialData?: StudentDashboardData }) {
  const fetcher = useMemo(
    () => (client: ReturnType<typeof createClient>) => fetchStudentDashboardData(client, profile.id),
    [profile.id],
  )
  const { data, loading, error } = useRealtimeQuery('enrollments', fetcher, [profile.id], initialData)

  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load dashboard.'} />

  return (
    <div className="content-pad">
      {data.resume && (
        <Panel className="mb-8 p-6" style={{ borderColor: 'var(--yellow)' }}>
          <Eyebrow className="mb-2">Continue learning</Eyebrow>
          <h2 className="h2 mb-1.5 text-xl">
            {data.resume.course.title} — {data.resume.module.title}
          </h2>
          <p className="muted mb-4 text-sm">{data.resume.title}</p>
          <Btn size="sm" href={data.resume.href}>
            {data.resume.kind === 'quiz' ? 'Resume Quiz →' : 'Resume Lesson →'}
          </Btn>
        </Panel>
      )}

      <div className="mb-8 grid gap-5 md:grid-cols-3">
        <Panel className="p-5">
          <p className="mono muted text-[11px]">COURSES ENROLLED</p>
          <p className="h1 mono mt-2 text-3xl text-yellow">{data.enrollments.length}</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">MODULES COMPLETED</p>
          <p className="h1 mono mt-2 text-3xl">{data.modulesCompleted}</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">AVG QUIZ SCORE</p>
          <p className="h1 mono mt-2 text-3xl text-green">{data.avgQuizScore}%</p>
        </Panel>
      </div>

      <Eyebrow className="mb-4">Course progress</Eyebrow>
      <div className="mb-10 space-y-4">
        {data.enrollments.map((e) => (
          <Panel key={e.course_id} className="p-5">
            <div className="mb-2 flex justify-between text-sm">
              <Link href={`/student/courses/${e.course.slug}`} className="font-semibold hover:text-yellow">
                {e.course.title}
              </Link>
              <span className="mono muted">{e.progress_pct}%</span>
            </div>
            <ProgressTrack value={e.progress_pct} green={e.progress_pct === 100} />
          </Panel>
        ))}
      </div>

      <Eyebrow className="mb-4">Recent activity</Eyebrow>
      <Panel className="divide-y divide-[var(--border-soft)]">
        {data.activity.length === 0 ? (
          <p className="muted px-5 py-4 text-sm">No activity yet — start a lesson to see your progress here.</p>
        ) : (
          data.activity.map((ev) => (
            <div key={ev.id} className="flex justify-between px-5 py-4 text-sm">
              <span>{ev.title}</span>
              <span className="mono muted text-xs">{formatDateTime(ev.created_at)}</span>
            </div>
          ))
        )}
      </Panel>
    </div>
  )
}

export function StudentCoursesList({
  profile,
  initialCourses,
}: {
  profile: Profile
  initialCourses?: (Course & { progress_pct: number })[]
}) {
  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const [{ data: enrollments }, { data: courses }] = await Promise.all([
        client.from('enrollments').select('*').eq('user_id', profile.id),
        client.from('courses').select('*').eq('published', true).order('sort_order'),
      ])
      const prog = Object.fromEntries(((enrollments ?? []) as Enrollment[]).map((e) => [e.course_id, e.progress_pct]))
      return ((courses ?? []) as Course[])
        .filter((c) => prog[c.id] !== undefined)
        .map((c) => ({ ...c, progress_pct: prog[c.id] ?? 0 }))
    },
    [profile.id],
  )

  const { data, loading, error } = useRealtimeQuery('courses', fetcher, [profile.id], initialCourses)
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load courses.'} />

  return (
    <div className="content-pad">
      <Eyebrow>My Courses</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Your learning path</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {(data ?? []).map((course) => (
          <Link key={course.id} href={`/student/courses/${course.slug}`}>
            <Panel className="course-card overflow-hidden p-0 transition-colors hover:border-yellow">
              {course.image_url && (
                <div className="h-32 w-full overflow-hidden">
                  <img src={course.image_url} alt={course.title} className="size-full object-cover" />
                </div>
              )}
              <div className="flex items-center justify-between gap-4 p-6">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="muted mt-1 text-sm">{course.description}</p>
                </div>
                <Pill tone={course.progress_pct === 100 ? 'green' : 'yellow'}>
                  {course.progress_pct === 100 ? 'Completed' : `${course.progress_pct}%`}
                </Pill>
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  )
}
