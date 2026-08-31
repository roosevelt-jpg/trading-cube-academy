'use client'

import { useCallback, useEffect, useState } from 'react'
import { Panel } from '@/components/ui/academy-ui'
import type { HeroSlide, HeroSliderSettings } from '@/lib/types/database'
import { DEFAULT_HERO_SLIDER, shouldAnimateHeroSlider } from '@/lib/utils/hero-slider'
import { cn } from '@/lib/utils'

type Props = {
  slides: HeroSlide[]
  settings?: HeroSliderSettings
  className?: string
}

export function HeroSlider({ slides, settings: rawSettings, className }: Props) {
  const settings = { ...DEFAULT_HERO_SLIDER, ...rawSettings }
  const animate = shouldAnimateHeroSlider(slides, settings)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const durationMs = settings.transitionDurationMs ?? 700
  const intervalMs = (settings.intervalSeconds ?? 6) * 1000
  const transition = settings.transition ?? 'fade'

  const goTo = useCallback(
    (next: number) => {
      if (!slides.length) return
      if (settings.loop !== false) {
        setIndex(((next % slides.length) + slides.length) % slides.length)
        return
      }
      setIndex(Math.min(slides.length - 1, Math.max(0, next)))
    },
    [slides.length, settings.loop],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    setIndex((i) => (i >= slides.length ? 0 : i))
  }, [slides.length])

  useEffect(() => {
    if (!animate || settings.autoplay === false || paused) return
    const id = window.setInterval(next, intervalMs)
    return () => window.clearInterval(id)
  }, [animate, settings.autoplay, paused, intervalMs, next])

  if (!slides.length) return null

  const active = slides[index] ?? slides[0]
  const atStart = index === 0
  const atEnd = index === slides.length - 1
  const showArrows = animate && settings.showArrows !== false
  const showDots = animate && settings.showDots !== false

  return (
    <div
      className={cn('hero-slider relative min-h-[240px] flex-1 overflow-hidden border border-[var(--border)] md:min-h-[340px] lg:max-w-[520px]', className)}
      onMouseEnter={() => settings.pauseOnHover !== false && setPaused(true)}
      onMouseLeave={() => settings.pauseOnHover !== false && setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Hero image slider"
    >
      <div
        className={cn('hero-slider-track size-full', `hero-slider-${transition}`, animate && 'hero-slider-animate')}
        style={{ '--hero-slide-duration': `${durationMs}ms` } as React.CSSProperties}
      >
        {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={cn('hero-slide absolute inset-0', i === index && 'hero-slide-active')}
              aria-hidden={i !== index}
            >
              <img
                src={slide.imageUrl}
                alt={slide.alt ?? 'Hero slide'}
                className="size-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />

      <Panel className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 p-3 transition-opacity duration-300">
        <p className="mono text-[10px] uppercase tracking-wider text-yellow">
          {active.previewLabel ?? 'Live curriculum preview'}
        </p>
        <p className="text-sm font-semibold">{active.previewTitle ?? 'Price Action Mastery · Module 3'}</p>
      </Panel>

      {showArrows && (
        <>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-left"
            onClick={prev}
            disabled={settings.loop === false && atStart}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            className="hero-slider-arrow hero-slider-arrow-right"
            onClick={next}
            disabled={settings.loop === false && atEnd}
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {showDots && (
        <div className="hero-slider-dots" role="tablist" aria-label="Choose slide">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={cn('hero-slider-dot', i === index && 'hero-slider-dot-active')}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
