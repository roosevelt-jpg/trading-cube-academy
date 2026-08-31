import { fetchContactPage, fetchMarketingData } from '@/lib/data/marketing'
import { MarketingHomepageView } from '@/components/marketing/marketing-homepage'
import { ContactPageView } from '@/components/marketing/contact-page'

export const dynamic = 'force-dynamic'

export default async function CmsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'contact') {
    const data = await fetchContactPage()
    return <ContactPageView settings={data?.settings ?? null} page={data?.page ?? null} />
  }

  const initialData = await fetchMarketingData()
  return <MarketingHomepageView initialData={initialData} />
}
