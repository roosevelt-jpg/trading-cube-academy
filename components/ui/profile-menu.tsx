'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOutAction } from '@/lib/auth/actions'
import { Avatar } from '@/components/ui/academy-ui'
import type { Profile } from '@/lib/types/database'
import { cn } from '@/lib/utils'

export function ProfileMenu({
  profile,
  settingsHref,
}: {
  profile: Profile
  settingsHref: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const signOut = async () => {
    setSigningOut(true)
    await signOutAction()
    router.refresh()
  }

  const initials = profile.avatar_initials ?? profile.full_name?.slice(0, 2).toUpperCase() ?? 'U'
  const label = profile.full_name ?? profile.email ?? 'Account'

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="hidden text-right sm:block">
          <p className="mono text-[10px] uppercase tracking-wider text-muted">{profile.role}</p>
          <p className="text-sm font-semibold">{profile.email ?? label}</p>
        </div>
        <Avatar initials={initials} size={36} />
      </button>

      <div className={cn('profile-menu-dropdown', open && 'open')} role="menu">
        <div className="border-b border-[var(--border-soft)] px-4 py-3">
          <p className="font-semibold">{label}</p>
          <p className="mono muted text-xs">{profile.email}</p>
        </div>
        <Link href={settingsHref} className="profile-menu-item" onClick={() => setOpen(false)}>
          Profile settings
        </Link>
        <Link href={settingsHref} className="profile-menu-item" onClick={() => setOpen(false)}>
          Profile picture
        </Link>
        <button
          type="button"
          className="profile-menu-item w-full text-left text-red-400"
          disabled={signingOut}
          onClick={() => void signOut()}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}
