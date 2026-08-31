import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'
import {
  autoEnrollStudent,
  enrollStudentInCourses,
  unenrollStudentFromCourse,
} from '@/lib/enrollment/service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { id } = await params
  const service = createServiceClient()
  const [{ data: enrollments }, { data: courses }] = await Promise.all([
    service.from('enrollments').select('course_id, progress_pct, enrolled_at, courses(id,title,slug,status)').eq('user_id', id),
    service.from('courses').select('id,title,slug,status,published').order('sort_order'),
  ])

  return NextResponse.json({ enrollments: enrollments ?? [], courses: courses ?? [] })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { id } = await params
  const body = (await request.json()) as { courseIds?: string[]; enrollAllLive?: boolean }
  const service = createServiceClient()

  let result
  if (body.enrollAllLive) {
    result = await autoEnrollStudent(service, id)
  } else if (body.courseIds?.length) {
    result = await enrollStudentInCourses(service, id, body.courseIds)
  } else {
    return NextResponse.json({ error: 'courseIds or enrollAllLive required' }, { status: 400 })
  }

  return NextResponse.json({ ok: true, ...result })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { id } = await params
  const { courseId } = (await request.json()) as { courseId?: string }
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const service = createServiceClient()
  await unenrollStudentFromCourse(service, id, courseId)
  return NextResponse.json({ ok: true })
}
