'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { mergeSettings } from '@/lib/defaults/cms-defaults'
import {
  defaultSupportContact,
  resolveSupportFromSettings,
  type SupportContact,
} from '@/lib/support/contact'
import type { SiteSettings } from '@/lib/types/database'
import { whatsappUrl } from '@/lib/utils/site'

export function useSupportContact(initialSettings?: SiteSettings) {
  const initial = initialSettings ? { ...resolveSupportFromSettings(initialSettings), apiEnabled: false } : defaultSupportContact()
  const [contact, setContact] = useState<SupportContact>(initial)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const refresh = async () => {
      try {
        const res = await fetch('/api/support/contact', { cache: 'no-store' })
        if (res.ok) setContact((await res.json()) as SupportContact)
      } catch {
        // Keep last known contact details when the API is unavailable.
      }
    }

    void refresh()

    if (!getSupabaseEnv().configured) return

    const client = createClient()
    void (async () => {
      const { data: { session } } = await client.auth.getSession()
      let channel = client
        .channel('support-contact-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, async () => {
          const { data } = await client.from('site_settings').select('key,value')
          const settings = mergeSettings(Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))) as SiteSettings
          setContact((prev) => {
            const next = resolveSupportFromSettings(settings)
            return { ...prev, ...next, waUrl: whatsappUrl(next.whatsapp) }
          })
          void refresh()
        })

      if (session) {
        channel = channel.on('postgres_changes', { event: '*', schema: 'public', table: 'integration_settings' }, () => {
          void refresh()
        })
      }

      channelRef.current = channel.subscribe()
    })()

    return () => {
      if (channelRef.current) client.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  return contact
}
