'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { useQuizTimer } from '@/lib/hooks/use-quiz-timer'
import { Btn, Candles, Eyebrow, HelpBlock, LoadingState, Logo, Panel, Pill, ProgressTrack } from '@/components/ui/academy-ui'
import { formatDateTime } from '@/lib/utils/datetime'
import type { Course, Lesson, Module, ModuleProgress, Profile, QuizAttempt, SiteSettings } from '@/lib/types/database'

export function StudentCourseView({ profile, courseSlug }: { profile: Profile; courseSlug: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('*').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const [{ data: modules }, { data: enrollment }, { data: modProgress }] = await Promise.all([
      client.from('modules').select('*').eq('course_id', course.id).order('sort_order'),
      client.from('enrollments').select('*').eq('user_id', profile.id).eq('course_id', course.id).maybeSingle(),
      client.from('module_progress').select('*').eq('user_id', profile.id),
    ])
    const progressMap = Object.fromEntries(((modProgress ?? []) as ModuleProgress[]).map((p) => [p.module_id, p]))
    return { course: course as Course, modules: (modules ?? []) as Module[], enrollment, progressMap }
  }, [courseSlug, profile.id])

  const { data, loading } = useRealtimeQuery('modules', fetcher, [courseSlug, profile.id])
  if (loading) return <LoadingState />
  if (!data) return <div className="content-pad"><p>Course not found.</p></div>

  const { course, modules, enrollment, progressMap } = data

  const isLocked = (mod: Module, index: number) => {
    if (index === 0) return false
    const prev = modules[index - 1]
    return !progressMap[prev.id]?.completed
  }

  return (
    <div className="content-pad">
      <Link href="/student/courses" className="mono muted text-xs hover:text-yellow">← Back to Dashboard</Link>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <Eyebrow className="mb-2">Course</Eyebrow>
          <h1 className="h1 text-3xl">{course.title}</h1>
          <p className="muted mt-2 max-w-xl">{course.description}</p>
        </div>
        {enrollment && <Pill tone="yellow">{enrollment.progress_pct}% Complete</Pill>}
      </div>

      <div className="mt-8 space-y-3.5">
        {modules.map((mod, index) => {
          const prog = progressMap[mod.id]
          const locked = isLocked(mod, index)
          const active = !locked && !prog?.completed
          return (
            <ModuleRow key={mod.id} mod={mod} courseSlug={courseSlug} locked={locked} completed={!!prog?.completed} active={active} lessonCount={mod.lesson_count} />
          )
        })}
      </div>

      {enrollment?.progress_pct === 100 && (
        <div className="mt-8">
          <Btn href={`/student/courses/${courseSlug}/certificate`}>View Certificate</Btn>
        </div>
      )}
    </div>
  )
}

function ModuleRow({ mod, courseSlug, locked, completed, active, lessonCount }: { mod: Module; courseSlug: string; locked: boolean; completed: boolean; active: boolean; lessonCount: number }) {
  const inner = (
    <Panel className={`flex items-center gap-4 p-5 ${active ? 'border-yellow' : ''} ${locked ? 'opacity-50' : ''}`}>
      <div className={`mono flex size-[30px] items-center justify-center border text-xs ${completed ? 'pill-green border-green text-green' : active ? 'border-yellow text-yellow' : ''}`}>
        {completed ? '✓' : locked ? '🔒' : '▶'}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{mod.title}</p>
        <p className="muted text-[12.5px]">{completed ? `${lessonCount} lessons · Completed` : locked ? 'Locked · complete previous module quiz' : `In progress · ${lessonCount} lessons`}</p>
      </div>
      <Candles total={Math.min(lessonCount, 6)} done={completed ? lessonCount : active ? 3 : 0} current={active} />
    </Panel>
  )
  if (locked) return inner
  return <Link href={`/student/courses/${courseSlug}/modules/${mod.slug}`}>{inner}</Link>
}

export function StudentModuleView({ profile, courseSlug, moduleSlug, settings }: { profile: Profile; courseSlug: string; moduleSlug: string; settings: SiteSettings }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,slug,title').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const { data: mod } = await client.from('modules').select('*').eq('course_id', course.id).eq('slug', moduleSlug).maybeSingle()
    if (!mod) return null
    const [{ data: lessons }, { data: progress }] = await Promise.all([
      client.from('lessons').select('*').eq('module_id', mod.id).order('sort_order'),
      client.from('lesson_progress').select('*').eq('user_id', profile.id),
    ])
    const progMap = Object.fromEntries(((progress ?? []) as { lesson_id: string; completed: boolean }[]).map((p) => [p.lesson_id, p.completed]))
    return { course, module: mod as Module, lessons: (lessons ?? []) as Lesson[], progMap }
  }, [courseSlug, moduleSlug, profile.id])

  const { data, loading } = useRealtimeQuery('lessons', fetcher, [courseSlug, moduleSlug])
  if (loading) return <LoadingState />
  if (!data) return null

  return (
    <div className="content-pad">
      <Link href={`/student/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <Eyebrow className="mt-4 mb-2">{data.module.title}</Eyebrow>
      <div className="space-y-2">
        {data.lessons.map((lesson, i) => {
          const done = data.progMap[lesson.id]
          const prevDone = i === 0 || data.progMap[data.lessons[i - 1].id]
          const locked = !prevDone && lesson.lesson_type !== 'quiz'
          const href = lesson.lesson_type === 'quiz'
            ? `/student/courses/${courseSlug}/modules/${moduleSlug}/quiz`
            : `/student/courses/${courseSlug}/lessons/${lesson.slug}`
          return (
            <Link key={lesson.id} href={locked ? '#' : href} className={locked ? 'pointer-events-none' : ''}>
              <div className={`sb-link ${!locked && !done ? 'on' : ''}`} style={{ color: done ? 'var(--green)' : locked ? 'var(--muted)' : undefined }}>
                {done ? '✓' : locked ? '🔒' : '▶'} {i + 1}. {lesson.title}
              </div>
            </Link>
          )
        })}
      </div>
      <div className="mt-8"><HelpBlock settings={settings} /></div>
    </div>
  )
}

export function StudentLessonView({ profile, courseSlug, lessonSlug, settings }: { profile: Profile; courseSlug: string; lessonSlug: string; settings: SiteSettings }) {
  const [saving, setSaving] = useState(false)
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,slug,title').eq('slug', courseSlug).maybeSingle()
    const { data: lesson } = await client.from('lessons').select('*, modules(id,slug,title,course_id)').eq('slug', lessonSlug).maybeSingle()
    if (!lesson || !course) return null
    const { data: siblings } = await client.from('lessons').select('slug,sort_order').eq('module_id', (lesson as any).modules.id).order('sort_order')
    return { course, lesson: lesson as Lesson & { modules: Module }, siblings: siblings ?? [] }
  }, [courseSlug, lessonSlug])

  const { data, loading, reload } = useRealtimeQuery('lessons', fetcher, [courseSlug, lessonSlug])
  if (loading) return <LoadingState />
  if (!data) return null

  const { lesson, course, siblings } = data
  const mod = lesson.modules
  const idx = siblings.findIndex((s: { slug: string }) => s.slug === lessonSlug)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null
  const content = lesson.content as { summary?: string; paragraphs?: string[]; takeaway?: string }

  const markComplete = async () => {
    setSaving(true)
    const client = createClient()
    await client.from('lesson_progress').upsert({ user_id: profile.id, lesson_id: lesson.id, completed: true, progress_pct: 100, completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
    await client.from('activity_events').insert({ event_type: 'lesson_complete', title: `${profile.full_name} completed ${lesson.title}`, meta: { user_id: profile.id, lesson_id: lesson.id } })
    setSaving(false)
    reload()
  }

  return (
    <div className="content-pad">
      <Link href={`/student/courses/${courseSlug}/modules/${mod.slug}`} className="mono muted text-xs">← {course.title}</Link>
      <Eyebrow className="mt-4 mb-2">{lesson.lesson_type === 'video' ? 'Video Lesson' : 'Written Lesson'}</Eyebrow>
      <h1 className="h1 mb-5 text-2xl">{lesson.title}</h1>

      {lesson.lesson_type === 'video' && lesson.youtube_video_id && (
        <Panel className="mb-4 aspect-video overflow-hidden bg-black">
          <iframe className="size-full" src={`https://www.youtube.com/embed/${lesson.youtube_video_id}`} title={lesson.title} allowFullScreen />
        </Panel>
      )}

      {lesson.lesson_type === 'reading' && (
        <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-[#d8d7d0]">
          {(content.paragraphs ?? []).map((p, i) => <p key={i}>{p}</p>)}
          {content.takeaway && (
            <Panel sm className="border-yellow p-5">
              <Eyebrow className="mb-2">Key Takeaway</Eyebrow>
              <p className="text-sm">{content.takeaway}</p>
            </Panel>
          )}
        </div>
      )}

      {content.summary && lesson.lesson_type === 'video' && <p className="muted mb-6 max-w-xl text-sm leading-relaxed">{content.summary}</p>}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        {prev && <Btn variant="ghost" size="sm" href={`/student/courses/${courseSlug}/lessons/${prev.slug}`}>← Previous</Btn>}
        <div className="flex gap-3">
          <Btn size="sm" onClick={markComplete} disabled={saving}>{saving ? 'Saving…' : 'Mark Complete & Continue →'}</Btn>
          {next && <Btn size="sm" href={`/student/courses/${courseSlug}/lessons/${next.slug}`}>Next →</Btn>}
        </div>
      </div>
      <div className="mt-8"><HelpBlock settings={settings} /></div>
    </div>
  )
}

export function StudentQuizView({ profile, courseSlug, moduleSlug }: { profile: Profile; courseSlug: string; moduleSlug: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean; id: string; timedOut?: boolean; completedAt?: string } | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [phase, setPhase] = useState<'intro' | 'active' | 'result'>('intro')

  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id').eq('slug', courseSlug).maybeSingle()
    const { data: mod } = await client.from('modules').select('id,title').eq('course_id', course?.id).eq('slug', moduleSlug).maybeSingle()
    if (!mod) return null
    const [{ data: questions }, { data: options }, { data: settings }, { data: priorAttempts }] = await Promise.all([
      client.from('quiz_questions').select('*').eq('module_id', mod.id).order('sort_order'),
      client.from('quiz_options').select('*').order('sort_order'),
      client.from('module_quiz_settings').select('*').eq('module_id', mod.id).maybeSingle(),
      client.from('quiz_attempts').select('*').eq('user_id', profile.id).eq('module_id', mod.id).order('created_at', { ascending: false }),
    ])
    const optByQ = (options ?? []).reduce((acc: Record<string, typeof options>, o: { question_id: string }) => {
      acc[o.question_id] = [...(acc[o.question_id] ?? []), o]
      return acc
    }, {})
    const completed = (priorAttempts ?? []).filter((a: QuizAttempt) => a.status !== 'in_progress')
    const inProgress = (priorAttempts ?? []).find((a: QuizAttempt) => a.status === 'in_progress') as QuizAttempt | undefined
    return {
      module: mod,
      questions: questions ?? [],
      optByQ,
      passing: settings?.passing_score ?? 70,
      attemptsAllowed: settings?.attempts_allowed ?? 3,
      timeLimitSeconds: settings?.time_limit_seconds ?? null,
      attemptsUsed: completed.length,
      inProgressAttempt: inProgress ?? null,
    }
  }, [courseSlug, moduleSlug, profile.id])

  const { data, loading, reload } = useRealtimeQuery('quiz_questions', fetcher, [courseSlug, moduleSlug, profile.id])

  const submitQuiz = useCallback(async (timedOut = false) => {
    if (!data || !attempt || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id, answers, timedOut }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submit failed')
      const a = json.attempt
      setResult({
        score: a.score,
        passed: a.passed,
        id: a.id,
        timedOut: a.timed_out,
        completedAt: a.completed_at,
      })
      setPhase('result')
      reload()
    } finally {
      setSubmitting(false)
    }
  }, [answers, attempt, data, reload, submitting])

  const handleExpire = useCallback(() => {
    submitQuiz(true)
  }, [submitQuiz])

  const { formatted: timerDisplay, urgent, synced } = useQuizTimer(
    phase === 'active' && attempt?.expires_at ? attempt.expires_at : null,
    handleExpire,
  )

  const startQuiz = async () => {
    if (!data?.module) return
    setStarting(true)
    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: data.module.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not start quiz')
      setAttempt(json.attempt as QuizAttempt)
      setAnswers({})
      setQIndex(0)
      setPhase('active')
    } finally {
      setStarting(false)
    }
  }

  if (loading) return <LoadingState />
  if (!data || !data.questions.length) return <div className="content-pad">No quiz configured.</div>

  const attemptsRemaining = Math.max(0, data.attemptsAllowed - data.attemptsUsed)
  const question = data.questions[qIndex]
  const opts = data.optByQ[question?.id] ?? []

  if (result || phase === 'result') {
    return (
      <div className="auth-wrap bg-grid items-start pt-16">
        <div className="w-full max-w-[640px]">
          <Panel className="mb-6 p-10 text-center">
            <Pill tone={result?.passed ? 'green' : 'red'} className="mb-4">
              {result?.timedOut ? 'Time expired' : result?.passed ? 'Passed' : 'Not passed'}
            </Pill>
            <p className="h1 mono text-[52px]" style={{ color: result?.passed ? 'var(--green)' : 'var(--red)' }}>{result?.score}%</p>
            <p className="muted mb-2 text-[13px]">Passing score is {data.passing}%</p>
            {result?.completedAt && (
              <p className="mono muted mb-6 text-[11px]">Submitted {formatDateTime(result.completedAt)}</p>
            )}
            <Btn href={`/student/courses/${courseSlug}`}>{result?.passed ? 'Continue to next module →' : 'Review course'}</Btn>
          </Panel>
        </div>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="auth-wrap bg-grid items-start pt-16">
        <div className="w-full max-w-[640px]">
          <Eyebrow className="mb-2">{data.module.title} · Examination</Eyebrow>
          <Panel className="space-y-4 p-8">
            <h1 className="h2 text-xl">Before you begin</h1>
            <ul className="muted space-y-2 text-sm">
              <li>{data.questions.length} questions · passing score {data.passing}%</li>
              <li>{attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining</li>
              {data.timeLimitSeconds ? (
                <li>Time limit: {Math.round(data.timeLimitSeconds / 60)} minutes (server-synced timer)</li>
              ) : (
                <li>No time limit</li>
              )}
            </ul>
            {data.inProgressAttempt && (
              <p className="text-sm text-yellow">You have an in-progress attempt — resume below.</p>
            )}
            <Btn
              onClick={() => {
                if (data.inProgressAttempt) {
                  setAttempt(data.inProgressAttempt)
                  setPhase('active')
                } else {
                  startQuiz()
                }
              }}
              disabled={starting || attemptsRemaining === 0}
            >
              {starting ? 'Starting…' : data.inProgressAttempt ? 'Resume quiz' : 'Start quiz'}
            </Btn>
            {attemptsRemaining === 0 && (
              <p className="text-sm text-red">No attempts remaining. Contact support if you need a reset.</p>
            )}
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrap bg-grid items-start pt-16">
      <div className="w-full max-w-[640px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>{data.module.title} Quiz</Eyebrow>
          <div className="flex items-center gap-4">
            {data.timeLimitSeconds && attempt?.expires_at && (
              <span className={`mono text-sm font-medium ${urgent ? 'text-red' : 'text-yellow'}`} aria-live="polite">
                ⏱ {timerDisplay}{!synced ? ' …' : ''}
              </span>
            )}
            <span className="mono muted text-xs">Question {qIndex + 1} of {data.questions.length}</span>
          </div>
        </div>
        <Panel className="p-8">
          <h2 className="h2 mb-6 text-lg leading-snug">{question.question}</h2>
          <div className="space-y-3">
            {opts.map((o: { id: string; option_text: string }) => (
              <label key={o.id} className={`panel panel-sm flex cursor-pointer items-center gap-3.5 p-4 ${answers[question.id] === o.id ? 'border-yellow' : ''}`}>
                <input type="radio" name={question.id} checked={answers[question.id] === o.id} onChange={() => setAnswers({ ...answers, [question.id]: o.id })} className="accent-yellow" />
                <span className="text-sm">{o.option_text}</span>
              </label>
            ))}
          </div>
        </Panel>
        <div className="mt-5 flex justify-between">
          <Btn variant="ghost" size="sm" onClick={() => setQIndex(Math.max(0, qIndex - 1))} disabled={qIndex === 0}>← Previous</Btn>
          {qIndex < data.questions.length - 1 ? (
            <Btn size="sm" onClick={() => setQIndex(qIndex + 1)} disabled={!answers[question.id]}>Next Question →</Btn>
          ) : (
            <Btn size="sm" onClick={() => submitQuiz(false)} disabled={submitting || Object.keys(answers).length < data.questions.length}>
              {submitting ? 'Submitting…' : 'Submit Quiz'}
            </Btn>
          )}
        </div>
      </div>
    </div>
  )
}

export function StudentProfileView({ profile }: { profile: Profile }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('enrollments').select('*, courses(title,slug)').eq('user_id', profile.id)
    return data ?? []
  }, [profile.id])
  const { data, loading } = useRealtimeQuery('enrollments', fetcher, [profile.id])
  if (loading) return <LoadingState />

  return (
    <div className="content-pad max-w-xl">
      <Eyebrow>Profile</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">{profile.full_name}</h1>
      <p className="mono muted mt-1 text-sm">{profile.email}</p>
      <Panel className="mt-8 space-y-3 p-6">
        <div className="input-group"><label>Full Name</label><input className="input" defaultValue={profile.full_name ?? ''} readOnly /></div>
        <div className="input-group"><label>Email</label><input className="input" defaultValue={profile.email ?? ''} readOnly /></div>
      </Panel>
      <Eyebrow className="mt-8 mb-4">Enrollments</Eyebrow>
      <div className="space-y-2">
        {(data ?? []).map((e: any) => (
          <div key={e.course_id} className="flex justify-between text-sm">
            <span>{e.courses?.title}</span>
            <Pill tone={e.progress_pct === 100 ? 'green' : 'yellow'}>{e.progress_pct === 100 ? 'Completed' : `In progress · ${e.progress_pct}%`}</Pill>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StudentSupportView({ profile }: { profile: Profile }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('support_tickets').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    return data ?? []
  }, [profile.id])
  const { data: tickets, loading, reload } = useRealtimeQuery('support_tickets', fetcher, [profile.id])

  const submit = async () => {
    const client = createClient()
    await client.from('support_tickets').insert({ user_id: profile.id, student_name: profile.full_name, subject, message, channel: 'email' })
    setSubject('')
    setMessage('')
    setSent(true)
    reload()
  }

  if (loading) return <LoadingState />

  return (
    <div className="content-pad max-w-2xl">
      <Eyebrow>Support</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Talk to the desk</h1>
      <Panel className="mt-6 space-y-4 p-6">
        <div className="input-group"><label>Subject</label><input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="input-group"><label>Message</label><textarea className="input min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        {sent && <p className="text-sm text-green">Ticket submitted.</p>}
        <Btn onClick={submit} disabled={!subject || !message}>Send message</Btn>
      </Panel>
      <Eyebrow className="mt-8 mb-4">Your tickets</Eyebrow>
      <div className="space-y-3">
        {(tickets ?? []).map((t: { id: string; subject: string; status: string; created_at: string }) => (
          <Panel key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <span>{t.subject}</span>
              <p className="mono muted mt-1 text-[11px]">{formatDateTime(t.created_at)}</p>
            </div>
            <Pill tone={t.status === 'open' ? 'yellow' : 'green'}>{t.status}</Pill>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function StudentCertificateView({ profile, courseSlug }: { profile: Profile; courseSlug: string }) {
  const fetcher = useMemo(async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('*').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const { data: cert } = await client.from('certificates').select('*').eq('user_id', profile.id).eq('course_id', course.id).maybeSingle()
    return { course: course as Course, cert }
  }, [profile.id, courseSlug])

  const { data, loading } = useRealtimeQuery('certificates', fetcher, [profile.id, courseSlug])
  if (loading) return <LoadingState />
  if (!data?.cert) return <div className="content-pad"><p>Complete the course to earn your certificate.</p><Btn href={`/student/courses/${courseSlug}`}>Back to course</Btn></div>

  return (
    <div className="auth-wrap bg-grid">
      <Panel className="max-w-2xl border-yellow p-16 text-center">
        <div className="mb-8 flex justify-center"><Logo variant="icon" href={false} /></div>
        <Eyebrow className="mb-5">Certificate of Completion</Eyebrow>
        <p className="muted text-[13px]">This certifies that</p>
        <p className="h1 my-4 text-4xl">{profile.full_name}</p>
        <p className="muted text-[13px]">has successfully completed</p>
        <p className="h2 my-6 text-2xl text-yellow">{data.course.title}</p>
        <p className="mono muted text-xs">CERT ID · {data.cert.certificate_code}</p>
        <p className="mono muted mt-2 text-xs">Issued {new Date(data.cert.issued_at).toLocaleDateString('en-GB')}</p>
      </Panel>
    </div>
  )
}
