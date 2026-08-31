import { StudentCoursesList } from '@/components/student/student-dashboard'
import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth/guards'
import type { Course, Enrollment } from '@/lib/types/database'

export default async function Page() {
  const { profile } = await requireStudent()
  const supabase = await createClient()
  const [{ data: enrollments }, { data: courses }] = await Promise.all([
    supabase.from('enrollments').select('*').eq('user_id', profile.id),
    supabase.from('courses').select('*').eq('published', true).order('sort_order'),
  ])
  const prog = Object.fromEntries(((enrollments ?? []) as Enrollment[]).map((e) => [e.course_id, e.progress_pct]))
  const initialCourses = ((courses ?? []) as Course[])
    .filter((c) => prog[c.id] !== undefined)
    .map((c) => ({ ...c, progress_pct: prog[c.id] ?? 0 }))

  return <StudentCoursesList profile={profile} initialCourses={initialCourses} />
}
