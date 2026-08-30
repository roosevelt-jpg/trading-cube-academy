import TradingCubeHome from '@/components/trading-cube-home'

const supportedPages = new Set(['about', 'courses', 'method', 'risk', 'psychology', 'resources', 'contact', 'faq', 'privacy', 'terms'])

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <TradingCubeHome initialPage={supportedPages.has(slug) ? slug : 'about'} />
}
