'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils/datetime'

/** Live clock synced to the browser, updated every second. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return <span className={className}>—</span>
  return <time dateTime={now.toISOString()} className={className}>{formatDateTime(now)}</time>
}
