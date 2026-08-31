'use client'

import { Logo } from '@/components/ui/academy-ui'
import type { SiteSettings } from '@/lib/types/database'

export function Brand({ settings, variant = 'banner' }: { settings?: SiteSettings; variant?: 'icon' | 'banner' }) {
  return <Logo settings={settings} variant={variant} href={false} />
}
