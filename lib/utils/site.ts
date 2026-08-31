import type { SiteSettings } from '@/lib/types/database'

export const DEFAULT_LOGO_ICON = '/brand/logo-icon.svg'
export const DEFAULT_LOGO_BANNER = '/brand/logo-banner.jpg'

export function logoIconSrc(settings?: SiteSettings) {
  const path = settings?.branding?.logoIconPathname ?? settings?.branding?.logoPathname
  if (typeof path === 'string' && path.trim()) {
    if (path.includes('WhatsApp') || path.includes('blob.vercel-storage.com')) {
      return DEFAULT_LOGO_ICON
    }
    return path.startsWith('http') ? path : path.startsWith('/') ? path : `/api/materials/file?pathname=${encodeURIComponent(path)}`
  }
  return DEFAULT_LOGO_ICON
}

export function logoBannerSrc(settings?: SiteSettings) {
  const path = settings?.branding?.logoBannerPathname ?? settings?.branding?.logoPathname
  if (typeof path === 'string' && path.trim() && !path.endsWith('.svg') && !path.includes('logo-icon')) {
    if (path.includes('WhatsApp') || path.includes('blob.vercel-storage.com')) {
      return DEFAULT_LOGO_BANNER
    }
    return path.startsWith('http') ? path : path.startsWith('/') ? path : `/api/materials/file?pathname=${encodeURIComponent(path)}`
  }
  return DEFAULT_LOGO_BANNER
}

/** @deprecated Use logoIconSrc or logoBannerSrc */
export function logoSrc(settings?: SiteSettings) {
  return logoIconSrc(settings)
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
