import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import {
  getNextModuleSlug,
  recordActivity,
  syncCourseProgress,
} from '@/lib/progress/sync-course-progress'
import { touchLastActive } from '@/lib/auth/touch-last-active'
import { stripQuizMeta, QUESTION_ORDER_KEY } from '@/lib/quiz/order'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as {
    attemptId: string
    answers: Record<string, string>
    timedOut?: boolean
  }

  const service = createServiceClient()

  const { data: attempt } = await service
    .from('quiz_attempts')
    .select('*')
    .eq('id', body.attemptId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ error: 'Attempt already submitted', attempt }, { status: 409 })
  }

  const now = new Date()
  const expired = attempt.expires_at && new Date(attempt.expires_at).getTime() < now.getTime()
  const timedOut = body.timedOut || expired
  const gradedAnswers = stripQuizMeta(body.answers)
  const priorAnswers = (attempt.answers ?? {}) as Record<string, string>
  const storedAnswers = priorAnswers[QUESTION_ORDER_KEY]
    ? { ...gradedAnswers, [QUESTION_ORDER_KEY]: priorAnswers[QUESTION_ORDER_KEY] }
    : gradedAnswers

  const { data: mod } = await service
    .from('modules')
    .select('id, title, course_id, courses(slug, title)')
    .eq('id', attempt.module_id)
    .maybeSingle()

  const { data: questions } = await service
    .from('quiz_questions')
    .select('id, question')
    .eq('module_id', attempt.module_id)
    .order('sort_order')

  const questionIds = (questions ?? []).map((q) => q.id)
  const { data: options } = questionIds.length
    ? await service.from('quiz_options').select('id,question_id,option_text,is_correct').in('question_id', questionIds)
    : { data: [] }

  const optByQ = (options ?? []).reduce(
    (acc, o) => {
      if (!acc[o.question_id]) acc[o.question_id] = []
      acc[o.question_id].push(o)
      return acc
    },
    {} as Record<string, typeof options>,
  )

  let correct = 0
  const review = (questions ?? []).map((q) => {
    const selected = gradedAnswers[q.id] ?? null
    const qOpts = optByQ[q.id] ?? []
    const right = qOpts.find((o) => o.is_correct)
    const selectedOpt = qOpts.find((o) => o.id === selected)
    const isCorrect = !!(selected && right && selected === right.id)
    if (isCorrect) correct += 1
    return {
      questionId: q.id,
      question: q.question,
      selectedOptionId: selected,
      selectedText: selectedOpt?.option_text ?? null,
      correctOptionId: right?.id ?? null,
      correctText: right?.option_text ?? null,
      correct: isCorrect,
    }
  })

  const total = questions?.length ?? 1
  const score = Math.round((correct / total) * 100)

  const { data: settings } = await service
    .from('module_quiz_settings')
    .select('passing_score, attempts_allowed')
    .eq('module_id', attempt.module_id)
    .maybeSingle()

  const passing = settings?.passing_score ?? 70
  const attemptsAllowed = settings?.attempts_allowed ?? 3
  const passed = !timedOut && score >= passing

  const { data: updated, error } = await service
    .from('quiz_attempts')
    .update({
      score,
      passed,
      answers: storedAnswers,
      completed_at: now.toISOString(),
      timed_out: timedOut,
      status: timedOut ? 'timed_out' : 'completed',
    })
    .eq('id', attempt.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (passed) {
    await service.from('module_progress').upsert(
      {
        user_id: user.id,
        module_id: attempt.module_id,
        completed: true,
        progress_pct: 100,
        completed_at: now.toISOString(),
      },
      { onConflict: 'user_id,module_id' },
    )
  }

  const course = (mod as { courses?: { slug: string; title: string } } | null)?.courses
  const courseId = mod?.course_id
  let progress_pct = 0
  let nextModuleSlug: string | null = null

  if (courseId) {
    progress_pct = await syncCourseProgress(service, user.id, courseId)
    nextModuleSlug = passed ? await getNextModuleSlug(service, courseId, attempt.module_id) : null
  }

  const modTitle = mod?.title ?? 'Module'
  await recordActivity(
    service,
    user.id,
    passed ? 'quiz_pass' : timedOut ? 'quiz_timeout' : 'quiz_fail',
    passed
      ? `Passed ${modTitle} quiz · ${score}%`
      : timedOut
        ? `Time expired on ${modTitle} quiz`
        : `Quiz attempt · ${score}% on ${modTitle}`,
    {
      module_id: attempt.module_id,
      course_id: courseId,
      score,
      passed,
      attempt_id: attempt.id,
    },
  )

  const { count: attemptsUsed } = await service
    .from('quiz_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('module_id', attempt.module_id)
    .neq('status', 'in_progress')

  const attemptsRemaining = Math.max(0, attemptsAllowed - (attemptsUsed ?? 0))

  await touchLastActive(supabase, user.id)

  return NextResponse.json({
    attempt: updated,
    passing,
    review,
    nextModuleSlug,
    courseSlug: course?.slug ?? null,
    progress_pct,
    attemptsRemaining,
  })
}
