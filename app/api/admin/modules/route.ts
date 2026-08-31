import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { courseId, title } = (await request.json()) as { courseId?: string; title?: string }
  if (!courseId || !title?.trim()) {
    return NextResponse.json({ error: 'courseId and title required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: modules } = await service
    .from('modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sort_order = (modules?.[0]?.sort_order ?? 0) + 1
  const slug = `${slugify(title)}-${sort_order}`

  const { data: mod, error } = await service
    .from('modules')
    .insert({
      course_id: courseId,
      slug,
      title: title.trim(),
      sort_order,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: enrollmentRow } = await service
    .from('site_settings')
    .select('value')
    .eq('key', 'enrollment')
    .maybeSingle()
  const enrollment = (enrollmentRow?.value ?? {}) as {
    passingScoreDefault?: number
    maxQuizAttempts?: number
  }

  await service.from('module_quiz_settings').insert({
    module_id: mod.id,
    passing_score: enrollment.passingScoreDefault ?? 70,
    attempts_allowed: enrollment.maxQuizAttempts ?? 3,
    question_order: 'sequential',
    proctoring_required: true,
  })

  const { count } = await service.from('modules').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
  await service.from('courses').update({ module_count: count ?? 0 }).eq('id', courseId)

  return NextResponse.json({ module: mod })
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { moduleIds } = (await request.json()) as { moduleIds?: string[] }
  if (!moduleIds?.length) return NextResponse.json({ error: 'moduleIds required' }, { status: 400 })

  const service = createServiceClient()
  for (let i = 0; i < moduleIds.length; i++) {
    await service.from('modules').update({ sort_order: i + 1 }).eq('id', moduleIds[i])
  }

  return NextResponse.json({ ok: true })
}
