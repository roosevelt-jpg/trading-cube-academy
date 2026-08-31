import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { generateCertificatePdf } from '@/lib/certificates/generate-certificate-pdf'
import { fetchSiteSettingsMap } from '@/lib/data/server-dashboard'
import { companyName } from '@/lib/utils/site'

export async function GET(_request: Request, context: { params: Promise<{ courseSlug: string }> }) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const { courseSlug } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const { data: course } = await supabase.from('courses').select('id, title').eq('slug', courseSlug).maybeSingle()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)
    .eq('course_id', course.id)
    .maybeSingle()

  if (!cert) {
    return NextResponse.json({ error: 'Certificate not found — complete the course first.' }, { status: 404 })
  }

  const settings = await fetchSiteSettingsMap()
  const pdfBytes = await generateCertificatePdf({
    studentName: profile?.full_name ?? user.email ?? 'Student',
    courseTitle: course.title,
    certificateCode: cert.certificate_code,
    issuedAt: cert.issued_at,
    finalScore: cert.final_score,
    academyName: companyName(settings),
  })

  const filename = `${courseSlug}-certificate-${cert.certificate_code}.pdf`
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}
