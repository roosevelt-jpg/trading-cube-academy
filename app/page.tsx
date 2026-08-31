import { fetchMarketingData } from '@/lib/data/marketing'
import { MarketingHomepageView } from '@/components/marketing/marketing-homepage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const initialData = await fetchMarketingData()
  return <MarketingHomepageView initialData={initialData} />
}
