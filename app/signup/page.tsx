import { Suspense } from 'react'
import { fetchSiteSettings } from '@/lib/data/marketing'
import { AuthForm } from '@/components/auth/auth-form'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const settings = await fetchSiteSettings()
  return (
    <Suspense>
      <AuthForm mode="signup" settings={settings} />
    </Suspense>
  )
}
