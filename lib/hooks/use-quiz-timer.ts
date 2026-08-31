'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatCountdown } from '@/lib/utils/datetime'

type ServerTime = { unix: number; iso: string }

/**
 * Accurate quiz countdown synced to server time via /api/time offset.
 * Calls onExpire once when remaining time hits zero.
 */
export function useQuizTimer(expiresAt: string | null, onExpire: () => void) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [offsetMs, setOffsetMs] = useState(0)
  const expiredRef = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    let cancelled = false
    fetch('/api/time')
      .then((r) => r.json())
      .then((data: ServerTime) => {
        if (!cancelled) setOffsetMs(data.unix - Date.now())
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    expiredRef.current = false
  }, [expiresAt])

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(null)
      return
    }

    const tick = () => {
      const now = Date.now() + offsetMs
      const end = new Date(expiresAt).getTime()
      const rem = end - now
      setRemainingMs(rem)
      if (rem <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpireRef.current()
      }
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [expiresAt, offsetMs])

  const formatted = formatCountdown(remainingMs)
  const urgent = remainingMs !== null && remainingMs <= 60_000

  return { remainingMs, formatted, urgent, synced: offsetMs !== 0 || remainingMs === null }
}
