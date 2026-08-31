import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { sendWhatsAppDeskNotification } from '@/lib/integrations/whatsapp'

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

  return NextResponse.json({ request: data })
}
