'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { useQuizTimer } from '@/lib/hooks/use-quiz-timer'
import { useSupportContact } from '@/lib/hooks/use-support-contact'
import { supportContactUrl } from '@/lib/support/contact'
import { Btn, Candles, Eyebrow, HelpBlock, LoadingState, Logo, Panel, Pill } from '@/components/ui/academy-ui'
import { YoutubePlayer } from '@/components/ui/youtube-player'
import { QuizProctor, uploadQuizProctorRecording } from '@/components/quiz/quiz-proctor'
import { LessonSidebar } from '@/components/student/lesson-sidebar'
import { formatDurationLabel } from '@/lib/youtube/utils'
import { formatDateTime } from '@/lib/utils/datetime'
import { decodeQuestionOrder, orderQuestions, QUESTION_ORDER_KEY } from '@/lib/quiz/order'
import type { Course, Lesson, Module, Profile, QuizAttempt, SiteSettings } from '@/lib/types/database'

type ProgressRow = { module_id?: string; module_key?: string; lesson_id?: string; completed?: boolean; progress_pct?: number }

type QuizReviewItem = {
  questionId: string
  question: string
  selectedOptionId: string | null
  selectedText: string | null
  correctOptionId: string | null
  correctText: string | null
  correct: boolean
}

type QuizResult = {
  score: number
  passed: boolean
  id: string
  timedOut?: boolean
  completedAt?: string
  review: QuizReviewItem[]
  nextModuleSlug: string | null
  courseSlug: string | null
  attemptsRemaining: number
}

function moduleProgressFor(progress: ProgressRow[], mod: Module) {
  return progress.find((p) => p.module_id === mod.id || p.module_key === mod.slug)
}

export function StudentCourseView({ profile, courseSlug }: { profile: Profile; courseSlug: string }) {
  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const { data: course } = await client.from('courses').select('*').eq('slug', courseSlug).maybeSingle()
      if (!course) return null
      const [{ data: modules }, { data: enrollment }, { data: modProgress }, { data: lessonProgress }] =
        await Promise.all([
          client.from('modules').select('*').eq('course_id', course.id).order('sort_order'),
          client.from('enrollments').select('*').eq('user_id', profile.id).eq('course_id', course.id).maybeSingle(),
          client.from('module_progress').select('*').eq('user_id', profile.id),
          client.from('lesson_progress').select('lesson_id, completed').eq('user_id', profile.id),
        ])

      const moduleIds = (modules ?? []).map((m) => m.id)
      const { data: lessons } = moduleIds.length
        ? await client.from('lessons').select('id, module_id, lesson_type').in('module_id', moduleIds)
        : { data: [] as { id: string; module_id: string; lesson_type: string }[] }

      const completedLessons = new Set(
        (lessonProgress ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
      )
      const lessonsByModule: Record<string, { total: number; done: number }> = {}
      for (const lesson of lessons ?? []) {
        if (lesson.lesson_type === 'quiz') continue
        if (!lessonsByModule[lesson.module_id]) lessonsByModule[lesson.module_id] = { total: 0, done: 0 }
        lessonsByModule[lesson.module_id].total += 1
        if (completedLessons.has(lesson.id)) lessonsByModule[lesson.module_id].done += 1
      }

      const progressMap = Object.fromEntries(
        ((modProgress ?? []) as ProgressRow[]).map((p) => [p.module_id ?? p.module_key ?? '', p]),
      )
      return {
        course: course as Course,
        modules: (modules ?? []) as Module[],
        enrollment,
        progressMap,
        lessonsByModule,
      }
    },
    [courseSlug, profile.id],
  )

  const { data, loading, error } = useRealtimeQuery('modules', fetcher, [courseSlug, profile.id])
  if (loading && !data) return <LoadingState error={error} />
  if (!data) return <LoadingState error={error ?? 'Course not found.'} />

  const { course, modules, enrollment, progressMap, lessonsByModule } = data

  const isLocked = (mod: Module, index: number) => {
    if (index === 0) return false
    const prev = modules[index - 1]
    const prevProg = progressMap[prev.id] ?? progressMap[prev.slug]
    return !prevProg?.completed
  }

  return (
    <div className="content-pad">
      <Link href="/student/courses" className="mono muted text-xs hover:text-yellow">
        ← Back to Dashboard
      </Link>
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
          const prog = progressMap[mod.id] ?? progressMap[mod.slug]
          const locked = isLocked(mod, index)
          const completed = !!prog?.completed
          const active = !locked && !completed
          const counts = lessonsByModule[mod.id] ?? { total: mod.lesson_count, done: 0 }
          return (
            <ModuleRow
              key={mod.id}
              mod={mod}
              courseSlug={courseSlug}
              locked={locked}
              completed={completed}
              active={active}
              lessonsDone={counts.done}
              lessonTotal={counts.total || mod.lesson_count}
            />
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

function ModuleRow({
  mod,
  courseSlug,
  locked,
  completed,
  active,
  lessonsDone,
  lessonTotal,
}: {
  mod: Module
  courseSlug: string
  locked: boolean
  completed: boolean
  active: boolean
  lessonsDone: number
  lessonTotal: number
}) {
  const statusLabel = completed
    ? `${lessonsDone} of ${lessonTotal} lessons · Completed`
    : locked
      ? 'Locked · complete previous module quiz'
      : `${lessonsDone} of ${lessonTotal} lessons · In progress`

  const inner = (
    <Panel className={`flex items-center gap-4 p-5 ${active ? 'border-yellow' : ''} ${locked ? 'opacity-50' : ''}`}>
      <div
        className={`mono flex size-[30px] items-center justify-center border text-xs ${completed ? 'pill-green border-green text-green' : active ? 'border-yellow text-yellow' : ''}`}
      >
        {completed ? '✓' : locked ? '🔒' : '▶'}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{mod.title}</p>
        <p className="muted text-[12.5px]">{statusLabel}</p>
      </div>
      <Candles total={Math.min(lessonTotal, 6)} done={completed ? lessonTotal : lessonsDone} current={active} />
    </Panel>
  )
  if (locked) return inner
  return <Link href={`/student/courses/${courseSlug}/modules/${mod.slug}`}>{inner}</Link>
}

export function StudentModuleView({
  profile,
  courseSlug,
  moduleSlug,
  settings,
}: {
  profile: Profile
  courseSlug: string
  moduleSlug: string
  settings: SiteSettings
}) {
  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const { data: course } = await client.from('courses').select('id,slug,title').eq('slug', courseSlug).maybeSingle()
      if (!course) return null
      const { data: mod } = await client.from('modules').select('*').eq('course_id', course.id).eq('slug', moduleSlug).maybeSingle()
      if (!mod) return null
      const [{ data: lessons }, { data: progress }, { data: modProgress }] = await Promise.all([
        client.from('lessons').select('*').eq('module_id', mod.id).order('sort_order'),
        client.from('lesson_progress').select('*').eq('user_id', profile.id),
        client.from('module_progress').select('completed').eq('user_id', profile.id).eq('module_id', mod.id).maybeSingle(),
      ])
      const progMap = Object.fromEntries(
        ((progress ?? []) as { lesson_id: string; completed: boolean }[]).map((p) => [p.lesson_id, p.completed]),
      )
      return {
        course,
        module: mod as Module,
        lessons: (lessons ?? []) as Lesson[],
        progMap,
        moduleCompleted: !!modProgress?.completed,
      }
    },
    [courseSlug, moduleSlug, profile.id],
  )

  const { data, loading } = useRealtimeQuery('lessons', fetcher, [courseSlug, moduleSlug])
  if (loading) return <LoadingState />
  if (!data) return null

  const contentLessons = data.lessons.filter((l) => l.lesson_type !== 'quiz')
  const doneCount = contentLessons.filter((l) => data.progMap[l.id]).length

  return (
    <div className="content-pad">
      <Link href={`/student/courses/${courseSlug}`} className="mono muted text-xs">
        ← {data.course.title}
      </Link>
      <Eyebrow className="mt-4 mb-2">{data.module.title}</Eyebrow>
      <p className="mono muted mb-4 text-[11px]">
        {doneCount} of {contentLessons.length} lessons
        {data.moduleCompleted ? ' · Module complete' : ''}
      </p>
      <div className="space-y-2">
        {data.lessons.map((lesson, i) => {
          const done = data.progMap[lesson.id]
          const prevDone = i === 0 || data.progMap[data.lessons[i - 1].id]
          const locked = !prevDone && lesson.lesson_type !== 'quiz'
          const href =
            lesson.lesson_type === 'quiz'
              ? `/student/courses/${courseSlug}/modules/${moduleSlug}/quiz`
              : `/student/courses/${courseSlug}/lessons/${lesson.slug}`
          return (
            <Link key={lesson.id} href={locked ? '#' : href} className={locked ? 'pointer-events-none' : ''}>
              <div
                className={`sb-link ${!locked && !done ? 'on' : ''}`}
                style={{ color: done ? 'var(--green)' : locked ? 'var(--text-muted-soft)' : undefined }}
              >
                {done ? '✓' : locked ? '🔒' : '▶'} {i + 1}. {lesson.title}
              </div>
            </Link>
          )
        })}
      </div>
      <div className="mt-8">
        <HelpBlock settings={settings} />
      </div>
    </div>
  )
}

export function StudentLessonView({
  profile,
  courseSlug,
  lessonSlug,
  settings,
}: {
  profile: Profile
  courseSlug: string
  lessonSlug: string
  settings: SiteSettings
}) {
  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const { data: course } = await client.from('courses').select('id,slug,title').eq('slug', courseSlug).maybeSingle()
      const { data: lesson } = await client
        .from('lessons')
        .select('*, modules(id,slug,title,course_id)')
        .eq('slug', lessonSlug)
        .maybeSingle()
      if (!lesson || !course) return null
      const mod = (lesson as { modules: Module }).modules
      const [{ data: siblings }, { data: progress }] = await Promise.all([
        client.from('lessons').select('*').eq('module_id', mod.id).order('sort_order'),
        client.from('lesson_progress').select('lesson_id, completed').eq('user_id', profile.id),
      ])
      const completedMap = Object.fromEntries((progress ?? []).map((p) => [p.lesson_id, p.completed]))
      return {
        course,
        lesson: lesson as Lesson & { modules: Module },
        siblings: (siblings ?? []) as Lesson[],
        completedMap,
      }
    },
    [courseSlug, lessonSlug, profile.id],
  )

  const { data, loading, reload } = useRealtimeQuery('lessons', fetcher, [courseSlug, lessonSlug])
  if (loading) return <LoadingState />
  if (!data) return null

  return (
    <StudentLessonContent
      courseSlug={courseSlug}
      settings={settings}
      data={data}
      reload={reload}
    />
  )
}

function StudentLessonContent({
  courseSlug,
  settings,
  data,
  reload,
}: {
  courseSlug: string
  settings: SiteSettings
  data: {
    course: { slug: string; title: string }
    lesson: Lesson & { modules: Module }
    siblings: Lesson[]
    completedMap: Record<string, boolean>
  }
  reload: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [autoCompleted, setAutoCompleted] = useState(false)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const completingRef = useRef(false)

  const { lesson, course, siblings, completedMap } = data
  const mod = lesson.modules
  const contentSiblings = siblings.filter((s) => s.lesson_type !== 'quiz')
  const idx = siblings.findIndex((s) => s.slug === lessonSlug)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null
  const content = lesson.content as {
    summary?: string
    paragraphs?: string[]
    takeaway?: string
    youtubeUrl?: string
  }
  const videoSource = lesson.youtube_video_id ?? content.youtubeUrl
  const lessonNum = contentSiblings.findIndex((s) => s.id === lesson.id) + 1
  const lessonTotal = contentSiblings.length
  const durationLabel = lesson.duration_label ?? formatDurationLabel(lesson.duration_seconds)
  const isComplete = completedMap[lesson.id]

  const markComplete = useCallback(async (auto = false) => {
    if (completingRef.current || completedMap[lesson.id]) return
    completingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/student/lesson-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not save progress')
      if (auto) setAutoCompleted(true)
      reload()
      if (next && next.lesson_type !== 'quiz') {
        window.location.href = `/student/courses/${courseSlug}/lessons/${next.slug}`
      } else if (next?.lesson_type === 'quiz') {
        window.location.href = `/student/courses/${courseSlug}/modules/${mod.slug}/quiz`
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save progress')
      completingRef.current = false
    } finally {
      setSaving(false)
    }
  }, [completedMap, courseSlug, lesson.id, mod.slug, next, reload])

  useEffect(() => {
    if (lesson.lesson_type !== 'reading' || isComplete || !bottomSentinelRef.current) return
    const el = bottomSentinelRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void markComplete(true)
      },
      { threshold: 0.6 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isComplete, lesson.lesson_type, markComplete])

  const nextHref =
    next?.lesson_type === 'quiz'
      ? `/student/courses/${courseSlug}/modules/${mod.slug}/quiz`
      : next
        ? `/student/courses/${courseSlug}/lessons/${next.slug}`
        : null

  return (
    <div className="content-pad">
      <Link href={`/student/courses/${courseSlug}/modules/${mod.slug}`} className="mono muted text-xs">
        ← {course.title}
      </Link>

      <div className="lesson-layout mt-4">
        <div className="lesson-main">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Eyebrow>{lesson.lesson_type === 'video' ? 'Video Lesson' : 'Written Lesson'}</Eyebrow>
            <span className="mono muted text-xs">
              Lesson {lessonNum} of {lessonTotal}
              {durationLabel ? ` · ${durationLabel}` : ''}
            </span>
          </div>
          <h1 className="h1 mb-5 text-2xl">{lesson.title}</h1>

          {lesson.lesson_type === 'video' && (
            <YoutubePlayer
              videoInput={videoSource}
              title={lesson.title}
              durationLabel={lesson.duration_label}
              durationSeconds={lesson.duration_seconds}
              className="mb-6"
              onEnded={!isComplete ? () => void markComplete(true) : undefined}
            />
          )}

          {lesson.lesson_type === 'reading' && (
            <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-[#d8d7d0]">
              {(content.paragraphs ?? []).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {content.takeaway && (
                <Panel sm className="border-yellow p-5">
                  <Eyebrow className="mb-2">Key Takeaway</Eyebrow>
                  <p className="text-sm">{content.takeaway}</p>
                </Panel>
              )}
              {!isComplete && <div ref={bottomSentinelRef} className="h-1" aria-hidden />}
            </div>
          )}

          {content.summary && lesson.lesson_type === 'video' && (
            <p className="muted mb-6 max-w-xl text-sm leading-relaxed">{content.summary}</p>
          )}

          {saveError && <p className="mb-4 text-sm text-red">{saveError}</p>}
          {autoCompleted && <p className="mb-4 text-sm text-green">Lesson completed automatically — advancing…</p>}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            {prev && (
              <Btn
                variant="ghost"
                size="sm"
                href={
                  prev.lesson_type === 'quiz'
                    ? `/student/courses/${courseSlug}/modules/${mod.slug}/quiz`
                    : `/student/courses/${courseSlug}/lessons/${prev.slug}`
                }
              >
                ← Previous
              </Btn>
            )}
            <div className="flex gap-3">
              {!isComplete && (
                <Btn size="sm" onClick={() => void markComplete(false)} disabled={saving}>
                  {saving ? 'Saving…' : 'Mark Complete & Continue →'}
                </Btn>
              )}
              {isComplete && nextHref && (
                <Btn size="sm" href={nextHref}>
                  Continue →
                </Btn>
              )}
              {next && !isComplete && (
                <Btn variant="ghost" size="sm" href={nextHref ?? '#'}>
                  Skip to next →
                </Btn>
              )}
            </div>
          </div>
        </div>

        <LessonSidebar
          courseSlug={courseSlug}
          moduleSlug={mod.slug}
          moduleTitle={mod.title}
          lessons={siblings}
          currentLessonId={lesson.id}
          completedMap={completedMap}
        />
      </div>

      <div className="mt-8">
        <HelpBlock settings={settings} />
      </div>
    </div>
  )
}

function QuizSegmentBar({ total, current, answered }: { total: number; current: number; answered: Set<number> }) {
  return (
    <div className="quiz-segments" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`quiz-segment ${i === current ? 'current' : ''} ${answered.has(i) ? 'answered' : ''}`}
          title={`Question ${i + 1}`}
        />
      ))}
    </div>
  )
}

export function StudentQuizView({ profile, courseSlug, moduleSlug }: { profile: Profile; courseSlug: string; moduleSlug: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [phase, setPhase] = useState<'intro' | 'active' | 'result'>('intro')
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [proctorActive, setProctorActive] = useState(false)

  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const { data: course } = await client.from('courses').select('id,slug').eq('slug', courseSlug).maybeSingle()
      const { data: mod } = await client
        .from('modules')
        .select('id,title')
        .eq('course_id', course?.id)
        .eq('slug', moduleSlug)
        .maybeSingle()
      if (!mod) return null
      const [{ data: questions }, { data: options }, { data: settings }, { data: priorAttempts }] = await Promise.all([
        client.from('quiz_questions').select('*').eq('module_id', mod.id).order('sort_order'),
        client.from('quiz_options').select('*').order('sort_order'),
        client.from('module_quiz_settings').select('*').eq('module_id', mod.id).maybeSingle(),
        client
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', profile.id)
          .eq('module_id', mod.id)
          .order('created_at', { ascending: false }),
      ])
      const optByQ = (options ?? []).reduce(
        (acc: Record<string, typeof options>, o: { question_id: string }) => {
          acc[o.question_id] = [...(acc[o.question_id] ?? []), o]
          return acc
        },
        {},
      )
      const completed = (priorAttempts ?? []).filter((a: QuizAttempt) => a.status !== 'in_progress')
      const inProgress = (priorAttempts ?? []).find((a: QuizAttempt) => a.status === 'in_progress') as QuizAttempt | undefined
      const quizSettings = settings as {
        passing_score?: number
        attempts_allowed?: number
        time_limit_seconds?: number | null
        proctoring_required?: boolean
      } | null
      return {
        module: mod,
        questions: questions ?? [],
        optByQ,
        passing: quizSettings?.passing_score ?? 70,
        attemptsAllowed: quizSettings?.attempts_allowed ?? 3,
        timeLimitSeconds: quizSettings?.time_limit_seconds ?? null,
        proctoringRequired: quizSettings?.proctoring_required !== false,
        attemptsUsed: completed.length,
        inProgressAttempt: inProgress ?? null,
      }
    },
    [courseSlug, moduleSlug, profile.id],
  )

  const { data, loading, reload } = useRealtimeQuery('quiz_questions', fetcher, [courseSlug, moduleSlug, profile.id])

  useEffect(() => {
    if (phase !== 'active' || !attempt?.id) return
    const timer = setTimeout(() => {
      void fetch('/api/quiz/save-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id, answers }),
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [answers, attempt?.id, phase])

  const submitQuiz = useCallback(
    async (timedOut = false) => {
      if (!data || !attempt || submitting) return
      setSubmitting(true)
      try {
        if (data.proctoringRequired) {
          await uploadQuizProctorRecording()
        }
        const res = await fetch('/api/quiz/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId: attempt.id, answers, timedOut }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Submit failed')
        const a = json.attempt
        setProctorActive(false)
        setResult({
          score: a.score,
          passed: a.passed,
          id: a.id,
          timedOut: a.timed_out,
          completedAt: a.completed_at,
          review: json.review ?? [],
          nextModuleSlug: json.nextModuleSlug ?? null,
          courseSlug: json.courseSlug ?? courseSlug,
          attemptsRemaining: json.attemptsRemaining ?? 0,
        })
        setPhase('result')
        reload()
      } finally {
        setSubmitting(false)
      }
    },
    [answers, attempt, courseSlug, data, reload, submitting],
  )

  const handleExpire = useCallback(() => {
    void submitQuiz(true)
  }, [submitQuiz])

  const { formatted: timerDisplay, urgent, synced } = useQuizTimer(
    phase === 'active' && attempt?.expires_at ? attempt.expires_at : null,
    handleExpire,
  )

  const beginAttempt = async (existing?: QuizAttempt | null) => {
    if (!data?.module) return
    setStarting(true)
    setCameraError(null)
    try {
      if (data.proctoringRequired) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          stream.getTracks().forEach((t) => t.stop())
          setCameraReady(true)
        } catch {
          setCameraError('Camera and microphone are required for proctored exams. Allow access in your browser settings.')
          return
        }
      }

      if (existing) {
        const saved = (existing.answers ?? {}) as Record<string, string>
        const resumeQuestions = orderQuestions(
          data.questions as { id: string }[],
          decodeQuestionOrder(saved[QUESTION_ORDER_KEY]),
        )
        const firstOpen = resumeQuestions.findIndex((q: { id: string }) => !saved[q.id])
        setAttempt(existing)
        setAnswers(saved)
        setQIndex(firstOpen >= 0 ? firstOpen : 0)
        setProctorActive(data.proctoringRequired)
        setPhase('active')
        return
      }

      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: data.module.id, proctoringConsented: data.proctoringRequired }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not start quiz')
      const started = json.attempt as QuizAttempt
      const saved = (started.answers ?? {}) as Record<string, string>
      setAttempt(started)
      setAnswers(saved)
      setQIndex(0)
      setProctorActive(data.proctoringRequired)
      setPhase('active')
    } finally {
      setStarting(false)
    }
  }

  const retryQuiz = () => {
    setResult(null)
    setAnswers({})
    setQIndex(0)
    setAttempt(null)
    setPhase('intro')
    reload()
  }

  if (loading) return <LoadingState />
  if (!data || !data.questions.length) return <div className="content-pad">No quiz configured.</div>

  const orderSource =
    (attempt?.answers as Record<string, string> | undefined)?.[QUESTION_ORDER_KEY] ??
    (data.inProgressAttempt?.answers as Record<string, string> | undefined)?.[QUESTION_ORDER_KEY]
  const orderedQuestions = orderQuestions(
    data.questions as { id: string }[],
    decodeQuestionOrder(orderSource),
  )

  const attemptsRemaining = Math.max(0, data.attemptsAllowed - data.attemptsUsed)
  const question = orderedQuestions[qIndex]
  const opts = data.optByQ[question?.id] ?? []

  const answeredIndices = new Set<number>()
  orderedQuestions.forEach((q: { id: string }, i: number) => {
    if (answers[q.id]) answeredIndices.add(i)
  })

  if (result || phase === 'result') {
    const continueHref = result?.passed
      ? result.nextModuleSlug
        ? `/student/courses/${result.courseSlug ?? courseSlug}/modules/${result.nextModuleSlug}`
        : `/student/courses/${courseSlug}/certificate`
      : `/student/courses/${courseSlug}/modules/${moduleSlug}`

    const continueLabel = result?.passed
      ? result.nextModuleSlug
        ? 'Continue to next module →'
        : 'View certificate →'
      : 'Back to module'

    return (
      <div className="content-pad max-w-2xl">
        <Link href={`/student/courses/${courseSlug}/modules/${moduleSlug}`} className="mono muted text-xs">
          ← Back to module
        </Link>
        <Panel className="mt-6 p-8 text-center">
          <Pill tone={result?.passed ? 'green' : 'red'} className="mb-4">
            {result?.timedOut ? 'Time expired' : result?.passed ? 'Passed' : 'Not passed'}
          </Pill>
          <p className="h1 mono text-[52px]" style={{ color: result?.passed ? 'var(--green)' : 'var(--red)' }}>
            {result?.score}%
          </p>
          <p className="muted mb-2 text-[13px]">Passing score is {data.passing}%</p>
          {result?.completedAt && (
            <p className="mono muted mb-6 text-[11px]">Submitted {formatDateTime(result.completedAt)}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Btn href={continueHref}>{continueLabel}</Btn>
            {!result?.passed && (result?.attemptsRemaining ?? 0) > 0 && (
              <Btn variant="ghost" onClick={retryQuiz}>
                Retry quiz ({result?.attemptsRemaining} left)
              </Btn>
            )}
          </div>
        </Panel>

        {result?.review && result.review.length > 0 && (
          <div className="mt-8 space-y-4">
            <Eyebrow>Answer review</Eyebrow>
            {result.review.map((item, i) => (
              <Panel key={item.questionId} className={`p-5 ${item.correct ? 'border-green/30' : 'border-red/30'}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">
                    {i + 1}. {item.question}
                  </p>
                  <Pill tone={item.correct ? 'green' : 'red'}>{item.correct ? 'Correct' : 'Incorrect'}</Pill>
                </div>
                {item.selectedText && (
                  <p className={`text-sm ${item.correct ? 'text-green' : 'text-red'}`}>Your answer: {item.selectedText}</p>
                )}
                {!item.correct && item.correctText && (
                  <p className="muted mt-1 text-sm">Correct answer: {item.correctText}</p>
                )}
              </Panel>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="content-pad max-w-2xl">
        <Link href={`/student/courses/${courseSlug}/modules/${moduleSlug}`} className="mono muted text-xs">
          ← Back to module
        </Link>
        <Eyebrow className="mb-2 mt-4">{data.module.title} · Examination</Eyebrow>
        <Panel className="space-y-4 p-8">
          <h1 className="h2 text-xl">Before you begin</h1>
          <ul className="muted space-y-2 text-sm">
            <li>
              {orderedQuestions.length} questions · passing score {data.passing}%
            </li>
            <li>
              {attemptsRemaining} attempt{attemptsRemaining === 1 ? '' : 's'} remaining
            </li>
            {data.timeLimitSeconds ? (
              <li>Time limit: {Math.round(data.timeLimitSeconds / 60)} minutes (server-synced timer)</li>
            ) : (
              <li>No time limit</li>
            )}
            {data.proctoringRequired && (
              <li className="text-yellow">Proctored exam — your camera and microphone will be recorded for admin review</li>
            )}
          </ul>
          {cameraError && <p className="text-sm text-red">{cameraError}</p>}
          {data.inProgressAttempt && <p className="text-sm text-yellow">You have an in-progress attempt — resume below.</p>}
          <Btn
            onClick={() => void beginAttempt(data.inProgressAttempt ?? null)}
            disabled={starting || attemptsRemaining === 0}
          >
            {starting
              ? 'Starting…'
              : data.inProgressAttempt
                ? 'Enable camera & resume'
                : data.proctoringRequired
                  ? 'Enable camera & start exam'
                  : 'Start quiz'}
          </Btn>
          {attemptsRemaining === 0 && (
            <p className="text-sm text-red">No attempts remaining. Contact support if you need a reset.</p>
          )}
        </Panel>
      </div>
    )
  }

  return (
    <div className="content-pad max-w-2xl">
      {proctorActive && attempt && (
        <QuizProctor
          attemptId={attempt.id}
          moduleId={data.module.id}
          active={proctorActive}
          onReady={() => setCameraReady(true)}
          onError={(msg) => setCameraError(msg)}
        />
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>{data.module.title} Quiz</Eyebrow>
        <div className="flex items-center gap-4">
          {data.timeLimitSeconds && attempt?.expires_at && (
            <span className={`mono text-sm font-medium ${urgent ? 'text-red' : 'text-yellow'}`} aria-live="polite">
              ⏱ {timerDisplay}
              {!synced ? ' …' : ''}
            </span>
          )}
          <span className="mono muted text-xs">
            Question {qIndex + 1} of {orderedQuestions.length}
          </span>
        </div>
      </div>

      <QuizSegmentBar total={orderedQuestions.length} current={qIndex} answered={answeredIndices} />

      {cameraError && <p className="mb-4 text-sm text-red">{cameraError}</p>}
      <Panel className="mt-4 p-8">
        <h2 className="h2 mb-6 text-lg leading-snug">{question.question}</h2>
        <div className="space-y-3">
          {opts.map((o: { id: string; option_text: string }) => (
            <label
              key={o.id}
              className={`panel panel-sm flex cursor-pointer items-center gap-3.5 p-4 ${answers[question.id] === o.id ? 'border-yellow' : ''}`}
            >
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === o.id}
                onChange={() => setAnswers({ ...answers, [question.id]: o.id })}
                className="accent-yellow"
              />
              <span className="text-sm">{o.option_text}</span>
            </label>
          ))}
        </div>
      </Panel>
      <div className="mt-5 flex justify-between">
        <Btn variant="ghost" size="sm" onClick={() => setQIndex(Math.max(0, qIndex - 1))} disabled={qIndex === 0}>
          ← Previous
        </Btn>
        {qIndex < orderedQuestions.length - 1 ? (
          <Btn size="sm" onClick={() => setQIndex(qIndex + 1)} disabled={!answers[question.id]}>
            Next Question →
          </Btn>
        ) : (
          <Btn
            size="sm"
            onClick={() => void submitQuiz(false)}
            disabled={submitting || orderedQuestions.some((q: { id: string }) => !answers[q.id])}
          >
            {submitting ? 'Submitting…' : 'Submit Quiz'}
          </Btn>
        )}
      </div>
    </div>
  )
}

export function StudentProfileView({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const [{ data: enrollments }, { data: attempts }] = await Promise.all([
        client.from('enrollments').select('*, courses(title,slug)').eq('user_id', profile.id),
        client
          .from('quiz_attempts')
          .select('*, modules(title, courses(title, slug))')
          .eq('user_id', profile.id)
          .neq('status', 'in_progress')
          .order('completed_at', { ascending: false })
          .limit(20),
      ])
      return { enrollments: enrollments ?? [], attempts: attempts ?? [] }
    },
    [profile.id],
  )
  const { data, loading, reload } = useRealtimeQuery('enrollments', fetcher, [profile.id])
  if (loading) return <LoadingState />

  const saveProfile = async () => {
    setSaving(true)
    setSaveMsg(null)
    setSaveError(null)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setSaveMsg('Profile updated.')
      reload()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    setPwSaving(true)
    setPwMsg(null)
    setPwError(null)
    try {
      const res = await fetch('/api/student/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Password change failed')
      setPwMsg('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Password change failed')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="content-pad max-w-xl">
      <Eyebrow>Profile</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">{fullName || profile.full_name}</h1>
      <p className="mono muted mt-1 text-sm">{profile.email}</p>

      <Panel className="mt-8 space-y-4 p-6">
        <div className="input-group">
          <label>Full Name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input className="input" defaultValue={profile.email ?? ''} readOnly />
        </div>
        {saveError && <p className="text-sm text-red">{saveError}</p>}
        {saveMsg && <p className="text-sm text-green">{saveMsg}</p>}
        <Btn onClick={() => void saveProfile()} disabled={saving || !fullName.trim()}>
          {saving ? 'Saving…' : 'Save profile'}
        </Btn>
      </Panel>

      <Panel className="mt-6 space-y-4 p-6">
        <Eyebrow className="mb-2">Change password</Eyebrow>
        <div className="input-group">
          <label>Current password</label>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="input-group">
          <label>New password</label>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {pwError && <p className="text-sm text-red">{pwError}</p>}
        {pwMsg && <p className="text-sm text-green">{pwMsg}</p>}
        <Btn variant="ghost" onClick={() => void changePassword()} disabled={pwSaving || !currentPassword || !newPassword}>
          {pwSaving ? 'Updating…' : 'Update password'}
        </Btn>
      </Panel>

      <Eyebrow className="mt-8 mb-4">Enrollments</Eyebrow>
      <div className="space-y-2">
        {(data?.enrollments ?? []).map((e: { course_id: string; progress_pct: number; courses?: { title?: string } }) => (
          <div key={e.course_id} className="flex justify-between text-sm">
            <span>{e.courses?.title}</span>
            <Pill tone={e.progress_pct === 100 ? 'green' : 'yellow'}>
              {e.progress_pct === 100 ? 'Completed' : `In progress · ${e.progress_pct}%`}
            </Pill>
          </div>
        ))}
      </div>

      <Eyebrow className="mt-8 mb-4">Learning history</Eyebrow>
      <div className="space-y-2">
        {(data?.attempts ?? []).length === 0 ? (
          <p className="muted text-sm">No quiz attempts yet.</p>
        ) : (
          (data?.attempts ?? []).map(
            (a: {
              id: string
              score: number
              passed: boolean
              completed_at?: string
              modules?: { title?: string; courses?: { title?: string } }
            }) => (
              <Panel key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <div>
                  <span>{a.modules?.courses?.title} — {a.modules?.title}</span>
                  <p className="mono muted mt-1 text-[11px]">
                    {a.completed_at ? formatDateTime(a.completed_at) : '—'}
                  </p>
                </div>
                <Pill tone={a.passed ? 'green' : 'red'}>
                  {a.score}% · {a.passed ? 'Passed' : 'Failed'}
                </Pill>
              </Panel>
            ),
          )
        )}
      </div>
    </div>
  )
}

export function StudentSupportView({ profile }: { profile: Profile }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const contact = useSupportContact()

  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const { data } = await client
        .from('support_tickets')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      return data ?? []
    },
    [profile.id],
  )
  const { data: tickets, loading, reload } = useRealtimeQuery('support_tickets', fetcher, [profile.id])

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      if (res.ok) {
        setSubject('')
        setMessage('')
        setSent(true)
        reload()
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingState />

  const waHref = supportContactUrl(contact, 'support', profile)

  return (
    <div className="content-pad max-w-2xl">
      <Eyebrow>Support</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Talk to the desk</h1>
      <Panel className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="font-semibold">WhatsApp the desk</p>
          <p className="muted mt-1 text-sm">Fastest route for lesson help and account questions.</p>
          {contact.apiEnabled && (
            <p className="mono mt-2 text-[11px] text-green">WhatsApp Business API connected — desk alerts are live.</p>
          )}
        </div>
        <Btn variant="ghost" href={waHref} target="_blank" rel="noopener noreferrer">
          💬 {contact.whatsappLabel}
        </Btn>
      </Panel>
      <Panel className="mt-6 space-y-4 p-6">
        <div className="input-group">
          <label>Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Message</label>
          <textarea className="input min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        {sent && <p className="text-sm text-green">Ticket submitted. The desk has been notified.</p>}
        <Btn onClick={submit} disabled={!subject || !message || submitting}>
          {submitting ? 'Sending…' : 'Send message'}
        </Btn>
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
  const fetcher = useMemo(
    () => async (client: ReturnType<typeof createClient>) => {
      const { data: course } = await client.from('courses').select('*').eq('slug', courseSlug).maybeSingle()
      if (!course) return null
      const { data: cert } = await client
        .from('certificates')
        .select('*')
        .eq('user_id', profile.id)
        .eq('course_id', course.id)
        .maybeSingle()
      return { course: course as Course, cert }
    },
    [profile.id, courseSlug],
  )

  const { data, loading } = useRealtimeQuery('certificates', fetcher, [profile.id, courseSlug])
  if (loading) return <LoadingState />
  if (!data?.cert)
    return (
      <div className="content-pad">
        <p>Complete the course to earn your certificate.</p>
        <Btn href={`/student/courses/${courseSlug}`}>Back to course</Btn>
      </div>
    )

  const downloadPdf = () => {
    window.location.href = `/api/student/certificate/${courseSlug}/pdf`
  }

  const printCertificate = () => {
    window.print()
  }

  return (
    <div className="content-pad">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 no-print">
        <Link href={`/student/courses/${courseSlug}`} className="mono muted text-xs">
          ← Back to course
        </Link>
        <div className="flex flex-wrap gap-3">
          <Btn size="sm" onClick={downloadPdf}>
            Download PDF
          </Btn>
          <Btn size="sm" variant="ghost" onClick={printCertificate}>
            Print
          </Btn>
        </div>
      </div>
      <div className="auth-wrap bg-grid certificate-print-area">
        <Panel className="max-w-2xl border-yellow p-16 text-center">
          <div className="mb-8 flex justify-center">
            <Logo variant="icon" href={false} />
          </div>
          <Eyebrow className="mb-5">Certificate of Completion</Eyebrow>
          <p className="muted text-[13px]">This certifies that</p>
          <p className="h1 my-4 text-4xl">{profile.full_name}</p>
          <p className="muted text-[13px]">has successfully completed</p>
          <p className="h2 my-6 text-2xl text-yellow">{data.course.title}</p>
          {data.cert.final_score != null && (
            <p className="mono mb-4 text-sm text-green">Final score · {data.cert.final_score}%</p>
          )}
          <p className="mono muted text-xs">CERT ID · {data.cert.certificate_code}</p>
          <p className="mono muted mt-2 text-xs">Issued {new Date(data.cert.issued_at).toLocaleDateString('en-GB')}</p>
        </Panel>
      </div>
    </div>
  )
}
