'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils/datetime'
import { cn } from '@/lib/utils'

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}

/** Live clock synced to the browser, updated every second. */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) {
    return (
      <div className={cn('live-clock text-right', className)}>
        <p className="mono muted text-[10px] uppercase tracking-wider">—</p>
        <p className="mono text-xs tabular-nums">—</p>
      </div>
    )
  }

  const time = now.toLocaleTimeString('en-GB', TIME_OPTS)

  return (
    <div className={cn('live-clock text-right', className)}>
      <p className="mono muted text-[10px] uppercase tracking-wider">{formatDate(now)}</p>
      <time dateTime={now.toISOString()} className="mono text-xs tabular-nums">
        {time}
      </time>
    </div>
  )
}
