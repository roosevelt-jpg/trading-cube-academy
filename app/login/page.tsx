import { Suspense } from 'react'
import { fetchSiteSettings } from '@/lib/data/marketing'
import { AuthForm } from '@/components/auth/auth-form'

export const dynamic = 'force-dynamic'

const ERROR_HINTS: Record<string, string> = {
  supabase: 'Supabase is not configured. Check .env.local and restart the dev server.',
  profile: 'Signed in, but no profile was found. Run node scripts/seed-auth-users.mjs',
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const settings = await fetchSiteSettings()
  const params = await searchParams
  const initialMessage = params.error ? ERROR_HINTS[params.error] ?? 'Sign-in failed. Try again.' : undefined
  return (
    <Suspense>
      <AuthForm mode="login" settings={settings} initialMessage={initialMessage} />
    </Suspense>
  )
}
