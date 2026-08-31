import { fetchContactPage } from '@/lib/data/marketing'
import { ContactPageView } from '@/components/marketing/contact-page'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const data = await fetchContactPage()
  return <ContactPageView settings={data?.settings ?? null} page={data?.page ?? null} />
}
