import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { id } = await context.params
  const service = createServiceClient()

  const { data: profile } = await service.from('profiles').select('email').eq('id', id).maybeSingle()
  if (!profile?.email) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  const tempPassword = `TCA-${Math.random().toString(36).slice(2, 10)}!`

  const { error } = await service.auth.admin.updateUserById(id, { password: tempPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, temporaryPassword: tempPassword })
}
