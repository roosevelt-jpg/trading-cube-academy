import { DEFAULT_IMAGES } from '@/lib/defaults/cms-defaults'
import { normalizeAssetUrl } from '@/lib/utils/assets'
import type { HeroSlide, HeroSliderSettings, SiteSettings } from '@/lib/types/database'

export const DEFAULT_HERO_SLIDER: HeroSliderSettings = {
  enabled: true,
  intervalSeconds: 6,
  transition: 'fade',
  transitionDurationMs: 700,
  autoplay: true,
  pauseOnHover: true,
  showDots: true,
  showArrows: true,
  loop: true,
  slides: [],
}

export function mergeHeroSliderSettings(raw?: HeroSliderSettings | null): HeroSliderSettings {
  const merged = { ...DEFAULT_HERO_SLIDER, ...(raw ?? {}) }
  merged.slides = (merged.slides ?? [])
    .filter((s) => s?.imageUrl?.trim())
    .map((s, i) => ({
      ...s,
      id: s.id || `slide-${i}`,
      imageUrl: normalizeAssetUrl(s.imageUrl, DEFAULT_IMAGES.hero) ?? DEFAULT_IMAGES.hero,
    }))
  merged.intervalSeconds = Math.min(60, Math.max(2, merged.intervalSeconds ?? 6))
  merged.transitionDurationMs = Math.min(3000, Math.max(200, merged.transitionDurationMs ?? 700))
  if (!['fade', 'slide', 'zoom'].includes(merged.transition ?? '')) {
    merged.transition = 'fade'
  }
  return merged
}

export function resolveHeroSlides(home?: SiteSettings['homepage']) {
  const slider = mergeHeroSliderSettings(home?.heroSlider)
  const preview = home?.heroPreview

  if (slider.slides.length > 0) {
    return {
      slider,
      slides: slider.slides.map((s) => ({
        ...s,
        previewLabel: s.previewLabel ?? preview?.label,
        previewTitle: s.previewTitle ?? preview?.title,
      })),
    }
  }

  const hero = normalizeAssetUrl(home?.heroImageUrl, DEFAULT_IMAGES.hero) ?? DEFAULT_IMAGES.hero
  const terminal = normalizeAssetUrl(home?.heroTerminalImageUrl, DEFAULT_IMAGES.heroTerminal) ?? DEFAULT_IMAGES.heroTerminal
  const cta = normalizeAssetUrl(home?.ctaImageUrl, DEFAULT_IMAGES.ctaBand) ?? DEFAULT_IMAGES.ctaBand

  const fallbackSources = [hero, terminal, cta].filter((url, i, arr) => arr.indexOf(url) === i)

  return {
    slider,
    slides: fallbackSources.map((imageUrl, i) => ({
      id: `hero-fallback-${i}`,
      imageUrl,
      alt: i === 0 ? 'Trader analyzing live market charts' : 'Trading curriculum preview',
      previewLabel: preview?.label,
      previewTitle: preview?.title,
    })) satisfies HeroSlide[],
  }
}

export function shouldAnimateHeroSlider(slides: HeroSlide[], slider: HeroSliderSettings) {
  return slides.length > 1 && slider.enabled !== false
}
