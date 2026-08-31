import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { sendWhatsAppDeskNotification } from '@/lib/integrations/whatsapp'
import { sendTransactionalEmail } from '@/lib/integrations/email'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 })
  }

  const body = await request.json() as {
    full_name?: string
    email?: string
    message?: string
  }

  const full_name = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const message = body.message?.trim() ?? ''

  if (!full_name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('access_requests')
    .insert({ full_name, email, message })
    .select('id, full_name, email, message, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  void sendWhatsAppDeskNotification(
    [
      'New Trading Cube access request',
      `Name: ${full_name}`,
      `Email: ${email}`,
      message ? `Message: ${message}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
  )

  const service = createServiceClient()
  const { data: supportRow } = await service.from('site_settings').select('value').eq('key', 'support').maybeSingle()
  const supportEmail = (supportRow?.value as { email?: string } | undefined)?.email ?? 'support@thetradingcube.com'
  void sendTransactionalEmail({
    to: supportEmail,
    subject: `New access request — ${full_name}`,
    html: `<p><strong>${full_name}</strong> (${email}) requested access.</p>${message ? `<p>${message}</p>` : ''}<p>Review in Admin → Access Requests.</p>`,
    text: `${full_name} (${email}) requested access.${message ? `\n\n${message}` : ''}`,
  })

  return NextResponse.json({ request: data })
}
