import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/supabase/env'

let browserClient: SupabaseClient | undefined

function createUnavailableClient() {
  const notConfigured = { message: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.' }
  const query: any = {
    select: () => query,
    eq: () => query,
    order: () => query,
    insert: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: notConfigured }),
    then: (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject),
  }
  const channel: any = {
    on: () => channel,
    subscribe: () => 'SUBSCRIBED',
  }

  return {
    from: () => query,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: notConfigured }),
      signUp: async () => ({ data: { user: null, session: null }, error: notConfigured }),
      signOut: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: notConfigured }),
    },
    channel: () => channel,
    removeChannel: () => {},
  } as unknown as SupabaseClient
}

export function createClient() {
  const { url, key, configured } = getSupabaseEnv()
  if (!configured || !url || !key) {
    return createUnavailableClient()
  }
  if (!browserClient) {
    browserClient = createBrowserClient(url, key)
  }
  return browserClient
}
