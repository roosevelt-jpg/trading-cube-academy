'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'

type Fetcher<T> = (client: ReturnType<typeof createClient>) => Promise<T>

export function useRealtimeQuery<T>(
  table: string,
  fetcher: Fetcher<T>,
  deps: unknown[] = [],
  initialData?: T | null,
) {
  const [data, setData] = useState<T | null>(initialData ?? null)
  const [loading, setLoading] = useState(initialData === undefined)
  const [error, setError] = useState<string | null>(null)
  const { configured } = getSupabaseEnv()
  const mounted = useRef(true)

  const load = useCallback(
    async (background = false) => {
      if (!configured) {
        setError('Supabase is not configured.')
        setLoading(false)
        return
      }
      if (!background) setLoading(true)
      setError(null)
      try {
        const client = createClient()
        await client.auth.getSession()
        const result = await fetcher(client)
        if (mounted.current) setData(result)
      } catch (e) {
        if (mounted.current) setError(e instanceof Error ? e.message : 'Failed to load data')
      } finally {
        if (mounted.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configured, fetcher, ...deps],
  )

  useEffect(() => {
    mounted.current = true
    if (initialData === undefined) void load(false)
    else void load(true)

    if (!configured) return () => { mounted.current = false }

    const client = createClient()
    if (typeof client.channel !== 'function') return () => { mounted.current = false }

    const channel = client
      .channel(`realtime-${table}-${deps.join('-')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        void load(true)
      })
      .subscribe()

    return () => {
      mounted.current = false
      client.removeChannel(channel)
    }
  }, [table, configured, load, initialData === undefined]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: () => load(false) }
}
