'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brand } from '@/components/brand'

type Role = 'admin' | 'student'
type Tab = { id: string; label: string }

const studentTabs: Tab[] = [
  { id: 'overview', label: 'Overview' }, { id: 'courses', label: 'My Courses' }, { id: 'assessments', label: 'Assessments' },
  { id: 'certificates', label: 'Certificates' }, { id: 'resources', label: 'Resources' }, { id: 'settings', label: 'Settings' },
]
const adminTabs: Tab[] = [
  { id: 'overview', label: 'Overview' }, { id: 'students', label: 'Students' }, { id: 'courses', label: 'Courses' },
  { id: 'assessments', label: 'Assessments' }, { id: 'content', label: 'CMS Content' }, { id: 'media', label: 'Media' },
  { id: 'integrations', label: 'Integrations' }, { id: 'settings', label: 'Settings' },
]

const defaults = [{ id: 'foundation', title: "The Trader's Foundation", description: 'Build a repeatable process, protect your capital, and develop disciplined execution.', module: 'Module 01', status: 'Published' }, { id: 'risk', title: 'Risk Before Entry', description: 'Learn how sizing, invalidation, and review protect your account.', module: 'Module 02', status: 'Published' }, { id: 'psychology', title: 'The Trader Mindset', description: 'Build the habits that keep decisions clear under pressure.', module: 'Module 03', status: 'Coming next' }]

export function LiveDashboard({ role, user: initialUser, settings, onSignOut: externalSignOut }: { role: Role; user?: any; settings?: any; onSignOut?: () => Promise<void> }) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const tabs = role === 'admin' ? adminTabs : studentTabs
  const [user, setUser] = useState(initialUser ?? null)
  const [active, setActive] = useState('overview')
  const [courses, setCourses] = useState<any[]>(defaults)
  const [students, setStudents] = useState<any[]>([])
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const client = createClient()
    setSupabase(client)
    client.auth.getUser().then(({ data }) => { if (mounted) setUser(data.user) })
    const load = async () => {
      const [videos, profiles, pages] = await Promise.all([
        client.from('youtube_videos').select('*').eq('visibility', 'course').order('sort_order'),
        client.from('profiles').select('*').order('created_at', { ascending: false }),
        client.from('page_contents').select('*').order('slug'),
      ])
      if (!mounted) return
      if (videos.data?.length) setCourses(videos.data)
      if (profiles.data) setStudents(profiles.data)
      if (pages.data) setContent(pages.data)
      setLoading(false)
    }
    load()
    const channel = client.channel(`dashboard-${role}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'youtube_videos' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_contents' }, load)
      .subscribe()
    return () => { mounted = false; client.removeChannel(channel) }
  }, [role])

  const title = role === 'admin' ? 'Admin control center.' : 'Keep building your edge.'
  const description = role === 'admin' ? 'Manage academy content, students, courses, assessments, and integrations.' : 'Your structured learning path, progress, assessments, and resources all in one place.'

  return <main className="min-h-screen bg-background text-foreground"><header className="flex items-center justify-between border-b border-border px-5 py-4 lg:px-8"><Brand settings={settings} /><div className="flex items-center gap-4"><span className="hidden font-mono text-xs text-muted-foreground sm:block">{role === 'admin' ? 'Administrator' : user?.email}</span><button onClick={async () => { if (externalSignOut) return externalSignOut(); await supabase.auth.signOut(); window.location.href = '/login' }} className="border border-border px-4 py-2 font-mono text-xs uppercase hover:border-yellow hover:text-yellow">Sign out</button></div></header><div className="flex"><aside className="hidden min-h-[calc(100vh-77px)] w-64 shrink-0 border-r border-border bg-card/40 p-5 md:block"><p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-yellow">{role === 'admin' ? 'Admin console' : 'Member dashboard'}</p><nav className="flex flex-col gap-1">{tabs.map(tab => <button key={tab.id} onClick={() => setActive(tab.id)} className={`px-4 py-3 text-left text-sm transition-colors ${active === tab.id ? 'bg-yellow text-black' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{tab.label}</button>)}</nav></aside><section className="min-w-0 flex-1 p-5 lg:p-10"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-yellow">{tabs.find(tab => tab.id === active)?.label}</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{description}</p></div><span className="border border-border px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground">Live sync {loading ? 'loading' : 'active'}</span></div>{active === 'courses' || (role === 'student' && active === 'overview') ? <CourseWorkspace courses={courses} role={role} /> : active === 'students' ? <StudentWorkspace students={students} /> : active === 'content' ? <ContentWorkspace content={content} /> : active === 'settings' ? <SettingsWorkspace user={user} /> : <WorkspaceCards tabs={tabs} active={active} courses={courses} students={students} role={role} onSelect={setActive} />}</section></div></main>
}

function CourseWorkspace({ courses, role }: { courses: any[]; role: Role }) { return <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{courses.map((course, index) => <article key={course.id ?? course.video_id ?? course.title} className="border border-border bg-card p-6"><div className="flex items-start justify-between gap-3"><p className="font-mono text-xs uppercase text-yellow">{course.module ?? `Module ${String(index + 1).padStart(2, '0')}`}</p><span className="font-mono text-[10px] uppercase text-muted-foreground">{course.status ?? 'Live'}</span></div><h2 className="mt-5 text-2xl font-semibold">{course.title}</h2><p className="mt-3 leading-6 text-muted-foreground">{course.description ?? 'Course lesson synced from the academy library.'}</p><div className="mt-6 h-1 bg-muted"><div className="h-1 w-1/4 bg-yellow" /></div><button className="mt-6 w-full bg-yellow px-5 py-3 font-semibold text-black">{role === 'admin' ? 'Manage course' : 'Continue course'}</button></article>)}</div> }
function StudentWorkspace({ students }: { students: any[] }) { return <div className="border border-border bg-card p-6"><h2 className="text-2xl font-semibold">Students</h2><div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="font-mono text-xs uppercase text-muted-foreground"><tr><th className="pb-3">Name</th><th className="pb-3">Role</th><th className="pb-3">Joined</th></tr></thead><tbody>{students.map(student => <tr key={student.id} className="border-t border-border"><td className="py-4">{student.full_name ?? student.email ?? student.id}</td><td className="py-4 text-yellow">{student.role ?? 'student'}</td><td className="py-4 text-muted-foreground">{student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'}</td></tr>)}</tbody></table>{students.length === 0 && <p className="py-8 text-muted-foreground">No profiles have been added yet.</p>}</div></div> }
function ContentWorkspace({ content }: { content: any[] }) { return <div className="grid gap-4 md:grid-cols-2">{content.map(page => <article key={page.slug} className="border border-border bg-card p-6"><p className="font-mono text-xs uppercase text-yellow">CMS page</p><h2 className="mt-3 text-xl font-semibold">{page.title ?? page.slug}</h2><p className="mt-2 text-sm text-muted-foreground">/{page.slug}</p><button className="mt-5 border border-yellow px-4 py-2 text-sm text-yellow">Open editor</button></article>)}</div> }
function SettingsWorkspace({ user }: { user: any }) { return <div className="max-w-2xl border border-border bg-card p-6"><p className="font-mono text-xs uppercase text-yellow">Account</p><h2 className="mt-3 text-2xl font-semibold">Profile settings</h2><p className="mt-3 leading-6 text-muted-foreground">Signed in as {user?.email}. Your account and learning data are synchronized with Supabase.</p></div> }
function WorkspaceCards({ tabs, active, courses, students, role, onSelect }: { tabs: Tab[]; active: string; courses: any[]; students: any[]; role: Role; onSelect: (id: string) => void }) { const cards = tabs.filter(tab => tab.id !== active && tab.id !== 'settings'); return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{cards.map(tab => <button key={tab.id} onClick={() => onSelect(tab.id)} className="border border-border bg-card p-6 text-left hover:border-yellow"><p className="font-mono text-xs uppercase text-yellow">Live workspace</p><h2 className="mt-4 text-xl font-semibold">{tab.label}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{tab.id === 'courses' ? `${courses.length} courses available` : tab.id === 'students' ? `${students.length} profiles synced` : `Open the ${tab.label.toLowerCase()} workspace.`}</p></button>)}</div> }
