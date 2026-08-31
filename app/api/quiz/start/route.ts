import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { touchLastActive } from '@/lib/auth/touch-last-active'
import {
  encodeQuestionOrder,
  QUESTION_ORDER_KEY,
  shuffleQuestionIds,
} from '@/lib/quiz/order'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { moduleId: string; proctoringConsented?: boolean }
  if (!body.moduleId) return NextResponse.json({ error: 'moduleId required' }, { status: 400 })

  const service = createServiceClient()

  const [{ data: settings }, { data: priorAttempts }] = await Promise.all([
    service.from('module_quiz_settings').select('*').eq('module_id', body.moduleId).maybeSingle(),
    service.from('quiz_attempts').select('id,status,attempt_number').eq('user_id', user.id).eq('module_id', body.moduleId).order('created_at', { ascending: false }),
  ])

  const attemptsAllowed = settings?.attempts_allowed ?? 3
  const completedAttempts = (priorAttempts ?? []).filter((a) => a.status !== 'in_progress')
  if (completedAttempts.length >= attemptsAllowed) {
    return NextResponse.json({ error: 'No attempts remaining', attemptsRemaining: 0 }, { status: 403 })
  }

  const inProgress = (priorAttempts ?? []).find((a) => a.status === 'in_progress')
  if (inProgress) {
    const { data: full } = await service.from('quiz_attempts').select('*').eq('id', inProgress.id).single()
    return NextResponse.json({ attempt: full })
  }

  const now = new Date()
  const timeLimit = settings?.time_limit_seconds
  const expiresAt = timeLimit
    ? new Date(now.getTime() + timeLimit * 1000).toISOString()
    : null

  const attemptNumber = (priorAttempts?.length ?? 0) + 1

  const proctoringRequired = settings?.proctoring_required !== false
  const proctoringConsented = Boolean(body.proctoringConsented && proctoringRequired)

  const { data: questions } = await service
    .from('quiz_questions')
    .select('id')
    .eq('module_id', body.moduleId)
    .order('sort_order')

  const initialAnswers: Record<string, string> = {}
  if (settings?.question_order === 'random' && questions?.length) {
    initialAnswers[QUESTION_ORDER_KEY] = encodeQuestionOrder(
      shuffleQuestionIds(questions.map((q) => q.id)),
    )
  }

  const { data: attempt, error } = await service.from('quiz_attempts').insert({
    user_id: user.id,
    module_id: body.moduleId,
    score: 0,
    passed: false,
    answers: initialAnswers,
    attempt_number: attemptNumber,
    started_at: now.toISOString(),
    expires_at: expiresAt,
    status: 'in_progress',
    proctoring_consented_at: proctoringConsented ? now.toISOString() : null,
    proctoring_status: proctoringConsented ? 'consented' : 'none',
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await touchLastActive(supabase, user.id)
  return NextResponse.json({ attempt, timeLimitSeconds: timeLimit ?? null })
}
