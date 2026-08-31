'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { Btn, Eyebrow, Logo, Panel } from '@/components/ui/academy-ui'
import type { PageContent, SiteSettings } from '@/lib/types/database'
import { whatsappUrl } from '@/lib/utils/site'

export function ContactPageView({ settings, page }: { settings: SiteSettings; page?: PageContent | null }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const configured = getSupabaseEnv().configured

  const supportEmail = settings.support?.email ?? settings.footer?.email ?? 'support@thetradingcube.com'
  const bgImage = page?.hero_image_url ?? settings.homepage?.heroImageUrl

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!configured) {
      setStatus('error')
      return
    }
    setStatus('loading')
    const client = createClient()
    const { error } = await client.from('access_requests').insert({ full_name: name.trim(), email: email.trim().toLowerCase(), message: message.trim() })
    setStatus(error ? 'error' : 'done')
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="mkt-header">
        <Logo settings={settings} />
        <Btn variant="ghost" size="sm" href="/">← Back</Btn>
      </header>

      {bgImage && (
        <div className="relative h-48 w-full overflow-hidden border-b border-[var(--border-soft)]">
          <img src={bgImage} alt="" className="size-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg)]" />
        </div>
      )}

      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-16 md:grid-cols-2 md:px-11">
        <div>
          <Eyebrow className="mb-3">{page?.eyebrow ?? 'CONTACT THE DESK'}</Eyebrow>
          <h1 className="h1 text-3xl">{page?.title ?? 'Request Access'}</h1>
          <p className="muted mt-4 text-[15px] leading-relaxed">{page?.description}</p>
          <div className="mt-8 space-y-4">
            <Panel className="p-5">
              <Eyebrow className="mb-2">Email</Eyebrow>
              <a href={`mailto:${supportEmail}`} className="text-yellow">{supportEmail}</a>
            </Panel>
            <Panel className="p-5">
              <Eyebrow className="mb-2">WhatsApp</Eyebrow>
              <a href={whatsappUrl(settings.footer?.whatsapp)} target="_blank" rel="noreferrer" className="text-yellow">Message the desk</a>
            </Panel>
          </div>
        </div>

        <Panel className="auth-card w-full">
          <Eyebrow className="mb-3">Application</Eyebrow>
          <h2 className="h2 text-xl">Tell us where you&apos;re starting from</h2>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Marcus Harrison" />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Message</label>
              <textarea className="input min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your trading background and goals…" />
            </div>
            {status === 'done' && <p className="text-sm text-green">Request submitted. The desk will follow up directly.</p>}
            {status === 'error' && <p className="text-sm text-red">{configured ? 'Could not submit. Try again.' : 'Connect Supabase to submit requests. Form preview is live.'}</p>}
            <Btn type="submit" className="w-full" disabled={status === 'loading'}>{status === 'loading' ? 'Submitting…' : 'Submit Request'}</Btn>
          </form>
          <p className="muted mt-4 text-center text-sm">
            Already have access? <Link href="/login" className="text-yellow">Member login</Link>
          </p>
        </Panel>
      </div>
    </main>
  )
}
