import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { autoEnrollStudent, enrollStudentInCourses } from '@/lib/enrollment/service'
import { sendWelcomeEnrollmentEmail } from '@/lib/integrations/email'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { email, fullName, courseIds, enrollAllLive } = (await request.json()) as {
    email?: string
    fullName?: string
    courseIds?: string[]
    enrollAllLive?: boolean
  }
  const trimmedEmail = email?.trim().toLowerCase()
  if (!trimmedEmail) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const service = createServiceClient()
  const { data: invite, error } = await service.auth.admin.inviteUserByEmail(trimmedEmail, {
    data: { full_name: fullName?.trim() ?? trimmedEmail.split('@')[0], role: 'student' },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:43123'}/auth/callback`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (invite.user) {
    await service.from('profiles').upsert({
      id: invite.user.id,
      email: trimmedEmail,
      full_name: fullName?.trim() ?? trimmedEmail.split('@')[0],
      role: 'student',
      status: 'pending',
    })

    const enrollResult =
      enrollAllLive !== false
        ? await autoEnrollStudent(service, invite.user.id, { courseIds })
        : courseIds?.length
          ? await enrollStudentInCourses(service, invite.user.id, courseIds)
          : { enrolled: 0, courseIds: [] as string[] }

    const { data: courseRows } = enrollResult.courseIds.length
      ? await service.from('courses').select('title').in('id', enrollResult.courseIds)
      : { data: [] }

    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:43123'}/login`
    void sendWelcomeEnrollmentEmail({
      to: trimmedEmail,
      name: fullName?.trim() ?? trimmedEmail.split('@')[0],
      courseTitles: (courseRows ?? []).map((c) => c.title),
      loginUrl,
    })
  }

  return NextResponse.json({
    ok: true,
    userId: invite.user?.id,
    enrolled: invite.user ? (enrollAllLive !== false ? 'auto' : courseIds?.length ?? 0) : 0,
  })
}
