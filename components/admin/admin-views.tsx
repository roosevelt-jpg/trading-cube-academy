'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel, Pill, ProgressTrack, Avatar } from '@/components/ui/academy-ui'
import { DEFAULT_PAGES } from '@/lib/defaults/cms-defaults'
import type { Course, PageContent, SiteSettings, SupportTicket, Testimonial } from '@/lib/types/database'
import { formatRelativeDate } from '@/lib/utils/site'
import { formatDateTime } from '@/lib/utils/datetime'
import type { AdminDashboardData } from '@/lib/data/server-dashboard'
import { fetchAdminDashboardData } from '@/lib/data/admin-dashboard-fetch'
import { fetchAdminStudents, fetchAdminStudentDetail, type AdminStudentRow } from '@/lib/data/admin-students-fetch'
import { AdminQuizBuilder } from '@/components/admin/admin-quiz-builder'
import { AdminVideoManager } from '@/components/admin/admin-video-manager'
import { AdminHomepageCmsView } from '@/components/admin/admin-homepage-cms'
import { BlobUploadField } from '@/components/admin/blob-upload-field'
import { ContentEditorToolbar } from '@/components/admin/content-editor-toolbar'

export { AdminQuizBuilder, AdminVideoManager, AdminHomepageCmsView }

export function AdminDashboardView({ initialData }: { initialData?: AdminDashboardData }) {
  const fetcher = useMemo(
    () => (client: ReturnType<typeof createClient>) => fetchAdminDashboardData(client),
    [],
  )

  const { data, loading, error } = useRealtimeQuery('activity_events', fetcher, [], initialData)
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load admin dashboard.'} />

  const growthLabel =
    data.studentGrowthPct > 0
      ? `▲ ${data.studentGrowthPct}% this month`
      : data.studentGrowthPct < 0
        ? `▼ ${Math.abs(data.studentGrowthPct)}% this month`
        : 'No change this month'

  return (
    <div className="content-pad">
      <Eyebrow>Platform overview</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Admin control center</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <Panel className="p-5">
          <p className="mono muted text-[11px]">ACTIVE STUDENTS</p>
          <p className="h1 mono mt-2 text-3xl text-yellow">{data.studentCount}</p>
          <p className={`mono mt-1 text-[11px] ${data.studentGrowthPct >= 0 ? 'text-green' : 'text-red'}`}>{growthLabel}</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">COURSES LIVE</p>
          <p className="h1 mono mt-2 text-3xl">{data.coursesLive}</p>
          <p className="mono muted mt-1 text-[11px]">{data.coursesDraft} in draft</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">AVG COMPLETION</p>
          <p className="h1 mono mt-2 text-3xl text-yellow">{data.avgCompletion}%</p>
          <p className="mono muted mt-1 text-[11px]">across all courses</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">AVG QUIZ SCORE</p>
          <p className="h1 mono mt-2 text-3xl text-green">{data.avgQuizScore}%</p>
          <p className="mono muted mt-1 text-[11px]">pass rate {data.quizPassRate}%</p>
        </Panel>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <Eyebrow className="mb-4">Course completion</Eyebrow>
          <Panel className="divide-y divide-[var(--border-soft)]">
            {data.courseCompletion.map((c) => (
              <div key={c.courseId} className="px-5 py-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>{c.title}</span>
                  <span className="mono muted">{c.avgProgress}%</span>
                </div>
                <ProgressTrack value={c.avgProgress} green={c.avgProgress >= 80} />
              </div>
            ))}
          </Panel>
        </div>
        <div>
          <Eyebrow className="mb-4">Platform activity</Eyebrow>
          <Panel className="divide-y divide-[var(--border-soft)]">
            {(data.activity ?? []).map((ev) => (
              <div key={ev.id} className="flex justify-between px-5 py-4 text-sm">
                <span>{ev.title}</span>
                <span className="mono muted text-xs">{formatRelativeDate(ev.created_at)}</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function AdminCoursesView({ initialCourses }: { initialCourses?: Course[] }) {
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('courses').select('*').order('sort_order')
    return (data ?? []) as Course[]
  }, [])
  const { data, loading, error, reload } = useRealtimeQuery('courses', fetcher, [], initialCourses)
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Unable to load courses.'} />

  const createCourse = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      })
      if (res.ok) {
        setNewTitle('')
        setShowNew(false)
        reload()
      }
    } finally {
      setCreating(false)
    }
  }

  const togglePublish = async (course: Course) => {
    const client = createClient()
    const live = course.status !== 'live'
    await client.from('courses').update({ status: live ? 'live' : 'draft', published: live }).eq('id', course.id)
    reload()
  }

  return (
    <div className="content-pad">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Course management</Eyebrow>
          <h1 className="h1 mt-2 text-3xl">Courses</h1>
        </div>
        <Btn size="sm" onClick={() => setShowNew((v) => !v)}>+ New Course</Btn>
      </div>

      {showNew && (
        <Panel className="mt-6 flex flex-wrap items-end gap-3 p-5">
          <div className="input-group min-w-[240px] flex-1">
            <label>Course title</label>
            <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Options Trading Blueprint" />
          </div>
          <Btn size="sm" onClick={() => void createCourse()} disabled={creating || !newTitle.trim()}>
            {creating ? 'Creating…' : 'Create course'}
          </Btn>
        </Panel>
      )}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {(data ?? []).map((course) => (
          <Panel key={course.id} className="p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{course.title}</p>
                <p className="muted mt-1 text-sm">
                  {course.module_count} modules · {course.lesson_count} lessons ·{' '}
                  {course.status === 'live' ? `${course.enrolled_count} enrolled` : 'unpublished'}
                </p>
              </div>
              <Pill tone={course.status === 'live' ? 'green' : undefined}>{course.status === 'live' ? 'Live' : 'Draft'}</Pill>
            </div>
            {course.image_url && (
              <div className="mb-4 h-24 overflow-hidden rounded">
                <img src={course.image_url} alt={course.title} className="size-full object-cover" />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}/content`}>Edit Content</Btn>
              <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}/videos`}>Manage Video</Btn>
              <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}/quiz`}>Quizzes</Btn>
              {course.status === 'live' ? (
                <Btn variant="ghost" size="sm" href={`/admin/courses/${course.slug}`}>Manage</Btn>
              ) : (
                <Btn size="sm" onClick={() => void togglePublish(course)}>Publish</Btn>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AdminCourseDetailView({ courseSlug }: { courseSlug: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingModule, setAddingModule] = useState(false)
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
    await client.from('courses').update({
      title: title || data.course.title,
      description: description || data.course.description,
      image_url: imageUrl || data.course.image_url,
      updated_at: new Date().toISOString(),
    }).eq('id', data.course.id)
    reload()
  }

  const toggleStatus = async () => {
    const client = createClient()
    const live = data.course.status !== 'live'
    await client.from('courses').update({ status: live ? 'live' : 'draft', published: live }).eq('id', data.course.id)
    reload()
  }

  const addModule = async () => {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)
    try {
      const res = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: data.course.id, title: newModuleTitle }),
      })
      if (res.ok) {
        setNewModuleTitle('')
        reload()
      }
    } finally {
      setAddingModule(false)
    }
  }

  const moveModule = async (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= data.modules.length) return
    const ids = data.modules.map((m: { id: string }) => m.id)
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    await fetch('/api/admin/modules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleIds: ids }),
    })
    reload()
  }

  return (
    <div className="content-pad">
      <Link href="/admin/courses" className="mono muted text-xs hover:text-yellow">← All courses</Link>
      <div className="topbar mt-4 px-0">
        <Eyebrow>Editing — {data.course.title} · Modules</Eyebrow>
        <Btn size="sm" variant="ghost" onClick={() => void toggleStatus()}>
          {data.course.status === 'live' ? 'Unpublish' : 'Publish course'}
        </Btn>
      </div>
      <Panel className="mb-6 space-y-4 p-5">
        <div className="input-group"><label>Course title</label><input className="input" defaultValue={data.course.title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="input-group"><label>Card description</label><textarea className="input min-h-[80px]" defaultValue={data.course.description ?? ''} onChange={(e) => setDescription(e.target.value)} /></div>
        <BlobUploadField
          label="Card image"
          value={imageUrl || data.course.image_url || ''}
          onChange={setImageUrl}
          category="courses"
        />
        <Btn size="sm" onClick={saveCourse}>Save course details</Btn>
      </Panel>
      <div className="space-y-3">
        {data.modules.map((mod: { id: string; title: string; slug: string; lesson_count: number }, i: number) => (
          <Panel key={mod.id} className="flex items-center gap-4 p-4">
            <div className="flex flex-col gap-1">
              <button type="button" className="mono muted text-xs hover:text-yellow" onClick={() => void moveModule(i, -1)} disabled={i === 0}>▲</button>
              <span className="mono muted cursor-grab text-center">⠿</span>
              <button type="button" className="mono muted text-xs hover:text-yellow" onClick={() => void moveModule(i, 1)} disabled={i === data.modules.length - 1}>▼</button>
            </div>
            <span className="flex-1 text-[13.5px]">{String(i + 1).padStart(2, '0')} · {mod.title}</span>
            <Pill>{mod.lesson_count} lessons</Pill>
            <Btn variant="ghost" size="sm" href={`/admin/courses/${courseSlug}/modules/${mod.slug}/content`}>Edit</Btn>
          </Panel>
        ))}
      </div>
      <Panel className="mt-4 flex flex-wrap items-end gap-3 p-4">
        <div className="input-group min-w-[200px] flex-1">
          <label>New module title</label>
          <input className="input" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Support & Resistance" />
        </div>
        <Btn size="sm" variant="ghost" onClick={() => void addModule()} disabled={addingModule || !newModuleTitle.trim()}>
          {addingModule ? 'Adding…' : '+ Add Module'}
        </Btn>
      </Panel>
    </div>
  )
}

export function AdminContentEditor({ courseSlug, moduleSlug }: { courseSlug: string; moduleSlug?: string }) {
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
  const [readTime, setReadTime] = useState('')
  const [published, setPublished] = useState(true)

  if (loading) return <LoadingState />
  if (!data) return null

  const openLesson = (l: any) => {
    setEditing(l)
    setBody(l.lesson_type === 'reading' ? (l.content?.paragraphs ?? []).join('\n\n') : l.content?.summary ?? '')
    setReadTime(l.duration_label ?? '')
    setPublished(l.published !== false)
  }

  const saveLesson = async () => {
    if (!editing) return
    const client = createClient()
    const content = editing.lesson_type === 'reading'
      ? { paragraphs: body.split('\n\n').filter(Boolean), takeaway: editing.content?.takeaway ?? '' }
      : { summary: body }
    await client.from('lessons').update({
      title: editing.title,
      content,
      duration_label: readTime || null,
      published,
    }).eq('id', editing.id)
    setEditing(null)
    reload()
  }

  return (
    <div className="content-pad max-w-3xl">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <div className="topbar mt-4 px-0">
        <Eyebrow>Content editor</Eyebrow>
        <Btn size="sm" onClick={saveLesson} disabled={!editing}>Publish Changes</Btn>
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
            <Panel key={l.id} className={`p-4 ${editing?.id === l.id ? 'border-yellow' : ''}`}>
              <button type="button" className="w-full text-left" onClick={() => openLesson(l)}>
                <p className="font-semibold">{l.title}</p>
                <p className="muted text-xs">{l.lesson_type} · {l.published ? 'Published' : 'Draft'}</p>
              </button>
            </Panel>
          ))}
          {editing && (
            <Panel className="space-y-4 p-6">
              <div className="input-group">
                <label>Lesson title</label>
                <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Body content</label>
                <ContentEditorToolbar value={body} onChange={setBody} />
                <textarea id="content-editor-body" className="input min-h-[240px]" value={body} onChange={(e) => setBody(e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="input-group">
                  <label>Estimated read time</label>
                  <input className="input" value={readTime} onChange={(e) => setReadTime(e.target.value)} placeholder="6 minutes" />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="input" value={published ? 'published' : 'draft'} onChange={(e) => setPublished(e.target.value === 'published')}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <Btn size="sm" onClick={saveLesson}>Save lesson</Btn>
            </Panel>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminStudentsView() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)

  const fetcher = useMemo(
    () => (client: ReturnType<typeof createClient>) => fetchAdminStudents(client),
    [],
  )
  const { data, loading, reload } = useRealtimeQuery('profiles', fetcher, [])
  if (loading) return <LoadingState />

  const filtered = (data ?? []).filter((s: AdminStudentRow) => {
    const matchFilter = filter === 'all' || s.status === filter
    const q = search.trim().toLowerCase()
    const matchSearch =
      !q ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const counts = {
    all: (data ?? []).length,
    active: (data ?? []).filter((s) => s.status === 'active').length,
    pending: (data ?? []).filter((s) => s.status === 'pending').length,
    suspended: (data ?? []).filter((s) => s.status === 'suspended').length,
  }

  const resendInvite = async (email: string, fullName?: string | null) => {
    await fetch('/api/admin/students/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName }),
    })
    reload()
  }

  const inviteStudent = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await resendInvite(inviteEmail, inviteName)
      setInviteEmail('')
      setInviteName('')
      setShowInvite(false)
    } finally {
      setInviting(false)
    }
  }

  const statusTone = (status: string) =>
    status === 'active' ? 'green' : status === 'suspended' ? 'red' : 'yellow'

  const statusLabel = (status: string) =>
    status === 'pending' ? 'Pending activation' : status

  return (
    <div className="content-pad">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Students</Eyebrow>
          <h1 className="h1 mt-2 text-3xl">All students</h1>
        </div>
        <Btn size="sm" onClick={() => setShowInvite((v) => !v)}>+ Invite Student</Btn>
      </div>

      {showInvite && (
        <Panel className="mt-6 flex flex-wrap items-end gap-3 p-5">
          <div className="input-group min-w-[180px] flex-1">
            <label>Full name</label>
            <input className="input" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
          </div>
          <div className="input-group min-w-[200px] flex-1">
            <label>Email</label>
            <input className="input" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          </div>
          <Btn size="sm" onClick={() => void inviteStudent()} disabled={inviting || !inviteEmail.trim()}>
            {inviting ? 'Sending…' : 'Send invite'}
          </Btn>
        </Panel>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input
          className="input max-w-xs"
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'active', 'pending', 'suspended'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`pill ${filter === f ? 'pill-yellow' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Avg Quiz</th>
              <th>Last Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar initials={s.avatar_initials ?? s.full_name?.slice(0, 2).toUpperCase() ?? '?'} size={32} />
                    <div>
                      <p>{s.full_name}</p>
                      <p className="mono muted text-xs">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <Pill tone={statusTone(s.status)}>{statusLabel(s.status)}</Pill>
                </td>
                <td className="mono">{s.avgProgress != null ? `${s.avgProgress}%` : '—'}</td>
                <td className="mono">{s.avgQuizScore != null ? `${s.avgQuizScore}%` : '—'}</td>
                <td className="mono muted text-xs">{s.lastActiveLabel}</td>
                <td>
                  {s.status === 'pending' ? (
                    <Btn variant="ghost" size="sm" onClick={() => void resendInvite(s.email ?? '', s.full_name)}>Resend Invite</Btn>
                  ) : s.status === 'suspended' ? (
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await fetch(`/api/admin/students/${s.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'active' }),
                        })
                        reload()
                      }}
                    >
                      Reactivate
                    </Btn>
                  ) : (
                    <Btn variant="ghost" size="sm" href={`/admin/students/${s.id}`}>View</Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminStudentDetailView({ studentId }: { studentId: string }) {
  const [resetMsg, setResetMsg] = useState<string | null>(null)
  const fetcher = useMemo(
    () => (client: ReturnType<typeof createClient>) => fetchAdminStudentDetail(client, studentId),
    [studentId],
  )

  const { data, loading, reload } = useRealtimeQuery('enrollments', fetcher, [studentId])
  if (loading) return <LoadingState />
  if (!data?.profile) return null

  const { profile } = data

  const updateStatus = async (status: 'active' | 'suspended') => {
    await fetch(`/api/admin/students/${studentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    reload()
  }

  const resetPassword = async () => {
    const res = await fetch(`/api/admin/students/${studentId}/reset-password`, { method: 'POST' })
    const json = await res.json()
    if (res.ok) setResetMsg(`Temporary password: ${json.temporaryPassword}`)
    else setResetMsg(json.error ?? 'Reset failed')
  }

  const lastActive = profile.last_active_at
    ? formatRelativeDate(profile.last_active_at)
    : 'Never'

  return (
    <div className="content-pad">
      <Link href="/admin/students" className="mono muted text-xs">← All Students</Link>
      <div className="topbar mt-4 px-0">
        <div className="flex items-center gap-4">
          <Avatar initials={profile.avatar_initials ?? profile.full_name?.slice(0, 2).toUpperCase() ?? '?'} size={48} />
          <div>
            <h1 className="h2 text-xl">{profile.full_name}</h1>
            <p className="mono muted text-xs">{profile.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={profile.status === 'active' ? 'green' : profile.status === 'suspended' ? 'red' : 'yellow'}>
            {profile.status}
          </Pill>
          <Btn variant="ghost" size="sm" onClick={() => void resetPassword()}>Reset Password</Btn>
          {profile.status === 'suspended' ? (
            <Btn size="sm" onClick={() => void updateStatus('active')}>Reactivate</Btn>
          ) : (
            <Btn variant="danger" size="sm" onClick={() => void updateStatus('suspended')}>Suspend</Btn>
          )}
        </div>
      </div>
      {resetMsg && <p className="mt-4 text-sm text-yellow">{resetMsg}</p>}

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Panel className="p-5">
          <p className="mono muted text-[11px]">COURSES ENROLLED</p>
          <p className="h1 mono mt-2 text-3xl">{data.coursesEnrolled}</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">AVG QUIZ SCORE</p>
          <p className="h1 mono mt-2 text-3xl text-green">{data.avgQuizScore}%</p>
        </Panel>
        <Panel className="p-5">
          <p className="mono muted text-[11px]">LAST ACTIVE</p>
          <p className="h1 mono mt-2 text-xl">{lastActive}</p>
        </Panel>
      </div>

      <Eyebrow className="mt-8 mb-4">Course progress</Eyebrow>
      <div className="space-y-4">
        {data.enrollments.map((e: any) => (
          <Panel key={e.course_id} className="p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>{e.courses?.title}</span>
              <span className="mono muted">{e.progress_pct}%</span>
            </div>
            <ProgressTrack value={e.progress_pct} green={e.progress_pct === 100} />
          </Panel>
        ))}
      </div>

      <Eyebrow className="mt-8 mb-4">Quiz history</Eyebrow>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Score</th>
              <th>Attempts</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.quizAttempts.map((a: any) => (
              <tr key={a.id}>
                <td>{a.modules?.title ?? 'Quiz'}</td>
                <td className={a.passed ? 'text-green' : 'text-yellow'}>{a.score}%</td>
                <td className="mono">{a.attempt_number}</td>
                <td className="mono muted text-xs">
                  {a.completed_at ? formatDateTime(a.completed_at) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminSupportView() {
  const [viewTicket, setViewTicket] = useState<SupportTicket | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('support_tickets').select('*').order('created_at', { ascending: false })
    return (data ?? []) as SupportTicket[]
  }, [])
  const { data, loading, reload } = useRealtimeQuery('support_tickets', fetcher, [])

  const openCount = (data ?? []).filter((t) => t.status === 'open').length

  const sendReply = async (ticketId: string) => {
    if (!replyText.trim()) return
    setReplying(true)
    try {
      await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, reply: replyText }),
      })
      setReplyText('')
      setViewTicket(null)
      reload()
    } finally {
      setReplying(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="content-pad">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Support inbox</Eyebrow>
          <h1 className="h1 mt-2 text-3xl">Support Inbox</h1>
        </div>
        <Pill tone="yellow">{openCount} OPEN</Pill>
      </div>
      <div className="mt-8 space-y-3">
        {(data ?? []).map((t) => (
          <Panel key={t.id} className={`p-5 ${t.status === 'closed' ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {t.student_name ?? 'Student'} — {t.subject}
                </p>
                <p className="muted mt-1 truncate text-sm">
                  &quot;{t.message.slice(0, 120)}{t.message.length > 120 ? '…' : ''}&quot; · via {t.channel}
                </p>
                {t.admin_reply && (
                  <p className="mt-2 text-sm text-green">Reply: {t.admin_reply}</p>
                )}
                <p className="mono muted mt-2 text-[11px]">{formatDateTime(t.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={t.status === 'open' ? 'yellow' : undefined}>{t.status.toUpperCase()}</Pill>
                {t.status === 'open' ? (
                  <Btn variant="ghost" size="sm" onClick={() => { setViewTicket(t); setReplyText('') }}>Reply</Btn>
                ) : (
                  <Btn variant="ghost" size="sm" onClick={() => setViewTicket(t)}>View</Btn>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {viewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Panel className="max-h-[80vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="h2 mb-2 text-lg">{viewTicket.subject}</h2>
            <p className="mono muted mb-4 text-xs">
              {viewTicket.student_name} · via {viewTicket.channel} · {formatDateTime(viewTicket.created_at)}
            </p>
            <p className="mb-4 whitespace-pre-wrap text-sm">{viewTicket.message}</p>
            {viewTicket.admin_reply && (
              <Panel sm className="mb-4 border-green/30 p-4">
                <Eyebrow className="mb-2">Your reply</Eyebrow>
                <p className="text-sm">{viewTicket.admin_reply}</p>
              </Panel>
            )}
            {viewTicket.status === 'open' && (
              <div className="input-group mb-4">
                <label>Reply</label>
                <textarea className="input min-h-[100px]" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              </div>
            )}
            <div className="flex gap-3">
              {viewTicket.status === 'open' && (
                <Btn size="sm" onClick={() => void sendReply(viewTicket.id)} disabled={replying || !replyText.trim()}>
                  {replying ? 'Sending…' : 'Send reply & close'}
                </Btn>
              )}
              <Btn size="sm" variant="ghost" onClick={() => setViewTicket(null)}>Close</Btn>
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}

export function AdminPagesView() {
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
        <BlobUploadField
          label="Hero image"
          value={current.hero_image_url ?? ''}
          onChange={(url) => setDraft({ ...draft, hero_image_url: url })}
          category="pages"
        />
      </Panel>

      <Eyebrow className="mt-8 mb-4">Sections</Eyebrow>
      <Btn size="sm" variant="ghost" className="mb-4" onClick={() => {
        const sections = [...(current.sections ?? []), { heading: 'New section', body: '' }]
        setDraft({ ...draft, sections })
      }}>+ Add section</Btn>
      {(current.sections ?? []).map((section, i) => (
        <Panel key={`${section.heading}-${i}`} className="mb-4 space-y-3 p-5">
          <div className="flex justify-end">
            <button type="button" className="mono text-xs text-red-400 hover:underline" onClick={() => {
              const sections = [...(current.sections ?? [])]
              sections.splice(i, 1)
              setDraft({ ...draft, sections })
            }}>Remove section</button>
          </div>
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

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Primary call to action</Eyebrow>
        <div className="input-group"><label>Button label</label><input className="input" value={current.primary_cta_label ?? ''} onChange={(e) => setDraft({ ...draft, primary_cta_label: e.target.value })} /></div>
        <div className="input-group"><label>Button link</label><input className="input" value={current.primary_cta_href ?? ''} onChange={(e) => setDraft({ ...draft, primary_cta_href: e.target.value })} placeholder="/contact" /></div>
      </Panel>
    </div>
  )
}

export function AdminSettingsView({ initialSettings }: { initialSettings?: SiteSettings }) {
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
  const enrollment = { ...settings?.enrollment, ...(draft.enrollment as object) }
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
    await client.from('site_settings').upsert({ key: 'enrollment', value: enrollment })
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
      <div className="topbar px-0">
        <div>
          <Eyebrow>Academy settings</Eyebrow>
          <h1 className="h1 mt-2 text-3xl">Academy Settings</h1>
        </div>
        <Btn size="sm" onClick={save}>Save Settings</Btn>
      </div>

      <Panel className="mt-8 space-y-4 p-6">
        <Eyebrow>Branding</Eyebrow>
        <div className="input-group"><label>Academy name</label><input className="input" defaultValue={branding.companyName} onChange={(e) => setDraft({ ...draft, branding: { ...branding, companyName: e.target.value } })} /></div>
        <div className="input-group"><label>Accent color</label><input className="input" defaultValue={(branding as { accentColor?: string }).accentColor ?? '#F4C522'} onChange={(e) => setDraft({ ...draft, branding: { ...branding, accentColor: e.target.value } })} placeholder="#F4C522" /></div>
        <BlobUploadField
          label="Logo"
          value={branding.logoBannerPathname ?? branding.logoPathname ?? ''}
          onChange={(url) => setDraft({ ...draft, branding: { ...branding, logoBannerPathname: url, logoPathname: url } })}
          category="branding"
          placeholder="/brand/logo-banner.jpg"
        />
        <BlobUploadField
          label="Logo icon"
          value={branding.logoIconPathname ?? ''}
          onChange={(url) => setDraft({ ...draft, branding: { ...branding, logoIconPathname: url } })}
          category="branding"
          placeholder="/brand/logo-icon.svg"
        />
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Support channels</Eyebrow>
        <div className="input-group"><label>Support WhatsApp number</label><input className="input" defaultValue={support.whatsapp ?? footer.whatsapp} onChange={(e) => setDraft({ ...draft, support: { ...support, whatsapp: e.target.value }, footer: { ...footer, whatsapp: e.target.value } })} placeholder="+971 50 123 4567" /></div>
        <div className="input-group"><label>Support email</label><input className="input" defaultValue={support.email ?? footer.email} onChange={(e) => setDraft({ ...draft, support: { ...support, email: e.target.value }, footer: { ...footer, email: e.target.value } })} /></div>
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Access & enrollment</Eyebrow>
        <div className="input-group">
          <label>Enrollment mode</label>
          <select
            className="input"
            defaultValue={enrollment.inviteOnly !== false ? 'invite' : 'open'}
            onChange={(e) => setDraft({ ...draft, enrollment: { ...enrollment, inviteOnly: e.target.value === 'invite' } })}
          >
            <option value="invite">Invitation only</option>
            <option value="open">Open enrollment</option>
          </select>
        </div>
        <div className="input-group">
          <label>Default quiz pass score (%)</label>
          <input className="input" type="number" min={1} max={100} defaultValue={enrollment.passingScoreDefault ?? 70} onChange={(e) => setDraft({ ...draft, enrollment: { ...enrollment, passingScoreDefault: Number(e.target.value) } })} />
        </div>
        <div className="input-group">
          <label>Max quiz attempts (default)</label>
          <input className="input" type="number" min={1} max={10} defaultValue={enrollment.maxQuizAttempts ?? 3} onChange={(e) => setDraft({ ...draft, enrollment: { ...enrollment, maxQuizAttempts: Number(e.target.value) } })} />
        </div>
        <p className="muted text-xs">Course unlock rule: Sequential — students must pass each module quiz to advance.</p>
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Homepage quick edit</Eyebrow>
        <p className="muted text-xs">For full homepage CMS (stats, pillars, FAQ, videos, section headings), use <Link href="/admin/homepage" className="text-yellow hover:underline">Homepage CMS</Link>.</p>
        <div className="input-group"><label>Hero eyebrow</label><input className="input" defaultValue={hp.eyebrow} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, eyebrow: e.target.value } })} /></div>
        <div className="input-group"><label>Hero headline</label><input className="input" defaultValue={hp.headline} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, headline: e.target.value } })} /></div>
        <div className="input-group"><label>Hero description</label><textarea className="input min-h-[100px]" defaultValue={hp.description} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, description: e.target.value } })} /></div>
        <div className="input-group"><label>Trust line</label><input className="input" defaultValue={hp.trustLine} onChange={(e) => setDraft({ ...draft, homepage: { ...hp, trustLine: e.target.value } })} /></div>
        <BlobUploadField
          label="Hero image"
          value={hp.heroImageUrl ?? ''}
          onChange={(url) => setDraft({ ...draft, homepage: { ...hp, heroImageUrl: url } })}
          category="marketing"
        />
        <BlobUploadField
          label="Hero terminal overlay"
          value={hp.heroTerminalImageUrl ?? ''}
          onChange={(url) => setDraft({ ...draft, homepage: { ...hp, heroTerminalImageUrl: url } })}
          category="marketing"
        />
        <BlobUploadField
          label="CTA band image"
          value={hp.ctaImageUrl ?? ''}
          onChange={(url) => setDraft({ ...draft, homepage: { ...hp, ctaImageUrl: url } })}
          category="marketing"
        />
        <p className="muted text-xs">Use trading-industry photos (charts, terminals, risk dashboards). Changes sync live to the homepage and contact page.</p>
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow>Footer copy</Eyebrow>
        <div className="input-group"><label>Footer description</label><textarea className="input" defaultValue={footer.description} onChange={(e) => setDraft({ ...draft, footer: { ...footer, description: e.target.value } })} /></div>
        <div className="input-group"><label>WhatsApp button label</label><input className="input" defaultValue={support.whatsappLabel ?? 'WhatsApp the desk'} onChange={(e) => setDraft({ ...draft, support: { ...support, whatsappLabel: e.target.value } })} /></div>
      </Panel>

      <CourseImageEditor onSave={updateCourseImage} />
      <TestimonialImageEditor onSave={updateTestimonialImage} />
    </div>
  )
}

function CourseImageEditor({ onSave }: { onSave: (id: string, url: string) => void }) {
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
          <BlobUploadField
            value={c.image_url ?? ''}
            onChange={(url) => onSave(c.id, url)}
            category="courses"
          />
        </div>
      ))}
    </Panel>
  )
}

function TestimonialImageEditor({ onSave }: { onSave: (id: string, url: string) => void }) {
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
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
          <BlobUploadField
            value={t.image_url ?? ''}
            onChange={(url) => onSave(t.id, url)}
            category="testimonials"
          />
        </div>
      ))}
    </Panel>
  )
}
