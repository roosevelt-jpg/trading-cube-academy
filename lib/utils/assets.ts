import { DEFAULT_IMAGES } from '@/lib/defaults/cms-defaults'

const BROKEN_HOSTS = ['unsplash.com', 'picsum.photos']

/** Legacy v0 WhatsApp image blobs and other known-bad external URLs. */
export function isLegacyBrokenAssetUrl(url?: string | null) {
  if (!url?.trim()) return true
  if (url.includes('WhatsApp')) return true
  return BROKEN_HOSTS.some((host) => url.includes(host))
}

export function isBrokenAssetUrl(url?: string | null) {
  return isLegacyBrokenAssetUrl(url)
}

/** Replace broken external image URLs with a local fallback. */
export function normalizeAssetUrl(url?: string | null, fallback = DEFAULT_IMAGES.hero) {
  if (!url?.trim() || isLegacyBrokenAssetUrl(url)) return fallback
  return url
}

export function normalizeCourseImageUrl(url?: string | null, slug?: string) {
  const local = slug && slug in DEFAULT_IMAGES.courses
    ? DEFAULT_IMAGES.courses[slug as keyof typeof DEFAULT_IMAGES.courses]
    : DEFAULT_IMAGES.hero
  return normalizeAssetUrl(url, local)
}

export function normalizePillarImages(images?: Record<string, unknown>) {
  const pillars = (images?.pillars ?? {}) as Record<string, string>
  const defaults = DEFAULT_IMAGES.pillars
  return {
    sequence: normalizeAssetUrl(pillars.sequence, defaults.sequence),
    accountability: normalizeAssetUrl(pillars.accountability, defaults.accountability),
    support: normalizeAssetUrl(pillars.support, defaults.support),
  }
}
