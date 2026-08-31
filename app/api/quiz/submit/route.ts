import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
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

  const { data: questions } = await service
    .from('quiz_questions')
    .select('id')
    .eq('module_id', attempt.module_id)
    .order('sort_order')

  const questionIds = (questions ?? []).map((q) => q.id)
  const { data: options } = questionIds.length
    ? await service.from('quiz_options').select('id,question_id,is_correct').in('question_id', questionIds)
    : { data: [] }

  let correct = 0
  for (const q of questions ?? []) {
    const selected = body.answers[q.id]
    const right = (options ?? []).find((o) => o.question_id === q.id && o.is_correct)
    if (selected && right && selected === right.id) correct++
  }

  const total = questions?.length ?? 1
  const score = Math.round((correct / total) * 100)

  const { data: settings } = await service
    .from('module_quiz_settings')
    .select('passing_score')
    .eq('module_id', attempt.module_id)
    .maybeSingle()

  const passing = settings?.passing_score ?? 70
  const passed = !timedOut && score >= passing

  const { data: updated, error } = await service
    .from('quiz_attempts')
    .update({
      score,
      passed,
      answers: body.answers,
      completed_at: now.toISOString(),
      timed_out: timedOut,
      status: timedOut ? 'timed_out' : 'completed',
    })
    .eq('id', attempt.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (passed) {
    await service.from('module_progress').upsert({
      user_id: user.id,
      module_id: attempt.module_id,
      completed: true,
      progress_pct: 100,
      completed_at: now.toISOString(),
    }, { onConflict: 'user_id,module_id' })
  }

  return NextResponse.json({ attempt: updated, passing })
}
