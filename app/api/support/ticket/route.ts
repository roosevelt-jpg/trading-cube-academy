import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { sendWhatsAppDeskNotification } from '@/lib/integrations/whatsapp'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const body = await request.json() as { subject?: string; message?: string }
  const subject = body.subject?.trim()
  const message = body.message?.trim()

  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: user.id,
      student_name: profile?.full_name ?? null,
      subject,
      message,
      channel: 'platform',
    })
    .select('id, subject, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  void sendWhatsAppDeskNotification(
    [
      'New Trading Cube support ticket',
      `Student: ${profile?.full_name ?? 'Unknown'} (${profile?.email ?? user.email ?? 'no email'})`,
      `Subject: ${subject}`,
      `Message: ${message}`,
    ].join('\n'),
  )

  return NextResponse.json({ ticket: data })
}
