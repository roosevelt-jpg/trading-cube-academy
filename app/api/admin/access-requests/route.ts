import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const service = createServiceClient()
  const { data, error } = await service
    .from('access_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}
