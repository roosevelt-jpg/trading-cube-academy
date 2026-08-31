'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/ui/academy-ui'
import { LiveClock } from '@/components/ui/live-clock'
import { ProfileMenu } from '@/components/ui/profile-menu'
import { WhatsAppFloatButton } from '@/components/ui/whatsapp-float-button'
import type { Profile, SiteSettings } from '@/lib/types/database'
import { cn } from '@/lib/utils'

const studentLinks = [
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sb-brand"><Logo settings={settings} /></div>
        <nav>
          {studentLinks.map((link) => {
            const on = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} className={cn('sb-link', on && 'on')}>{link.label}</Link>
            )
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="topbar">
          <div>
            <p className="mono muted text-[11px]">WELCOME BACK</p>
            <p className="h2 text-lg">{profile.full_name}</p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <LiveClock />
            <ProfileMenu profile={profile} settingsHref="/student/profile" />
          </div>
        </div>
        {children}
        <WhatsAppFloatButton settings={settings} context="student" profile={profile} />
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
  const links = [
    { href: '/admin', label: '◆ Dashboard', exact: true },
    { href: '/admin/pages', label: '◈ Pages' },
    { href: '/admin/courses', label: '▤ Courses' },
    { href: '/admin/students', label: '☺ Students' },
    { href: '/admin/support', label: '✉ Support' },
    { href: '/admin/integrations', label: '⎈ Integrations' },
    { href: '/admin/settings', label: '⚙ Settings' },
  ]

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
      </aside>
      <div className="min-w-0">
        <div className="topbar">
          <p className="mono muted text-xs">Admin control center</p>
          <div className="flex shrink-0 items-center gap-4">
            <LiveClock />
            <ProfileMenu profile={profile} settingsHref="/admin/settings" />
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
