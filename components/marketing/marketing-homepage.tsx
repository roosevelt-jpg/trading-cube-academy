'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, ConfigRequired, Eyebrow, LoadingState, Logo, Panel } from '@/components/ui/academy-ui'
import type { Course, FaqItem, MarketingPillar, MarketingStat, MarketingStep, SiteSettings, Testimonial, YoutubeVideo } from '@/lib/types/database'
import { tierLabel, whatsappUrl } from '@/lib/utils/site'
import { FaqSection } from '@/components/marketing/faq-section'

type MarketingBundle = {
  settings: Record<string, SiteSettings[keyof SiteSettings]>
  stats: MarketingStat[]
  pillars: MarketingPillar[]
  steps: MarketingStep[]
  testimonials: Testimonial[]
  faqs: FaqItem[]
  courses: Course[]
  videos: YoutubeVideo[]
}

async function fetchMarketing(client: ReturnType<typeof createClient>): Promise<MarketingBundle> {
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
  const settings = Object.fromEntries((settingsRes.data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]))
  return {
    settings: settings as MarketingBundle['settings'],
    stats: (stats.data ?? []) as MarketingStat[],
    pillars: (pillars.data ?? []) as MarketingPillar[],
    steps: (steps.data ?? []) as MarketingStep[],
    testimonials: (testimonials.data ?? []) as Testimonial[],
    faqs: (faqs.data ?? []) as FaqItem[],
    courses: (courses.data ?? []) as Course[],
    videos: (videos.data ?? []) as YoutubeVideo[],
  }
}

export function MarketingHomepage() {
  const fetcher = useMemo(() => fetchMarketing, [])
  const { data, loading, error } = useRealtimeQuery('site_settings', fetcher, [])

  if (loading) return <LoadingState label="Loading academy…" />
  if (error || !data) return <ConfigRequired />

  const settings = data.settings as SiteSettings
  const home = settings.homepage ?? {}

  return (
    <main className="min-h-screen bg-background">
      <header className="mkt-header">
        <Logo settings={settings} />
        <nav className="mkt-nav hidden md:flex">
          <a href="#mkt-curriculum">Curriculum</a>
          <a href="#mkt-how">How It Works</a>
          <a href="#mkt-results">Results</a>
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
          <h1 className="h1 text-[46px] leading-[1.12] mb-5">{home.headline}</h1>
          <p className="muted max-w-[480px] text-base leading-relaxed mb-8">{home.description}</p>
          <div className="mb-8 flex flex-wrap gap-3.5">
            <Btn href="/contact">Request Access →</Btn>
            <Btn variant="ghost" href="/login">Member Login</Btn>
          </div>
          <p className="mono muted text-[11.5px] tracking-wide">{home.trustLine}</p>
        </div>
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
          {data.pillars.map((p) => (
            <Panel key={p.id} className="p-7">
              <p className="mono mb-3.5 text-[13px] text-yellow">{p.number_label}</p>
              <p className="mb-2.5 text-base font-semibold">{p.title}</p>
              <p className="muted text-[13.5px] leading-relaxed">{p.body}</p>
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
            <Panel key={course.id} className="course-card">
              <div className="flex items-start justify-between">
                <span className={`pill ${course.tier === 'foundation' ? 'pill-yellow' : ''}`}>{tierLabel(course.tier)}</span>
              </div>
              <p className="text-[15.5px] font-semibold">{course.title}</p>
              <p className="muted text-[13px]">{course.module_count} modules · {course.description}</p>
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
              <div>
                <p className="text-[13.5px] font-semibold">{t.author_name}</p>
                <p className="mono muted text-[11.5px]">{t.author_meta}</p>
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

      <section className="cta-band bg-grid">
        <Eyebrow className="mb-4">Created by traders, for traders</Eyebrow>
        <h2 className="h1 mb-6 text-[32px]">Ready to trade with <span className="grad-text">structure?</span></h2>
        <Btn href="/contact">Request Access →</Btn>
      </section>

      <footer className="mkt-footer">
        <div className="mkt-footer-grid">
          <div>
            <Logo settings={settings} className="mb-3.5" />
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
            <Link href="#mkt-how">How It Works</Link>
            <Link href="#mkt-results">Results</Link>
            <Link href="#mkt-faq">FAQ</Link>
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

      <a
        href={whatsappUrl(settings.footer?.whatsapp, 'Hello Trading Cube Academy')}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 btn btn-primary btn-sm shadow-lg"
      >
        💬 Chat with us
      </a>
    </main>
  )
}
