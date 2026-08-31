'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'

type Fetcher<T> = (client: ReturnType<typeof createClient>) => Promise<T>

export function useRealtimeQuery<T>(table: string, fetcher: Fetcher<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { configured } = getSupabaseEnv()

  const load = useCallback(async () => {
    if (!configured) {
      setError('Supabase is not configured.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const client = createClient()
      if (!client || typeof client.from !== 'function') {
        setError('Supabase client unavailable.')
        setLoading(false)
        return
      }
      const result = await fetcher(client)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, fetcher, ...deps])

  useEffect(() => {
    void load()
    if (!configured) return
    const client = createClient()
    if (!client || typeof client.channel !== 'function') return
    const channel = client
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => { void load() })
      .subscribe()
    return () => {
      client.removeChannel(channel)
    }
  }, [table, load, configured])

  return { data, loading, error, reload: load }
}
