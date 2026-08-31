import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { ticketId, reply } = (await request.json()) as { ticketId?: string; reply?: string }
  if (!ticketId || !reply?.trim()) {
    return NextResponse.json({ error: 'ticketId and reply required' }, { status: 400 })
  }

  const service = createServiceClient()
  const now = new Date().toISOString()
  const { data: ticket, error } = await service
    .from('support_tickets')
    .update({
      admin_reply: reply.trim(),
      replied_at: now,
      status: 'closed',
    })
    .eq('id', ticketId)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ticket })
}
