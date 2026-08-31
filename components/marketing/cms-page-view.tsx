'use client'

import Link from 'next/link'
import { Btn, Eyebrow, Logo, Panel } from '@/components/ui/academy-ui'
import type { PageContent, SiteSettings } from '@/lib/types/database'

export function CmsPageView({ page, settings }: { page: PageContent; settings: SiteSettings }) {
  return (
    <main className="min-h-screen bg-background">
      <header className="mkt-header">
        <Logo settings={settings} variant="banner" />
        <Btn variant="ghost" size="sm" href="/">← Home</Btn>
      </header>

      {page.hero_image_url && (
        <div className="relative h-[280px] w-full overflow-hidden border-b border-[var(--border-soft)] md:h-[360px]">
          <img src={page.hero_image_url} alt="" className="size-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        </div>
      )}

      <section className="mx-auto max-w-4xl px-5 py-16 md:px-11">
        <Eyebrow className="mb-3">{page.eyebrow}</Eyebrow>
        <h1 className="h1 text-4xl md:text-5xl">{page.title}</h1>
        {page.description && <p className="muted mt-5 text-lg leading-relaxed">{page.description}</p>}

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {(page.sections ?? []).map((section) => (
            <Panel key={section.heading} className="p-6">
              <h2 className="text-lg font-semibold">{section.heading}</h2>
              <p className="muted mt-3 text-sm leading-relaxed">{section.body}</p>
            </Panel>
          ))}
        </div>

        {page.primary_cta_label && page.primary_cta_href && (
          <Btn href={page.primary_cta_href} className="mt-10">{page.primary_cta_label}</Btn>
        )}
      </section>

      <footer className="mkt-footer border-t border-[var(--border-soft)]">
        <div className="mkt-footer-grid">
          <div>
            <Logo settings={settings} className="mb-3" />
            <p className="muted max-w-xs text-sm">{settings.footer?.description}</p>
          </div>
          <div className="mkt-footer-col">
            <h4>Academy</h4>
            <Link href="/about">About</Link>
            <Link href="/courses">Courses</Link>
            <Link href="/contact">Request access</Link>
          </div>
          <div className="mkt-footer-col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/faq">FAQ</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
