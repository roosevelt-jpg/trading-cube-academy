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
        <div className="sb-brand"><Logo settings={settings} variant="banner" /></div>
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
  openTicketCount = 0,
}: {
  profile: Profile
  settings: SiteSettings
  children: React.ReactNode
  openTicketCount?: number
}) {
  const pathname = usePathname()
  const links: { href: string; label: string; exact?: boolean; badge?: number }[] = [
    { href: '/admin', label: '◆ Dashboard', exact: true },
    { href: '/admin/homepage', label: '◉ Homepage CMS' },
    { href: '/admin/pages', label: '◈ Pages' },
    { href: '/admin/courses', label: '▤ Courses' },
    { href: '/admin/students', label: '☺ Students' },
    { href: '/admin/access-requests', label: '◎ Access Requests' },
    { href: '/admin/support', label: '✉ Support', badge: openTicketCount > 0 ? openTicketCount : undefined },
    { href: '/admin/integrations', label: '⎈ Integrations' },
    { href: '/admin/settings', label: '⚙ Settings' },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sb-brand"><Logo settings={settings} variant="banner" /></div>
        <p className="mono px-6 pb-2 text-[10px] uppercase tracking-widest text-yellow">Admin console</p>
        <nav>
          {links.map((link) => {
            const on = link.exact ? pathname === link.href : pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} className={cn('sb-link flex items-center justify-between gap-2', on && 'on')}>
                <span>{link.label}</span>
                {'badge' in link && link.badge !== undefined && (
                  <span className="mono rounded border border-yellow px-1.5 py-0.5 text-[10px] text-yellow">{link.badge}</span>
                )}
              </Link>
            )
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
