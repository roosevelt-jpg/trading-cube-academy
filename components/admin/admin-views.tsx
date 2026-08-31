'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel, Pill, ProgressTrack } from '@/components/ui/academy-ui'
import type { ActivityEvent, Course, Profile, SiteSettings, SupportTicket } from '@/lib/types/database'
import { formatRelativeDate, tierLabel } from '@/lib/utils/site'

export function AdminDashboardView() {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const [{ data: courses }, { data: students }, { data: tickets }, { data: activity }] = await Promise.all([
      client.from('courses').select('*').order('sort_order'),
      client.from('profiles').select('*').eq('role', 'student'),
      client.from('support_tickets').select('*').eq('status', 'open'),
      client.from('activity_events').select('*').order('created_at', { ascending: false }).limit(10),
    ])
    return {
      courses: (courses ?? []) as Course[],
      studentCount: (students ?? []).length,
      openTickets: (tickets ?? []).length,
      activity: (activity ?? []) as ActivityEvent[],
    }
  }, [])

  const { data, loading } = useRealtimeQuery('activity_events', fetcher, [])
  if (loading) return <LoadingState />

  return (
    <div className="content-pad">
      <Eyebrow>Platform overview</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Admin control center</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <Panel className="p-5"><p className="mono muted text-[11px]">STUDENTS</p><p className="h1 mono mt-2 text-3xl text-yellow">{data?.studentCount ?? 0}</p></Panel>
        <Panel className="p-5"><p className="mono muted text-[11px]">COURSES LIVE</p><p className="h1 mono mt-2 text-3xl">{data?.courses.filter((c) => c.status === 'live').length ?? 0}</p></Panel>
        <Panel className="p-5"><p className="mono muted text-[11px]">OPEN TICKETS</p><p className="h1 mono mt-2 text-3xl">{data?.openTickets ?? 0}</p></Panel>
        <Panel className="p-5"><p className="mono muted text-[11px]">TOTAL ENROLLED</p><p className="h1 mono mt-2 text-3xl text-green">{data?.courses.reduce((a, c) => a + c.enrolled_count, 0) ?? 0}</p></Panel>
      </div>

      <Eyebrow className="mt-10 mb-4">Recent activity</Eyebrow>
      <Panel>
        {(data?.activity ?? []).map((ev) => (
          <div key={ev.id} className="flex justify-between border-b border-[var(--border-soft)] px-5 py-4 text-sm last:border-0">
            <span>{ev.title}</span>
            <span className="mono muted">{formatRelativeDate(ev.created_at)}</span>
          </div>
        ))}
      </Panel>
    </div>
  )
}

export function AdminCoursesView() {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('courses').select('*').order('sort_order')
    return (data ?? []) as Course[]
  }, [])
  const { data, loading } = useRealtimeQuery('courses', fetcher, [])
  if (loading) return <LoadingState />

  return (
    <div className="content-pad">
      <Eyebrow>Course management</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Courses</h1>
      <div className="mt-8 space-y-4">
        {(data ?? []).map((course) => (
          <Panel key={course.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{course.title}</p>
                  <Pill tone={course.status === 'live' ? 'green' : undefined}>{course.status === 'live' ? 'Live' : 'Draft'}</Pill>
                  <span className="pill">{tierLabel(course.tier)}</span>
                </div>
                <p className="muted mt-2 text-sm">{course.module_count} modules · {course.enrolled_count} enrolled</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}`}>Manage</Btn>
                <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}/content`}>Edit Content</Btn>
                <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}/videos`}>Manage Video</Btn>
                <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}/quiz`}>Quizzes</Btn>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminCourseDetailView({ courseSlug }: { courseSlug: string }) {
  const [title, setTitle] = useState('')
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('*').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const { data: modules } = await client.from('modules').select('*').eq('course_id', course.id).order('sort_order')
    return { course: course as Course, modules: modules ?? [] }
  }, [courseSlug])

  const { data, loading, reload } = useRealtimeQuery('modules', fetcher, [courseSlug])
  if (loading) return <LoadingState />
  if (!data) return null

  const saveCourse = async () => {
    const client = createClient()
    await client.from('courses').update({ title: title || data.course.title, updated_at: new Date().toISOString() }).eq('id', data.course.id)
    reload()
  }

  return (
    <div className="content-pad">
      <Link href="/admin/courses" className="mono muted text-xs hover:text-yellow">← All courses</Link>
      <Eyebrow className="mt-4 mb-2">Editing — {data.course.title} · Modules</Eyebrow>
      <div className="mb-6 flex gap-3">
        <input className="input max-w-md" defaultValue={data.course.title} onChange={(e) => setTitle(e.target.value)} />
        <Btn size="sm" onClick={saveCourse}>Save course</Btn>
      </div>
      <div className="space-y-3">
        {data.modules.map((mod: any, i: number) => (
          <Panel key={mod.id} className="flex items-center gap-4 p-4">
            <span className="mono muted cursor-grab">⠿</span>
            <span className="flex-1 text-[13.5px]">{String(i + 1).padStart(2, '0')} · {mod.title}</span>
            <Pill>{mod.lesson_count} lessons</Pill>
            <Btn variant="ghost" size="sm" href={`/admin/courses/${courseSlug}/modules/${mod.slug}/content`}>Edit</Btn>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminContentEditor({ courseSlug, moduleSlug }: { courseSlug: string; moduleSlug?: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,title,slug').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    let mod = null
    let lessons: any[] = []
    if (moduleSlug) {
      const { data: m } = await client.from('modules').select('*').eq('course_id', course.id).eq('slug', moduleSlug).maybeSingle()
      mod = m
      if (m) {
        const { data: ls } = await client.from('lessons').select('*').eq('module_id', m.id).order('sort_order')
        lessons = ls ?? []
      }
    } else {
      const { data: mods } = await client.from('modules').select('*').eq('course_id', course.id).order('sort_order')
      return { course, modules: mods ?? [], lessons: [] }
    }
    return { course, module: mod, lessons }
  }, [courseSlug, moduleSlug])

  const { data, loading, reload } = useRealtimeQuery('lessons', fetcher, [courseSlug, moduleSlug])
  const [editing, setEditing] = useState<any>(null)
  const [body, setBody] = useState('')

  if (loading) return <LoadingState />
  if (!data) return null

  const saveLesson = async () => {
    if (!editing) return
    const client = createClient()
    const content = editing.lesson_type === 'reading'
      ? { paragraphs: body.split('\n\n').filter(Boolean), takeaway: editing.content?.takeaway ?? '' }
      : { summary: body }
    await client.from('lessons').update({ title: editing.title, content }).eq('id', editing.id)
    setEditing(null)
    reload()
  }

  return (
    <div className="content-pad max-w-3xl">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <div className="topbar mt-4 px-0">
        <Eyebrow>Content editor</Eyebrow>
        <Btn size="sm" onClick={saveLesson}>Publish Changes</Btn>
      </div>
      {!moduleSlug && (
        <div className="mt-4 space-y-2">
          {(data as any).modules?.map((m: any) => (
            <Link key={m.id} href={`/admin/courses/${courseSlug}/modules/${m.slug}/content`} className="sb-link block">{m.title}</Link>
          ))}
        </div>
      )}
      {moduleSlug && (
        <div className="mt-6 space-y-4">
          {(data as any).lessons.map((l: any) => (
            <Panel key={l.id} className="p-4">
              <button type="button" className="w-full text-left" onClick={() => { setEditing(l); setBody(l.lesson_type === 'reading' ? (l.content?.paragraphs ?? []).join('\n\n') : l.content?.summary ?? '') }}>
                <p className="font-semibold">{l.title}</p>
                <p className="muted text-xs">{l.lesson_type}</p>
              </button>
            </Panel>
          ))}
          {editing && (
            <Panel className="space-y-4 p-6">
              <div className="input-group"><label>Title</label><input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="input-group"><label>Content</label><textarea className="input min-h-[200px]" value={body} onChange={(e) => setBody(e.target.value)} /></div>
              <Btn size="sm" onClick={saveLesson}>Save lesson</Btn>
            </Panel>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminVideoManager({ courseSlug }: { courseSlug: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,title').eq('slug', courseSlug).maybeSingle()
    const { data: videos } = await client.from('youtube_videos').select('*').order('sort_order')
    const { data: lessons } = course ? await client.from('lessons').select('id,title,youtube_video_id,module_id, modules!inner(course_id)').eq('modules.course_id', course.id) : { data: [] }
    return { course, videos: videos ?? [], lessons: lessons ?? [] }
  }, [courseSlug])

  const { data, loading, reload } = useRealtimeQuery('youtube_videos', fetcher, [courseSlug])
  const [videoId, setVideoId] = useState('')
  const [title, setTitle] = useState('')

  if (loading) return <LoadingState />

  const addVideo = async () => {
    const client = createClient()
    await client.from('youtube_videos').insert({ title, video_id: videoId, course_name: data?.course?.title, visibility: 'course', published: true })
    setVideoId('')
    setTitle('')
    reload()
  }

  const updateLessonVideo = async (lessonId: string, yt: string) => {
    await createClient().from('lessons').update({ youtube_video_id: yt }).eq('id', lessonId)
    reload()
  }

  return (
    <div className="content-pad">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data?.course?.title}</Link>
      <Eyebrow className="mt-4 mb-2">Video management</Eyebrow>
      <p className="muted mb-6 text-sm">Unlisted YouTube embeds for course and marketing videos.</p>

      <Panel className="mb-8 space-y-4 p-6">
        <Eyebrow>Add marketing video</Eyebrow>
        <div className="input-group"><label>Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="input-group"><label>YouTube video ID</label><input className="input" value={videoId} onChange={(e) => setVideoId(e.target.value)} placeholder="dQw4w9WgXcQ" /></div>
        <Btn size="sm" onClick={addVideo}>Add video</Btn>
      </Panel>

      <div className="space-y-3">
        {(data?.lessons ?? []).map((l: any) => (
          <Panel key={l.id} className="flex flex-wrap items-center gap-4 p-4">
            <span className="flex-1 text-sm">{l.title}</span>
            <input className="input max-w-xs" defaultValue={l.youtube_video_id ?? ''} onBlur={(e) => updateLessonVideo(l.id, e.target.value)} placeholder="YouTube ID" />
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminQuizBuilder({ courseSlug }: { courseSlug: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,title').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const { data: modules } = await client.from('modules').select('*').eq('course_id', course.id).order('sort_order')
    const mod = modules?.[2] ?? modules?.[0]
    if (!mod) return { course, module: null, questions: [], options: [] }
    const [{ data: questions }, { data: options }, { data: settings }] = await Promise.all([
      client.from('quiz_questions').select('*').eq('module_id', mod.id).order('sort_order'),
      client.from('quiz_options').select('*'),
      client.from('module_quiz_settings').select('*').eq('module_id', mod.id).maybeSingle(),
    ])
    return { course, module: mod, questions: questions ?? [], options: options ?? [], settings }
  }, [courseSlug])

  const { data, loading, reload } = useRealtimeQuery('quiz_questions', fetcher, [courseSlug])
  const [passing, setPassing] = useState<number | null>(null)

  if (loading) return <LoadingState />
  if (!data?.module) return <div className="content-pad">No modules found.</div>

  const saveSettings = async () => {
    const score = passing ?? data.settings?.passing_score ?? 70
    await createClient().from('module_quiz_settings').upsert({ module_id: data.module.id, passing_score: score, attempts_allowed: 3 })
    reload()
  }

  return (
    <div className="content-pad max-w-2xl">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <div className="mt-4 flex items-center justify-between">
        <Eyebrow>Quiz builder · {data.module.title}</Eyebrow>
        <Btn size="sm" onClick={saveSettings}>Save Quiz</Btn>
      </div>
      <Panel className="mt-6 space-y-4 p-6">
        <div className="input-group">
          <label>Passing score (%)</label>
          <input className="input" type="number" defaultValue={data.settings?.passing_score ?? 70} onChange={(e) => setPassing(Number(e.target.value))} />
        </div>
      </Panel>
      <div className="mt-6 space-y-3">
        {data.questions.map((q: any, i: number) => (
          <Panel key={q.id} className="p-4">
            <p className="mono muted mb-2 text-xs">Question {i + 1}</p>
            <p className="text-sm">{q.question}</p>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminStudentsView() {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false })
    return (data ?? []) as Profile[]
  }, [])
  const { data, loading } = useRealtimeQuery('profiles', fetcher, [])
  if (loading) return <LoadingState />

  return (
    <div className="content-pad">
      <Eyebrow>Students</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">All students</h1>
      <div className="mt-8 overflow-x-auto">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id}>
                <td>{s.full_name}</td>
                <td className="mono muted">{s.email}</td>
                <td><Pill tone={s.status === 'active' ? 'green' : undefined}>{s.status}</Pill></td>
                <td><Btn variant="ghost" size="sm" href={`/admin/students/${s.id}`}>View</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminStudentDetailView({ studentId }: { studentId: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: profile } = await client.from('profiles').select('*').eq('id', studentId).maybeSingle()
    const { data: enrollments } = await client.from('enrollments').select('*, courses(title)').eq('user_id', studentId)
    return { profile: profile as Profile | null, enrollments: enrollments ?? [] }
  }, [studentId])

  const { data, loading } = useRealtimeQuery('enrollments', fetcher, [studentId])
  if (loading) return <LoadingState />
  if (!data?.profile) return null

  const suspend = async () => {
    await createClient().from('profiles').update({ status: 'suspended' }).eq('id', studentId)
  }

  return (
    <div className="content-pad">
      <Link href="/admin/students" className="mono muted text-xs">← All Students</Link>
      <div className="topbar mt-4 px-0">
        <div>
          <h1 className="h2 text-xl">{data.profile.full_name}</h1>
          <p className="mono muted text-xs">{data.profile.email}</p>
        </div>
        <Btn variant="danger" size="sm" onClick={suspend}>Suspend</Btn>
      </div>
      <Eyebrow className="mt-6 mb-4">Course progress</Eyebrow>
      <div className="space-y-4">
        {data.enrollments.map((e: any) => (
          <Panel key={e.course_id} className="p-4">
            <div className="mb-2 flex justify-between text-sm"><span>{e.courses?.title}</span><span className="mono muted">{e.progress_pct}%</span></div>
            <ProgressTrack value={e.progress_pct} green={e.progress_pct === 100} />
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminSupportView() {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('support_tickets').select('*').order('created_at', { ascending: false })
    return (data ?? []) as SupportTicket[]
  }, [])
  const { data, loading, reload } = useRealtimeQuery('support_tickets', fetcher, [])

  const close = async (id: string) => {
    await createClient().from('support_tickets').update({ status: 'closed' }).eq('id', id)
    reload()
  }

  if (loading) return <LoadingState />

  return (
    <div className="content-pad">
      <Eyebrow>Support inbox</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Tickets</h1>
      <div className="mt-8 space-y-3">
        {(data ?? []).map((t) => (
          <Panel key={t.id} className="p-5">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-semibold">{t.subject}</p>
                <p className="muted mt-1 text-sm">{t.student_name} · {t.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={t.status === 'open' ? 'yellow' : 'green'}>{t.status}</Pill>
                {t.status === 'open' && <Btn variant="ghost" size="sm" onClick={() => close(t.id)}>Close</Btn>}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminSettingsView() {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('site_settings').select('key,value')
    return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value])) as SiteSettings
  }, [])
  const { data: settings, loading, reload } = useRealtimeQuery('site_settings', fetcher, [])
  const [homepage, setHomepage] = useState<any>(null)

  if (loading) return <LoadingState />
  const hp = homepage ?? settings?.homepage ?? {}

  const save = async () => {
    const client = createClient()
    await client.from('site_settings').upsert({ key: 'homepage', value: { ...settings?.homepage, ...homepage } })
    await client.from('site_settings').upsert({ key: 'support', value: settings?.support })
    reload()
  }

  return (
    <div className="content-pad max-w-2xl">
      <Eyebrow>Academy settings</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Branding & enrollment</h1>
      <Panel className="mt-8 space-y-4 p-6">
        <div className="input-group"><label>Hero headline</label><input className="input" defaultValue={hp.headline} onChange={(e) => setHomepage({ ...hp, headline: e.target.value })} /></div>
        <div className="input-group"><label>Hero description</label><textarea className="input min-h-[100px]" defaultValue={hp.description} onChange={(e) => setHomepage({ ...hp, description: e.target.value })} /></div>
        <div className="input-group"><label>Support Email</label><input className="input" defaultValue={settings?.support?.email ?? settings?.footer?.email} readOnly /></div>
        <Btn onClick={save}>Save settings</Btn>
      </Panel>
    </div>
  )
}
