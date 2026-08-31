import type { SupabaseClient } from '@supabase/supabase-js'

export type EnrollmentSettings = {
  inviteOnly?: boolean
  passingScoreDefault?: number
  maxQuizAttempts?: number
  autoEnrollAllLiveCourses?: boolean
  defaultCourseIds?: string[]
  stripePriceId?: string
}

export async function loadEnrollmentSettings(service: SupabaseClient): Promise<EnrollmentSettings> {
  const { data } = await service.from('site_settings').select('value').eq('key', 'enrollment').maybeSingle()
  return (data?.value ?? {}) as EnrollmentSettings
}

export async function syncCourseEnrolledCount(service: SupabaseClient, courseId: string) {
  const { count } = await service
    .from('enrollments')
    .select('user_id', { count: 'exact', head: true })
    .eq('course_id', courseId)
  await service.from('courses').update({ enrolled_count: count ?? 0 }).eq('id', courseId)
}

export async function resolveAutoEnrollCourseIds(
  service: SupabaseClient,
  settings?: EnrollmentSettings,
  overrideCourseIds?: string[],
): Promise<string[]> {
  if (overrideCourseIds?.length) return overrideCourseIds

  const enrollment = settings ?? (await loadEnrollmentSettings(service))
  if (enrollment.defaultCourseIds?.length) return enrollment.defaultCourseIds

  if (enrollment.autoEnrollAllLiveCourses !== false) {
    const { data } = await service.from('courses').select('id').eq('published', true).eq('status', 'live')
    return (data ?? []).map((c) => c.id)
  }

  return []
}

export async function enrollStudentInCourses(
  service: SupabaseClient,
  userId: string,
  courseIds: string[],
) {
  const unique = [...new Set(courseIds.filter(Boolean))]
  if (!unique.length) return { enrolled: 0, courseIds: [] as string[] }

  await service.from('enrollments').upsert(
    unique.map((courseId) => ({ user_id: userId, course_id: courseId, progress_pct: 0 })),
    { onConflict: 'user_id,course_id', ignoreDuplicates: true },
  )

  await Promise.all(unique.map((courseId) => syncCourseEnrolledCount(service, courseId)))
  await service.from('profiles').update({ status: 'active' }).eq('id', userId).eq('status', 'pending')

  return { enrolled: unique.length, courseIds: unique }
}

export async function unenrollStudentFromCourse(
  service: SupabaseClient,
  userId: string,
  courseId: string,
) {
  await service.from('enrollments').delete().eq('user_id', userId).eq('course_id', courseId)
  await syncCourseEnrolledCount(service, courseId)
}

export async function autoEnrollStudent(
  service: SupabaseClient,
  userId: string,
  options?: { courseIds?: string[] },
) {
  const courseIds = await resolveAutoEnrollCourseIds(service, undefined, options?.courseIds)
  return enrollStudentInCourses(service, userId, courseIds)
}
