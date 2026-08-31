'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { companyName, logoBannerSrc, logoIconSrc } from '@/lib/utils/site'
import { resolveSupportFromSettings, supportContactUrl } from '@/lib/support/contact'
import type { SiteSettings } from '@/lib/types/database'

type LogoProps = {
  settings?: SiteSettings
  className?: string
  variant?: 'icon' | 'banner'
  href?: string | false
}

export function Logo({ settings, className, variant = 'icon', href = '/' }: LogoProps) {
  const src = variant === 'banner' ? logoBannerSrc(settings) : logoIconSrc(settings)
  const alt = companyName(settings)
  const img = (
    <img
      src={src}
      alt={alt}
      className={cn(
        'object-contain',
        variant === 'banner' ? 'logo-banner h-10 w-auto max-w-[min(220px,100%)]' : 'logo-icon size-9 shrink-0',
      )}
    />
  )
  if (href === false) {
    return <span className={cn('logo inline-flex items-center', className)}>{img}</span>
  }
  return (
    <Link href={href} className={cn('logo inline-flex items-center', className)} aria-label={alt}>
      {img}
    </Link>
  )
}

export function Panel({
  children,
  className,
  sm,
}: {
  children: React.ReactNode
  className?: string
  sm?: boolean
}) {
  return <div className={cn('panel', sm && 'panel-sm', className)}>{children}</div>
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('eyebrow', className)}>{children}</p>
}

export function Btn({
  children,
  className,
  variant = 'primary',
  size,
  href,
  target,
  rel,
  onClick,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode
  className?: string
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm'
  href?: string
  target?: string
  rel?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const cls = cn('btn', variant === 'primary' && 'btn-primary', variant === 'ghost' && 'btn-ghost', variant === 'danger' && 'btn-danger', size === 'sm' && 'btn-sm', className)
  if (href) {
    const external = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
    if (external) return <a href={href} className={cls} target={target} rel={rel}>{children}</a>
    return <Link href={href} className={cls}>{children}</Link>
  }
  return <button type={type} className={cls} onClick={onClick} disabled={disabled}>{children}</button>
}

export function Pill({ children, className, tone }: { children: React.ReactNode; className?: string; tone?: 'yellow' | 'green' | 'red' }) {
  return <span className={cn('pill', tone === 'yellow' && 'pill-yellow', tone === 'green' && 'pill-green', tone === 'red' && 'pill-red', className)}>{children}</span>
}

export function ProgressTrack({ value, green }: { value: number; green?: boolean }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: green ? 'var(--green)' : undefined }} />
    </div>
  )
}

export function Avatar({ initials, size = 38 }: { initials: string; size?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, flex: `0 0 ${size}px`, fontSize: size < 32 ? 11 : 13 }}>
      {initials}
    </div>
  )
}

export function Candles({ total, done = 0, current }: { total: number; done?: number; current?: boolean }) {
  const heights = [14, 22, 10, 18, 12, 24, 20, 16]
  return (
    <div className="candles">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn('candle', i < done ? 'done' : i === done && current ? 'current' : 'locked')}
          style={{ height: `${heights[i % heights.length]}px` }}
        />
      ))}
    </div>
  )
}

export function HelpBlock({ settings }: { settings?: SiteSettings }) {
  const contact = resolveSupportFromSettings(settings)
  const email = contact.email
  const waHref = supportContactUrl(contact, 'lesson')
  return (
    <Panel className="help-block">
      <div>
        <Eyebrow className="mb-1.5">Need More Help?</Eyebrow>
        <p className="text-[13px] text-muted">Stuck on this lesson? Reach the Trading Cube team directly.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Btn variant="ghost" size="sm" href={waHref} target="_blank" rel="noopener noreferrer">💬 {contact.whatsappLabel}</Btn>
        <Btn variant="ghost" size="sm" href={`mailto:${email}`}>✉ Email Support</Btn>
      </div>
    </Panel>
  )
}

export function ConfigRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Panel className="max-w-md p-10 text-center">
        <Eyebrow className="mb-3">Configuration required</Eyebrow>
        <h1 className="h2 text-xl">Supabase not connected</h1>
        <p className="mt-3 text-sm text-muted">Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, run migrations and seed.sql, then restart the dev server.</p>
      </Panel>
    </main>
  )
}

export function LoadingState({ label = 'Loading…', error }: { label?: string; error?: string | null }) {
  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <p className="mono text-xs text-muted">Try refreshing the page. If this persists, sign out and sign in again.</p>
      </div>
    )
  }
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="mono text-sm text-muted">{label}</p>
    </div>
  )
}
