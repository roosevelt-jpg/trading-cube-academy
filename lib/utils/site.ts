import type { SiteSettings } from '@/lib/types/database'

const DEFAULT_LOGO =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-08-28%20at%2001.07.23-KxSUitIOxLLo5caKphzA7Ia47n2FEi.jpeg'

export function logoSrc(settings?: SiteSettings) {
  const path = settings?.branding?.logoPathname
  if (typeof path === 'string' && path.trim()) {
    return path.startsWith('http') ? path : `/api/materials/file?pathname=${encodeURIComponent(path)}`
  }
  return DEFAULT_LOGO
}

export function companyName(settings?: SiteSettings) {
  return settings?.branding?.companyName ?? 'The Trading Cube Academy'
}

export function whatsappUrl(number?: string, text?: string) {
  const n = (number ?? '447757464428').replace(/\D/g, '')
  const q = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${n}${q}`
}

export function tierLabel(tier: string) {
  if (tier === 'foundation') return 'Foundation'
  if (tier === 'core') return 'Core'
  return 'Advanced'
}

export function formatRelativeDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
