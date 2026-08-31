import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { getStripeClient, loadStripeIntegration } from '@/lib/integrations/stripe'
import { loadEnrollmentSettings } from '@/lib/enrollment/service'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { courseId?: string; mode?: 'course' | 'academy' }
  const stripe = await getStripeClient()
  const integration = await loadStripeIntegration()

  if (!stripe || !integration?.publishableKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const service = createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:43123'
  const enrollment = await loadEnrollmentSettings(service)

  let priceId: string | null = null
  let courseId: string | null = null

  if (body.mode === 'course' && body.courseId) {
    const { data: course } = await service
      .from('courses')
      .select('id, stripe_price_id, title')
      .eq('id', body.courseId)
      .maybeSingle()
    priceId = course?.stripe_price_id ?? null
    courseId = course?.id ?? null
    if (!priceId) {
      return NextResponse.json({ error: 'This course does not have a Stripe price configured' }, { status: 400 })
    }
  } else {
    priceId = enrollment.stripePriceId ?? null
    if (!priceId) {
      return NextResponse.json({ error: 'Academy membership price is not configured in Settings' }, { status: 400 })
    }
  }

  const { data: profile } = await service.from('profiles').select('email').eq('id', user.id).maybeSingle()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: profile?.email ?? user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/student/courses?checkout=success`,
    cancel_url: `${siteUrl}/student/courses?checkout=cancelled`,
    metadata: {
      user_id: user.id,
      course_id: courseId ?? '',
      price_id: priceId,
    },
  })

  await service.from('payment_sessions').insert({
    user_id: user.id,
    email: profile?.email ?? user.email,
    stripe_session_id: session.id,
    stripe_price_id: priceId,
    course_id: courseId,
    status: 'pending',
  })

  return NextResponse.json({ url: session.url, sessionId: session.id })
}
