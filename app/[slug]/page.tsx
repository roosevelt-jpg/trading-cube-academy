import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { ContactPage } from '@/components/marketing/contact-page'
import { MarketingHomepage } from '@/components/marketing/marketing-homepage'

export default async function CmsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'contact') return <ContactPage />

  const { configured } = getSupabaseEnv()
  if (!configured) return <MarketingHomepage />

  const supabase = await createClient()
  const { data: page } = await supabase.from('page_contents').select('*').eq('slug', slug).maybeSingle()
  if (!page) notFound()

  // Generic CMS page renderer could be added; contact is the primary CMS page in seed
  return <ContactPage />
}
