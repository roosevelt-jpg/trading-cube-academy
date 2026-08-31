import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { email, fullName } = (await request.json()) as { email?: string; fullName?: string }
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
  }

  return NextResponse.json({ ok: true, userId: invite.user?.id })
}
