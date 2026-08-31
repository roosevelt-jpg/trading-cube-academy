'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { MarketingBundle } from '@/lib/data/marketing'
import { defaultMarketingBundle } from '@/lib/defaults/cms-defaults'
import { mergeSettings, DEFAULT_IMAGES } from '@/lib/defaults/cms-defaults'
import { Btn, Eyebrow, Logo, Panel } from '@/components/ui/academy-ui'
import type { SiteSettings } from '@/lib/types/database'
import { tierLabel, whatsappUrl } from '@/lib/utils/site'
import { FaqSection } from '@/components/marketing/faq-section'
import { WhatsAppFloatButton } from '@/components/ui/whatsapp-float-button'

export function MarketingHomepageView({ initialData }: { initialData: MarketingBundle }) {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (!getSupabaseEnv().configured || !initialData) return
    const client = createClient()
    const reload = async () => {
      const [settingsRes, stats, pillars, steps, testimonials, faqs, courses, videos] = await Promise.all([
        client.from('site_settings').select('key,value'),
        client.from('marketing_stats').select('*').order('sort_order'),
        client.from('marketing_pillars').select('*').order('sort_order'),
        client.from('marketing_steps').select('*').order('sort_order'),
        client.from('testimonials').select('*').order('sort_order'),
        client.from('faq_items').select('*').order('sort_order'),
        client.from('courses').select('*').eq('published', true).order('sort_order'),
        client.from('youtube_videos').select('*').eq('visibility', 'marketing').eq('published', true).order('sort_order'),
      ])
      const settings = mergeSettings(Object.fromEntries((settingsRes.data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]))) as SiteSettings
      setData({
        settings,
        stats: stats.data ?? [],
        pillars: pillars.data ?? [],
        steps: steps.data ?? [],
        testimonials: testimonials.data ?? [],
        faqs: faqs.data ?? [],
        courses: courses.data ?? [],
        videos: videos.data ?? [],
      })
    }
    const tables = ['site_settings', 'marketing_stats', 'marketing_pillars', 'marketing_steps', 'testimonials', 'faq_items', 'courses', 'youtube_videos']
    const channels = tables.map((table) =>
      client.channel(`mkt-${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, reload).subscribe()
    )
    return () => { channels.forEach((ch) => client.removeChannel(ch)) }
  }, [initialData])

  const settings = data.settings
  const home = settings.homepage ?? {}
  const heroImage = resolveMarketingHeroImage(home.heroImageUrl, settings)
  const pillarImages = [
    (settings.images as Record<string, Record<string, string>> | undefined)?.pillars?.sequence,
    (settings.images as Record<string, Record<string, string>> | undefined)?.pillars?.accountability,
    (settings.images as Record<string, Record<string, string>> | undefined)?.pillars?.support,
  ]

  return (
    <main className="min-h-screen bg-background">
      <header className="mkt-header flex-wrap gap-4">
        <Logo settings={settings} variant="banner" />
        <nav className="mkt-nav order-3 flex w-full flex-wrap gap-4 md:order-none md:w-auto md:gap-9">
          <Link href="/courses">Courses</Link>
          <Link href="/method">Method</Link>
          <Link href="/about">About</Link>
          <a href="#mkt-faq">FAQ</a>
        </nav>
        <div className="flex gap-3">
          <Btn variant="ghost" size="sm" href="/login">Member Login</Btn>
          <Btn variant="primary" size="sm" href="/contact">Request Access</Btn>
        </div>
      </header>

      <section className="mkt-hero bg-grid">
        <div className="flex-1 max-w-[600px]">
          <Eyebrow className="mb-5">{home.eyebrow}</Eyebrow>
          <h1 className="h1 mb-5 text-[46px] leading-[1.12]">{home.headline}</h1>
          <p className="muted mb-8 max-w-[480px] text-base leading-relaxed">{home.description}</p>
          <div className="mb-8 flex flex-wrap gap-3.5">
            <Btn href="/contact">Request Access →</Btn>
            <Btn variant="ghost" href="/login">Member Login</Btn>
          </div>
          <p className="mono muted text-[11.5px] tracking-wide">{home.trustLine}</p>
        </div>
        {heroImage && (
          <div className="relative min-h-[240px] flex-1 overflow-hidden border border-[var(--border)] md:min-h-[340px] lg:max-w-[520px]">
            <img src={heroImage as string} alt="Trader analyzing live market charts" className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
            <Panel className="absolute bottom-4 left-4 right-4 p-3">
              <p className="mono text-[10px] uppercase tracking-wider text-yellow">Live curriculum preview</p>
              <p className="text-sm font-semibold">Price Action Mastery · Module 3</p>
            </Panel>
          </div>
        )}
      </section>

      <div className="mkt-stat-strip">
        {data.stats.map((stat) => (
          <div key={stat.id} className="mkt-stat">
            <div className="h1 mono text-[28px]" style={{ color: stat.accent === 'yellow' ? 'var(--yellow)' : stat.accent === 'green' ? 'var(--green)' : undefined }}>
              {stat.value}
            </div>
            <div className="muted mt-1.5 text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="mkt-section">
        <div className="mkt-section-head">
          <Eyebrow className="mb-3.5">Why Trading Cube</Eyebrow>
          <h2 className="h2 text-[26px] leading-snug">Most trading education stops at theory. Ours stops at proof.</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {data.pillars.map((p, i) => (
            <Panel key={p.id} className="pillar-card overflow-hidden p-0">
              {pillarImages[i] && (
                <div className="h-28 w-full overflow-hidden">
                  <img src={pillarImages[i]} alt="" className="size-full object-cover opacity-80" />
                </div>
              )}
              <div className="p-7">
                <p className="mono mb-3.5 text-[13px] text-yellow">{p.number_label}</p>
                <p className="mb-2.5 text-base font-semibold">{p.title}</p>
                <p className="muted text-[13.5px] leading-relaxed">{p.body}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mkt-section" id="mkt-curriculum">
        <div className="mkt-section-head">
          <Eyebrow className="mb-3.5">Curriculum</Eyebrow>
          <h2 className="h2 text-[26px]">Six courses. One sequence.</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {data.courses.map((course) => (
            <Panel key={course.id} className="course-card overflow-hidden p-0">
              {course.image_url && (
                <div className="h-36 w-full overflow-hidden">
                  <img src={course.image_url} alt={course.title} className="size-full object-cover transition-transform duration-300 hover:scale-105" />
                </div>
              )}
              <div className="flex flex-col gap-3.5 p-5">
                <div className="flex items-start justify-between">
                  <span className={`pill ${course.tier === 'foundation' ? 'pill-yellow' : ''}`}>{tierLabel(course.tier)}</span>
                </div>
                <p className="text-[15.5px] font-semibold">{course.title}</p>
                <p className="muted text-[13px]">{course.module_count} modules · {course.description}</p>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="video-marquee-section">
        <div className="video-marquee-head">
          <Eyebrow className="mb-3.5">Inside the Curriculum</Eyebrow>
          <h2 className="h2 text-[26px]">A look at the actual lessons.</h2>
          <p className="muted mt-3 text-[13.5px]">Unlisted YouTube lessons, streamed straight from the platform — hover to pause.</p>
        </div>
        <div className="video-marquee-wrap">
          <div className="video-track">
            {[...data.videos, ...data.videos].map((video, i) => (
              <Panel key={`${video.id}-${i}`} className="video-card overflow-hidden">
                <div className="aspect-video bg-black">
                  <iframe className="size-full" src={`https://www.youtube.com/embed/${video.video_id}`} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
                <div className="p-4">
                  <p className="mono text-[10px] uppercase tracking-wider text-yellow">{video.course_name}</p>
                  <p className="mt-2 text-sm font-semibold">{video.title}</p>
                  <p className="mono muted mt-1 text-[11px]">{video.duration_label}</p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      <section className="mkt-section" id="mkt-how">
        <div className="mkt-section-head">
          <Eyebrow className="mb-3.5">How It Works</Eyebrow>
          <h2 className="h2 text-[26px]">From application to certificate.</h2>
        </div>
        <div className="step-row mx-auto max-w-5xl">
          {data.steps.map((step) => (
            <div key={step.id} className="step-item">
              <div className="mono mb-4 inline-flex size-[30px] items-center justify-center border border-border text-yellow">{step.number_label}</div>
              <p className="mb-2 text-[14.5px] font-semibold">{step.title}</p>
              <p className="muted text-[13px] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mkt-section" id="mkt-results">
        <div className="mkt-section-head">
          <Eyebrow className="mb-3.5">Results</Eyebrow>
          <h2 className="h2 text-[26px]">Traders who finished the sequence.</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {data.testimonials.map((t) => (
            <Panel key={t.id} className="testimonial-card">
              <p className="text-[14.5px] leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                {t.image_url && <img src={t.image_url} alt={t.author_name} className="size-10 rounded-full border border-[var(--border)] object-cover" />}
                <div>
                  <p className="text-[13.5px] font-semibold">{t.author_name}</p>
                  <p className="mono muted text-[11.5px]">{t.author_meta}</p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="mkt-section mx-auto max-w-[760px]" id="mkt-faq">
        <div className="mkt-section-head mb-2">
          <Eyebrow className="mb-3.5">Frequently Asked</Eyebrow>
          <h2 className="h2 text-[26px]">Before you request access.</h2>
        </div>
        <FaqSection items={data.faqs} />
      </section>

      <section className="cta-band relative overflow-hidden bg-grid">
        {(home.ctaImageUrl as string | undefined) && (
          <>
            <img src={home.ctaImageUrl as string} alt="" className="absolute inset-0 size-full object-cover opacity-25" aria-hidden />
            <div className="absolute inset-0 bg-[var(--bg)]/70" aria-hidden />
          </>
        )}
        <div className="relative z-10">
          <Eyebrow className="mb-4">Created by traders, for traders</Eyebrow>
          <h2 className="h1 mb-6 text-[32px]">Ready to trade with <span className="grad-text">structure?</span></h2>
          <Btn href="/contact">Request Access →</Btn>
        </div>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-footer-grid">
          <div>
            <Logo settings={settings} variant="banner" className="mb-3.5" />
            <p className="muted max-w-[260px] text-[13px] leading-relaxed">{settings.footer?.description}</p>
          </div>
          <div className="mkt-footer-col">
            <h4>Curriculum</h4>
            {data.courses.slice(0, 4).map((c) => (
              <Link key={c.id} href="#mkt-curriculum">{c.title}</Link>
            ))}
          </div>
          <div className="mkt-footer-col">
            <h4>Academy</h4>
            <Link href="/about">About</Link>
            <Link href="/method">Method</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/login">Member Login</Link>
          </div>
          <div className="mkt-footer-col">
            <h4>Contact</h4>
            <a href={`mailto:${settings.footer?.email}`}>{settings.footer?.email}</a>
            <a href={whatsappUrl(settings.footer?.whatsapp)} target="_blank" rel="noreferrer">WhatsApp the desk</a>
            <Link href="/contact">Request access</Link>
          </div>
        </div>
      </footer>

      <WhatsAppFloatButton settings={settings} context="homepage" />
    </main>
  )
}

function resolveMarketingHeroImage(homeHero?: string, settings?: SiteSettings) {
  const fromImages =
    typeof settings?.images === 'object' && settings.images && 'hero' in settings.images
      ? (settings.images as Record<string, string>).hero
      : undefined
  const candidate = homeHero ?? fromImages ?? DEFAULT_IMAGES.hero
  if (!candidate?.trim()) return DEFAULT_IMAGES.hero
  if (candidate.includes('unsplash.com') || candidate.includes('picsum.photos')) return DEFAULT_IMAGES.hero
  return candidate
}
