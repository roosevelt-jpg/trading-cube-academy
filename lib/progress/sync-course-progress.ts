import type { SupabaseClient } from '@supabase/supabase-js'

function certCode() {
  const n = Math.floor(10000 + Math.random() * 90000)
  return `CERT-${n}`
}

export async function recordActivity(
  service: SupabaseClient,
  userId: string,
  eventType: string,
  title: string,
  meta: Record<string, unknown> = {},
) {
  await service.from('activity_events').insert({
    event_type: eventType,
    title,
    meta: { user_id: userId, ...meta },
  })
}

export async function syncCourseProgress(
  service: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<number> {
  const { data: modules } = await service
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('sort_order')

  const moduleIds = (modules ?? []).map((m) => m.id)
  if (!moduleIds.length) return 0

  const [{ data: lessons }, { data: lessonProgress }, { data: moduleProgress }] = await Promise.all([
    service.from('lessons').select('id, module_id, lesson_type').in('module_id', moduleIds),
    service.from('lesson_progress').select('lesson_id, completed').eq('user_id', userId),
    service.from('module_progress').select('module_id, completed').eq('user_id', userId),
  ])

  const completedLessons = new Set(
    (lessonProgress ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
  )
  const completedModules = new Set(
    (moduleProgress ?? []).filter((p) => p.completed).map((p) => p.module_id),
  )

  let total = 0
  let done = 0
  for (const lesson of lessons ?? []) {
    total += 1
    if (lesson.lesson_type === 'quiz') {
      if (completedModules.has(lesson.module_id)) done += 1
    } else if (completedLessons.has(lesson.id)) {
      done += 1
    }
  }

  const progress_pct = total === 0 ? 0 : Math.round((done / total) * 100)

  await service
    .from('enrollments')
    .update({ progress_pct })
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (progress_pct >= 100) {
    await issueCertificateIfNeeded(service, userId, courseId, moduleIds)
  }

  return progress_pct
}

async function issueCertificateIfNeeded(
  service: SupabaseClient,
  userId: string,
  courseId: string,
  moduleIds: string[],
) {
  const { data: existing } = await service
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (existing) return

  const { data: attempts } = await service
    .from('quiz_attempts')
    .select('score, module_id')
    .eq('user_id', userId)
    .in('module_id', moduleIds)
    .eq('passed', true)
    .order('completed_at', { ascending: false })

  const byModule = new Map<string, number>()
  for (const a of attempts ?? []) {
    if (!byModule.has(a.module_id)) byModule.set(a.module_id, a.score)
  }
  const scores = [...byModule.values()]
  const final_score = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : 100

  let code = certCode()
  for (let i = 0; i < 5; i++) {
    const { error } = await service.from('certificates').insert({
      user_id: userId,
      course_id: courseId,
      certificate_code: code,
      final_score,
    })
    if (!error) {
      await recordActivity(service, userId, 'certificate_issued', 'Course certificate issued', {
        course_id: courseId,
        certificate_code: code,
        final_score,
      })
      return
    }
    code = certCode()
  }
}

export async function findResumeLesson(service: SupabaseClient, userId: string) {
  const { data: enrollments } = await service
    .from('enrollments')
    .select('course_id, courses(id,slug,title)')
    .eq('user_id', userId)

  for (const enrollment of enrollments ?? []) {
    const course = (enrollment as { courses?: { id: string; slug: string; title: string } }).courses
    if (!course) continue

    const { data: modules } = await service
      .from('modules')
      .select('id, slug, title, sort_order')
      .eq('course_id', course.id)
      .order('sort_order')

    const { data: lessonProgress } = await service
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)

    const { data: moduleProgress } = await service
      .from('module_progress')
      .select('module_id, completed')
      .eq('user_id', userId)

    const doneLessons = new Set(
      (lessonProgress ?? []).filter((p) => p.completed).map((p) => p.lesson_id),
    )
    const doneModules = new Set(
      (moduleProgress ?? []).filter((p) => p.completed).map((p) => p.module_id),
    )

    for (const mod of modules ?? []) {
      const { data: lessons } = await service
        .from('lessons')
        .select('id, slug, title, lesson_type, sort_order')
        .eq('module_id', mod.id)
        .order('sort_order')

      for (let i = 0; i < (lessons ?? []).length; i++) {
        const lesson = lessons![i]
        if (lesson.lesson_type === 'quiz') {
          if (!doneModules.has(mod.id)) {
            return {
              kind: 'quiz' as const,
              course,
              module: mod,
              lesson,
            }
          }
          continue
        }
        if (!doneLessons.has(lesson.id)) {
          const prevOk = i === 0 || doneLessons.has(lessons![i - 1].id)
          if (prevOk) {
            return {
              kind: 'lesson' as const,
              course,
              module: mod,
              lesson,
            }
          }
        }
      }
    }
  }

  return null
}

export async function getNextModuleSlug(
  service: SupabaseClient,
  courseId: string,
  currentModuleId: string,
): Promise<string | null> {
  const { data: modules } = await service
    .from('modules')
    .select('id, slug, sort_order')
    .eq('course_id', courseId)
    .order('sort_order')

  const idx = (modules ?? []).findIndex((m) => m.id === currentModuleId)
  if (idx < 0 || idx >= (modules ?? []).length - 1) return null
  return modules![idx + 1].slug
}
