import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { autoEnrollStudent, enrollStudentInCourses } from '@/lib/enrollment/service'
import { sendWelcomeEnrollmentEmail } from '@/lib/integrations/email'
import { sendWhatsAppDeskNotification } from '@/lib/integrations/whatsapp'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { id } = await params
  const body = (await request.json()) as { courseIds?: string[]; enrollAllLive?: boolean }
  const service = createServiceClient()

  const { data: requestRow } = await service
    .from('access_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!requestRow) return NextResponse.json({ error: 'Access request not found' }, { status: 404 })
  if (requestRow.status !== 'pending') {
    return NextResponse.json({ error: 'Request already processed' }, { status: 409 })
  }

  const email = requestRow.email.trim().toLowerCase()
  const fullName = requestRow.full_name?.trim() ?? email.split('@')[0]

  const { data: invite, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role: 'student' },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:43123'}/auth/callback`,
  })

  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 500 })

  const userId = invite.user?.id
  if (userId) {
    await service.from('profiles').upsert({
      id: userId,
      email,
      full_name: fullName,
      role: 'student',
      status: 'pending',
    })

    const enrollResult = body.enrollAllLive !== false
      ? await autoEnrollStudent(service, userId, { courseIds: body.courseIds })
      : body.courseIds?.length
        ? await enrollStudentInCourses(service, userId, body.courseIds)
        : { enrolled: 0, courseIds: [] as string[] }

    const { data: courseRows } = enrollResult.courseIds.length
      ? await service.from('courses').select('title').in('id', enrollResult.courseIds)
      : { data: [] }

    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:43123'}/login`
    void sendWelcomeEnrollmentEmail({
      to: email,
      name: fullName,
      courseTitles: (courseRows ?? []).map((c) => c.title),
      loginUrl,
    })

    void sendWhatsAppDeskNotification(
      [`Access request approved for ${fullName} (${email})`, `Enrolled in ${enrollResult.enrolled} course(s)`].join('\n'),
    )
  }

  await service
    .from('access_requests')
    .update({ status: 'approved' })
    .eq('id', id)

  return NextResponse.json({ ok: true, userId, invited: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { id } = await params
  const { status } = (await request.json()) as { status?: 'rejected' }
  if (status !== 'rejected') return NextResponse.json({ error: 'Only rejection supported via PATCH' }, { status: 400 })

  const service = createServiceClient()
  await service.from('access_requests').update({ status: 'rejected' }).eq('id', id)
  return NextResponse.json({ ok: true })
}
