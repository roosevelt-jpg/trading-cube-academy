'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEFAULT_NAVIGATION } from '@/lib/defaults/cms-defaults'
import { Btn, Logo } from '@/components/ui/academy-ui'
import type { SiteSettings } from '@/lib/types/database'
import { cn } from '@/lib/utils'

export function MarketingSiteHeader({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname()
  const navigation = settings.homepage?.navigation?.length ? settings.homepage.navigation : DEFAULT_NAVIGATION
  const ctas = {
    requestAccess: 'Request Access →',
    memberLogin: 'Member Login',
    ...settings.homepage?.ctas,
  }

  const isActive = (href: string) => {
    if (href.startsWith('#')) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="mkt-header flex-wrap gap-4">
      <Logo settings={settings} variant="banner" />
      <nav className="mkt-nav order-3 flex w-full flex-wrap gap-4 md:order-none md:w-auto md:gap-9">
        {pathname !== '/' && (
          <Link href="/" className={cn(isActive('/') && 'text-yellow')}>Home</Link>
        )}
        {navigation.map((link) => {
          const active = isActive(link.href)
          const className = cn(active && 'text-yellow')
          if (link.href.startsWith('#')) {
            const href = pathname === '/' ? link.href : `/${link.href}`
            return (
              <Link key={link.href} href={href} className={className}>{link.label}</Link>
            )
          }
          return (
            <Link key={link.href} href={link.href} className={className}>{link.label}</Link>
          )
        })}
      </nav>
      <div className="flex gap-3">
        <Btn variant="ghost" size="sm" href="/login">{ctas.memberLogin}</Btn>
        <Btn variant="primary" size="sm" href="/contact">
          {ctas.requestAccess?.replace(' →', '') ?? 'Request Access'}
        </Btn>
      </div>
    </header>
  )
}
