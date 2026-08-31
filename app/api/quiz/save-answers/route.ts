import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { mergeQuizAnswers } from '@/lib/quiz/order'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { attemptId, answers } = (await request.json()) as {
    attemptId?: string
    answers?: Record<string, string>
  }

  if (!attemptId || !answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'attemptId and answers required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: attempt } = await service
    .from('quiz_attempts')
    .select('id, user_id, status, answers')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
  if (attempt.status !== 'in_progress') {
    return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 409 })
  }

  const merged = mergeQuizAnswers(
    (attempt.answers ?? {}) as Record<string, string>,
    answers,
  )

  const { error } = await service.from('quiz_attempts').update({ answers: merged }).eq('id', attemptId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
