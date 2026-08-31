'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel, Pill, ProgressTrack } from '@/components/ui/academy-ui'
import { DEFAULT_PAGES } from '@/lib/defaults/cms-defaults'
import type { ActivityEvent, Course, PageContent, Profile, SiteSettings, SupportTicket, Testimonial } from '@/lib/types/database'
import { formatRelativeDate, tierLabel } from '@/lib/utils/site'
import { formatDateTime } from '@/lib/utils/datetime'

import type { AdminDashboardData } from '@/lib/data/server-dashboard'

export function AdminDashboardView({ initialData }: { initialData?: AdminDashboardData }) {
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

  const { data, loading, error } = useRealtimeQuery('activity_events', fetcher, [], initialData)
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load admin dashboard.'} />

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
            <span className="mono muted text-xs">{formatDateTime(ev.created_at)}</span>
          </div>
        ))}
      </Panel>
    </div>
  )
}

export function AdminCoursesView({ initialCourses }: { initialCourses?: Course[] }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('courses').select('*').order('sort_order')
    return (data ?? []) as Course[]
  }, [])
  const { data, loading, error } = useRealtimeQuery('courses', fetcher, [], initialCourses)
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load courses.'} />

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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [passing, setPassing] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<number | null>(null)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)

  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,title').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const { data: modules } = await client.from('modules').select('*').eq('course_id', course.id).order('sort_order')
    const mod = modules?.[0]
    if (!mod) return { course, modules: modules ?? [], module: null, questions: [], options: [], settings: null }
    const [{ data: questions }, { data: options }, { data: settings }] = await Promise.all([
      client.from('quiz_questions').select('*').eq('module_id', mod.id).order('sort_order'),
      client.from('quiz_options').select('*'),
      client.from('module_quiz_settings').select('*').eq('module_id', mod.id).maybeSingle(),
    ])
    return { course, modules: modules ?? [], module: mod, questions: questions ?? [], options: options ?? [], settings }
  }, [courseSlug])

  const { data, loading, reload } = useRealtimeQuery('module_quiz_settings', fetcher, [courseSlug])

  const activeModuleId = selectedModuleId ?? data?.module?.id ?? null

  const moduleFetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    if (!activeModuleId || !data?.course) return null
    const [{ data: questions }, { data: options }, { data: settings }, { data: mod }] = await Promise.all([
      client.from('quiz_questions').select('*').eq('module_id', activeModuleId).order('sort_order'),
      client.from('quiz_options').select('*'),
      client.from('module_quiz_settings').select('*').eq('module_id', activeModuleId).maybeSingle(),
      client.from('modules').select('*').eq('id', activeModuleId).maybeSingle(),
    ])
    return { questions: questions ?? [], options: options ?? [], settings, module: mod }
  }, [activeModuleId, data?.course])

  const { data: moduleData, reload: reloadModule } = useRealtimeQuery('quiz_questions', moduleFetcher, [activeModuleId])

  if (loading) return <LoadingState />
  if (!data?.course) return <div className="content-pad">Course not found.</div>
  if (!data.modules.length) return <div className="content-pad">No modules found.</div>

  const mod = moduleData?.module ?? data.module
  const questions = moduleData?.questions ?? data.questions
  const settings = moduleData?.settings ?? data.settings

  const saveSettings = async () => {
    if (!mod) return
    const score = passing ?? settings?.passing_score ?? 70
    const allowed = attempts ?? settings?.attempts_allowed ?? 3
    const mins = timeLimitMinutes ?? (settings?.time_limit_seconds ? Math.round(settings.time_limit_seconds / 60) : null)
    const time_limit_seconds = mins && mins > 0 ? mins * 60 : null
    await createClient().from('module_quiz_settings').upsert({
      module_id: mod.id,
      passing_score: score,
      attempts_allowed: allowed,
      time_limit_seconds,
      question_order: settings?.question_order ?? 'sequential',
    })
    setPassing(null)
    setAttempts(null)
    setTimeLimitMinutes(null)
    reload()
    reloadModule()
  }

  const currentTimeMins = timeLimitMinutes ?? (settings?.time_limit_seconds ? Math.round(settings.time_limit_seconds / 60) : 0)

  return (
    <div className="content-pad max-w-2xl">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <Eyebrow>Quiz & examination settings</Eyebrow>
        <Btn size="sm" onClick={saveSettings}>Save settings</Btn>
      </div>

      <Panel className="mt-6 space-y-4 p-6">
        <div className="input-group">
          <label>Module</label>
          <select
            className="input"
            value={activeModuleId ?? ''}
            onChange={(e) => setSelectedModuleId(e.target.value)}
          >
            {data.modules.map((m: { id: string; title: string }) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
        <div className="input-group">
          <label>Passing score (%)</label>
          <input className="input" type="number" min={1} max={100} defaultValue={settings?.passing_score ?? 70} onChange={(e) => setPassing(Number(e.target.value))} />
        </div>
        <div className="input-group">
          <label>Attempts allowed</label>
          <input className="input" type="number" min={1} max={10} defaultValue={settings?.attempts_allowed ?? 3} onChange={(e) => setAttempts(Number(e.target.value))} />
        </div>
        <div className="input-group">
          <label>Time limit (minutes)</label>
          <input className="input" type="number" min={0} placeholder="0 = no timer" defaultValue={currentTimeMins || ''} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
          <p className="muted mt-1 text-xs">Students see a server-synced countdown. At zero the quiz auto-submits.</p>
        </div>
      </Panel>

      <Eyebrow className="mt-8 mb-4">Questions ({questions.length})</Eyebrow>
      <div className="space-y-3">
        {questions.map((q: { id: string; question: string }, i: number) => (
          <Panel key={q.id} className="p-4">
            <p className="mono muted mb-2 text-xs">Question {i + 1}</p>
            <p className="text-sm">{q.question}</p>
          </Panel>
        ))}
        {!questions.length && <p className="muted text-sm">No questions for this module yet.</p>}
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
                <p className="mono muted mt-2 text-[11px]">{formatDateTime(t.created_at)}</p>
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

export function AdminPagesView() {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('page_contents').select('*').order('slug')
    return (data?.length ? data : Object.values(DEFAULT_PAGES)) as PageContent[]
  }, [])
  const { data, loading } = useRealtimeQuery('page_contents', fetcher, [])
  if (loading) return <LoadingState />

  return (
    <div className="content-pad">
      <Eyebrow>CMS pages</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Site pages</h1>
      <p className="muted mt-2 max-w-xl text-sm">Every page ships with default trading-industry copy and hero images. Edit any page below — changes sync live.</p>
      <div className="mt-8 space-y-3">
        {(data ?? []).map((page) => (
          <Panel key={page.slug} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="font-semibold">{page.title}</p>
              <p className="mono muted text-xs">/{page.slug}</p>
            </div>
            <Btn variant="ghost" size="sm" href={`/admin/pages/${page.slug}`}>Edit page</Btn>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminPageEditor({ slug }: { slug: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('page_contents').select('*').eq('slug', slug).maybeSingle()
    return (data ?? DEFAULT_PAGES[slug] ?? null) as PageContent | null
  }, [slug])

  const { data: page, loading, reload } = useRealtimeQuery('page_contents', fetcher, [slug])
  const [draft, setDraft] = useState<Partial<PageContent>>({})

  if (loading) return <LoadingState />
  if (!page) return <div className="content-pad">Page not found.</div>

  const current = { ...page, ...draft }

  const save = async () => {
    const client = createClient()
    const payload = {
      slug,
      title: current.title,
      eyebrow: current.eyebrow,
      description: current.description,
      hero_image_url: current.hero_image_url,
      sections: current.sections,
      primary_cta_label: current.primary_cta_label,
      primary_cta_href: current.primary_cta_href,
    }
    if ('id' in page && page.id) {
      await client.from('page_contents').update(payload).eq('slug', slug)
    } else {
      await client.from('page_contents').upsert(payload, { onConflict: 'slug' })
    }
    setDraft({})
    reload()
  }

  return (
    <div className="content-pad max-w-3xl">
      <Link href="/admin/pages" className="mono muted text-xs hover:text-yellow">← All pages</Link>
      <div className="topbar mt-4 px-0">
        <Eyebrow>Editing /{slug}</Eyebrow>
        <Btn size="sm" onClick={save}>Save page</Btn>
      </div>

      {current.hero_image_url && (
        <Panel className="mt-6 overflow-hidden p-0">
          <img src={current.hero_image_url} alt="Hero preview" className="h-48 w-full object-cover" />
        </Panel>
      )}

      <Panel className="mt-6 space-y-4 p-6">
        <div className="input-group"><label>Title</label><input className="input" value={current.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
        <div className="input-group"><label>Eyebrow</label><input className="input" value={current.eyebrow ?? ''} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} /></div>
        <div className="input-group"><label>Description</label><textarea className="input min-h-[100px]" value={current.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
        <div className="input-group"><label>Hero image URL</label><input className="input" value={current.hero_image_url ?? ''} onChange={(e) => setDraft({ ...draft, hero_image_url: e.target.value })} placeholder="https://images.unsplash.com/..." /></div>
      </Panel>

      <Eyebrow className="mt-8 mb-4">Sections</Eyebrow>
      {(current.sections ?? []).map((section, i) => (
        <Panel key={`${section.heading}-${i}`} className="mb-4 space-y-3 p-5">
          <div className="input-group"><label>Heading</label><input className="input" value={section.heading} onChange={(e) => {
            const sections = [...(current.sections ?? [])]
            sections[i] = { ...sections[i], heading: e.target.value }
            setDraft({ ...draft, sections })
          }} /></div>
          <div className="input-group"><label>Body</label><textarea className="input min-h-[80px]" value={section.body} onChange={(e) => {
            const sections = [...(current.sections ?? [])]
            sections[i] = { ...sections[i], body: e.target.value }
            setDraft({ ...draft, sections })
          }} /></div>
        </Panel>
      ))}
    </div>
  )
}

export function AdminSettingsView({ initialSettings }: { initialSettings?: SiteSettings }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('site_settings').select('key,value')
    return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value])) as SiteSettings
  }, [])
  const { data: settings, loading, error, reload } = useRealtimeQuery('site_settings', fetcher, [], initialSettings)
  const [draft, setDraft] = useState<Record<string, unknown>>({})

  if (loading && !settings) return <LoadingState error={error} />
  if (!settings) return <LoadingState error={error ?? 'Unable to load settings.'} />

  const hp = { ...settings?.homepage, ...(draft.homepage as object) }
  const branding = { ...settings?.branding, ...(draft.branding as object) }
  const footer = { ...settings?.footer, ...(draft.footer as object) }
  const support = {
    ...settings?.support,
    ...(draft.support as object),
    email: (draft.support as { email?: string } | undefined)?.email ?? footer.email ?? settings?.support?.email,
    whatsapp: (draft.support as { whatsapp?: string } | undefined)?.whatsapp ?? footer.whatsapp ?? settings?.support?.whatsapp,
  }

  const save = async () => {
    const client = createClient()
    const syncedFooter = { ...footer, email: support.email ?? footer.email, whatsapp: support.whatsapp ?? footer.whatsapp }
    await client.from('site_settings').upsert({ key: 'homepage', value: hp })
    await client.from('site_settings').upsert({ key: 'branding', value: branding })
    await client.from('site_settings').upsert({ key: 'footer', value: syncedFooter })
    await client.from('site_settings').upsert({ key: 'support', value: support })
    if (draft.images) await client.from('site_settings').upsert({ key: 'images', value: draft.images })
    setDraft({})
    reload()
  }

  const updateCourseImage = async (courseId: string, image_url: string) => {
    await createClient().from('courses').update({ image_url }).eq('id', courseId)
    reload()
  }

  const updateTestimonialImage = async (id: string, image_url: string) => {
    await createClient().from('testimonials').update({ image_url }).eq('id', id)
    reload()
  }

  return (
    <div className="content-pad max-w-3xl">
      <Eyebrow>Academy settings</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Branding, images & copy</h1>
      <p className="muted mt-2 text-sm">Replace any image URL with your own asset or upload to Vercel Blob and paste the link.</p>

      <Panel className="mt-8 space-y-4 p-6">
        <Eyebrow>Branding</Eyebrow>
        <div className="input-group"><label>Academy name</label><input className="input" defaultValue={branding.companyName} onChange={(e) => setDraft({ ...draft, branding: { ...branding, companyName: e.target.value } })} /></div>
        <div className="input-group"><label>Logo icon URL</label><input className="input" defaultValue={branding.logoIconPathname ?? branding.logoPathname} onChange={(e) => setDraft({ ...draft, branding: { ...branding, logoIconPathname: e.target.value, logoPathname: e.target.value } })} placeholder="/brand/logo-icon.svg" /></div>
        <div className="input-group"><label>Logo banner URL (optional wordmark)</label><input className="input" defaultValue={branding.logoBannerPathname} onChange={(e) => setDraft({ ...draft, branding: { ...branding, logoBannerPathname: e.target.value } })} placeholder="/brand/logo-banner.jpg" /></div>
        {(branding.logoIconPathname ?? branding.logoPathname) && <img src={branding.logoIconPathname ?? branding.logoPathname} alt="Logo icon preview" className="size-12 object-contain" />}
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Homepage</Eyebrow>
        <div className="input-group"><label>Hero headline</label><input className="input" defaultValue={hp.headline} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, headline: e.target.value } })} /></div>
        <div className="input-group"><label>Hero description</label><textarea className="input min-h-[100px]" defaultValue={hp.description} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, description: e.target.value } })} /></div>
        <div className="input-group"><label>Hero image URL</label><input className="input" defaultValue={hp.heroImageUrl} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, heroImageUrl: e.target.value } })} /></div>
        <div className="input-group"><label>CTA band image URL</label><input className="input" defaultValue={hp.ctaImageUrl} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, ctaImageUrl: e.target.value } })} /></div>
        {hp.heroImageUrl && <img src={hp.heroImageUrl} alt="Hero preview" className="h-40 w-full object-cover" />}
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Footer & support</Eyebrow>
        <div className="input-group"><label>Footer description</label><textarea className="input" defaultValue={footer.description} onChange={(e) => setDraft({ ...draft, footer: { ...footer, description: e.target.value } })} /></div>
        <div className="input-group"><label>Support email</label><input className="input" defaultValue={support.email ?? footer.email} onChange={(e) => setDraft({ ...draft, support: { ...support, email: e.target.value }, footer: { ...footer, email: e.target.value } })} /></div>
        <div className="input-group"><label>Support WhatsApp number</label><input className="input" defaultValue={support.whatsapp ?? footer.whatsapp} onChange={(e) => setDraft({ ...draft, support: { ...support, whatsapp: e.target.value }, footer: { ...footer, whatsapp: e.target.value } })} placeholder="447757464428" /></div>
        <div className="input-group"><label>WhatsApp button label</label><input className="input" defaultValue={support.whatsappLabel ?? 'WhatsApp the desk'} onChange={(e) => setDraft({ ...draft, support: { ...support, whatsappLabel: e.target.value } })} /></div>
        <p className="muted text-xs">This number powers the floating WhatsApp button on the homepage and student dashboard. Connect the WhatsApp Business API under Integrations for automated onboarding alerts.</p>
      </Panel>

      <CourseImageEditor onSave={updateCourseImage} />
      <TestimonialImageEditor onSave={updateTestimonialImage} />

      <Btn onClick={save} className="mt-8">Save all settings</Btn>
    </div>
  )
}

function CourseImageEditor({ onSave }: { onSave: (id: string, url: string) => void }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('courses').select('id,title,slug,image_url').order('sort_order')
    return data ?? []
  }, [])
  const { data, loading } = useRealtimeQuery('courses', fetcher, [])
  if (loading) return null

  return (
    <Panel className="mt-6 space-y-4 p-6">
      <Eyebrow>Course card images</Eyebrow>
      {(data ?? []).map((c: { id: string; title: string; image_url?: string }) => (
        <div key={c.id} className="flex flex-wrap items-center gap-4 border-b border-[var(--border-soft)] pb-4 last:border-0">
          {c.image_url && <img src={c.image_url} alt={c.title} className="size-16 object-cover" />}
          <div className="min-w-[140px] flex-1 text-sm font-medium">{c.title}</div>
          <input className="input max-w-md flex-1" defaultValue={c.image_url ?? ''} onBlur={(e) => onSave(c.id, e.target.value)} placeholder="Image URL" />
        </div>
      ))}
    </Panel>
  )
}

function TestimonialImageEditor({ onSave }: { onSave: (id: string, url: string) => void }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('testimonials').select('id,author_name,image_url').order('sort_order')
    return (data ?? []) as Testimonial[]
  }, [])
  const { data, loading } = useRealtimeQuery('testimonials', fetcher, [])
  if (loading) return null

  return (
    <Panel className="mt-6 space-y-4 p-6">
      <Eyebrow>Testimonial avatars</Eyebrow>
      {(data ?? []).map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-4 border-b border-[var(--border-soft)] pb-4 last:border-0">
          {t.image_url && <img src={t.image_url} alt={t.author_name} className="size-10 rounded-full object-cover" />}
          <div className="min-w-[100px] flex-1 text-sm">{t.author_name}</div>
          <input className="input max-w-md flex-1" defaultValue={t.image_url ?? ''} onBlur={(e) => onSave(t.id, e.target.value)} placeholder="Avatar URL" />
        </div>
      ))}
    </Panel>
  )
}
