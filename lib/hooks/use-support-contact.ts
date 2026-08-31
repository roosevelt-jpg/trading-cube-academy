'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'
import {
  defaultSupportContact,
  resolveSupportFromSettings,
  type SupportContact,
} from '@/lib/support/contact'
import type { SiteSettings } from '@/lib/types/database'

export function useSupportContact(initialSettings?: SiteSettings) {
  const initial = initialSettings ? { ...resolveSupportFromSettings(initialSettings), apiEnabled: false } : defaultSupportContact()
  const [contact, setContact] = useState<SupportContact>(initial)

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
    const channel = client
      .channel(`support-contact-sync-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        void refresh()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integration_settings' }, () => {
        void refresh()
      })
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [])

  return contact
}
