import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'
import { sendSupportReplyEmail } from '@/lib/integrations/email'
import { sendWhatsAppDeskNotification } from '@/lib/integrations/whatsapp'

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { ticketId, reply } = (await request.json()) as { ticketId?: string; reply?: string }
  if (!ticketId || !reply?.trim()) {
    return NextResponse.json({ error: 'ticketId and reply required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: existing } = await service.from('support_tickets').select('*').eq('id', ticketId).maybeSingle()

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

  let studentEmail: string | undefined
  let studentName = existing?.student_name ?? 'Student'
  if (existing?.user_id) {
    const { data: profile } = await service
      .from('profiles')
      .select('email, full_name')
      .eq('id', existing.user_id)
      .maybeSingle()
    studentEmail = profile?.email ?? undefined
    studentName = profile?.full_name ?? studentName
  }

  let emailSent = false
  if (studentEmail) {
    const result = await sendSupportReplyEmail({
      to: studentEmail,
      name: studentName,
      subject: existing?.subject ?? 'Support ticket',
      reply: reply.trim(),
    })
    emailSent = result.sent
  }

  void sendWhatsAppDeskNotification(
    [
      `Support reply sent to ${studentName}`,
      `Subject: ${existing?.subject ?? 'Ticket'}`,
      reply.trim().slice(0, 200),
    ].join('\n'),
  )

  return NextResponse.json({ ticket, emailSent })
}
