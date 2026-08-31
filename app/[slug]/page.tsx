import { notFound } from 'next/navigation'
import { fetchCmsPage, fetchContactPage } from '@/lib/data/marketing'
import { CmsPageView } from '@/components/marketing/cms-page-view'
import { ContactPageView } from '@/components/marketing/contact-page'

export const dynamic = 'force-dynamic'

export default async function CmsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (slug === 'contact') {
    const data = await fetchContactPage()
    return <ContactPageView settings={data.settings} page={data.page} />
  }

  const { settings, page } = await fetchCmsPage(slug)
  if (!page) notFound()
  return <CmsPageView page={page} settings={settings} />
}
