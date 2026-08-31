import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { getStripeClient, loadStripeIntegration } from '@/lib/integrations/stripe'
import {
  autoEnrollStudent,
  enrollStudentInCourses,
  loadEnrollmentSettings,
} from '@/lib/enrollment/service'
import { sendWelcomeEnrollmentEmail } from '@/lib/integrations/email'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const integration = await loadStripeIntegration()
  const stripe = await getStripeClient()
  if (!stripe || !integration?.webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, integration.webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  const userId = session.metadata?.user_id
  const courseId = session.metadata?.course_id || null
  const service = createServiceClient()

  await service
    .from('payment_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('stripe_session_id', session.id)

  if (!userId) return NextResponse.json({ received: true })

  let enrollResult
  if (courseId) {
    enrollResult = await enrollStudentInCourses(service, userId, [courseId])
  } else {
    enrollResult = await autoEnrollStudent(service, userId)
  }

  const { data: profile } = await service.from('profiles').select('email, full_name').eq('id', userId).maybeSingle()
  const { data: courseRows } = enrollResult.courseIds.length
    ? await service.from('courses').select('title').in('id', enrollResult.courseIds)
    : { data: [] }

  if (profile?.email) {
    void sendWelcomeEnrollmentEmail({
      to: profile.email,
      name: profile.full_name ?? 'Student',
      courseTitles: (courseRows ?? []).map((c) => c.title),
      loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:43123'}/login`,
    })
  }

  return NextResponse.json({ received: true, enrolled: enrollResult.enrolled })
}
