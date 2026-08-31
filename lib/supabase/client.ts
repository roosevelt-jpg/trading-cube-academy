import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/supabase/env'

function createUnavailableClient() {
  const notConfigured = { message: 'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.' }
  const resolved = { data: [] as unknown[], error: null as null }

  const query: Record<string, unknown> = {
    select: () => query,
    eq: () => query,
    neq: () => query,
    order: () => query,
    limit: () => query,
    in: () => query,
    insert: () => query,
    update: () => query,
    upsert: () => query,
    delete: () => query,
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: notConfigured }),
    then: (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) =>
      Promise.resolve(resolved).then(resolve, reject),
  }

  const channel = {
    on: () => channel,
    subscribe: () => 'SUBSCRIBED' as const,
  }

  return {
    from: () => query,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
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
  return createBrowserClient(url, key)
}
