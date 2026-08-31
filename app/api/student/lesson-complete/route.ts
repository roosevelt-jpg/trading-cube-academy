import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { recordActivity, syncCourseProgress } from '@/lib/progress/sync-course-progress'
import { touchLastActive } from '@/lib/auth/touch-last-active'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = (await request.json()) as { lessonId?: string }
  if (!lessonId) return NextResponse.json({ error: 'lessonId required' }, { status: 400 })

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, lesson_type, modules(id, course_id, courses(title))')
    .eq('id', lessonId)
    .maybeSingle()

  if (!lesson || lesson.lesson_type === 'quiz') {
    return NextResponse.json({ error: 'Invalid lesson' }, { status: 400 })
  }

  const mod = (lesson as { modules?: { id: string; course_id: string; courses?: { title?: string } } }).modules
  if (!mod?.course_id) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })

  const now = new Date().toISOString()
  const { error: progressError } = await supabase.from('lesson_progress').upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      progress_pct: 100,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,lesson_id' },
  )

  if (progressError) return NextResponse.json({ error: progressError.message }, { status: 500 })

  const service = createServiceClient()
  const courseTitle = mod.courses?.title ?? 'Course'
  const eventTitle =
    lesson.lesson_type === 'video'
      ? `Watched — ${lesson.title}`
      : `Completed — ${lesson.title}`

  await recordActivity(service, user.id, 'lesson_complete', eventTitle, {
    lesson_id: lessonId,
    course_id: mod.course_id,
    module_id: mod.id,
    lesson_type: lesson.lesson_type,
  })

  const progress_pct = await syncCourseProgress(service, user.id, mod.course_id)

  await touchLastActive(supabase, user.id)

  return NextResponse.json({ ok: true, progress_pct })
}
