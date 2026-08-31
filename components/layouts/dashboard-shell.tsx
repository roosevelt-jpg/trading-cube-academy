'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, Btn, Logo } from '@/components/ui/academy-ui'
import type { Profile, SiteSettings } from '@/lib/types/database'
import { cn } from '@/lib/utils'

const links = [
  { href: '/student', label: '◆ Dashboard', exact: true },
  { href: '/student/courses', label: '▤ My Courses' },
  { href: '/student/profile', label: '● Profile' },
  { href: '/student/support', label: '✉ Support' },
]

export function StudentShell({
  profile,
  settings,
  children,
}: {
  profile: Profile
  settings: SiteSettings
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    const client = createClient()
    await client.auth.signOut()
    router.push('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sb-brand"><Logo settings={settings} /></div>
        <nav>
          {links.map((link) => {
            const on = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} className={cn('sb-link', on && 'on')}>{link.label}</Link>
            )
          })}
        </nav>
        <div className="mt-auto px-6 pt-8">
          <button type="button" className="btn btn-ghost btn-sm w-full" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="topbar">
          <div className="flex items-center gap-3">
            <Avatar initials={profile.avatar_initials ?? 'ST'} />
            <div>
              <p className="mono muted text-[11px]">WELCOME BACK</p>
              <p className="h2 text-xl">{profile.full_name}</p>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AdminShell({
  profile,
  settings,
  children,
}: {
  profile: Profile
  settings: SiteSettings
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const links = [
    { href: '/admin', label: '◆ Dashboard', exact: true },
    { href: '/admin/pages', label: '◈ Pages' },
    { href: '/admin/courses', label: '▤ Courses' },
    { href: '/admin/students', label: '☺ Students' },
    { href: '/admin/support', label: '✉ Support' },
    { href: '/admin/settings', label: '⚙ Settings' },
  ]

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sb-brand"><Logo settings={settings} /></div>
        <p className="mono px-6 pb-2 text-[10px] uppercase tracking-widest text-yellow">Admin console</p>
        <nav>
          {links.map((link) => {
            const on = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return <Link key={link.href} href={link.href} className={cn('sb-link', on && 'on')}>{link.label}</Link>
          })}
        </nav>
        <div className="px-6 pt-8">
          <Btn variant="ghost" size="sm" onClick={signOut} className="w-full">Sign out</Btn>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="topbar">
          <p className="mono muted text-xs">Signed in as {profile.email}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
