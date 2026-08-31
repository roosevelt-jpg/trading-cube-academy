'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { Btn, Eyebrow, Logo, Panel } from '@/components/ui/academy-ui'
import type { SiteSettings } from '@/lib/types/database'

export function AuthForm({ mode, settings }: { mode: 'login' | 'signup' | 'forgot'; settings?: SiteSettings | null }) {
  const router = useRouter()
  const configured = getSupabaseEnv().configured
  const bg = settings?.homepage?.heroImageUrl ?? (settings?.images as Record<string, string> | undefined)?.authBackground

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!configured) {
      setMessage('Connect Supabase to enable sign-in. Default content is visible across the site.')
      return
    }
    setBusy(true)
    setMessage('')
    const client = createClient()
    const normalized = email.trim().toLowerCase()

    if (mode === 'forgot') {
      const { error } = await client.auth.resetPasswordForEmail(normalized, { redirectTo: `${window.location.origin}/auth/callback` })
      setMessage(error ? error.message : 'Check your email for a reset link.')
      setBusy(false)
      return
    }

    const result = mode === 'login'
      ? await client.auth.signInWithPassword({ email: normalized, password })
      : await client.auth.signUp({ email: normalized, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: name.trim() } } })

    if (result.error) {
      setMessage(result.error.message)
      setBusy(false)
      return
    }

    if (mode === 'signup') {
      setMessage('Account created. Check your email to confirm access.')
      setBusy(false)
      return
    }

    const userId = result.data.user?.id
    const { data: profile } = await client.from('profiles').select('role').eq('id', userId ?? '').maybeSingle()
    router.push(profile?.role === 'admin' ? '/admin' : '/student')
  }

  const titles = { login: 'Welcome back.', signup: 'Create your account.', forgot: 'Reset your password.' }
  const subs = { login: 'Sign in to continue your learning path.', signup: 'Open access to the Trading Cube Academy.', forgot: 'We will email you a reset link.' }

  return (
    <main className="auth-wrap relative bg-grid">
      {bg && (
        <>
          <img src={bg} alt="" className="absolute inset-0 size-full object-cover opacity-20" aria-hidden />
          <div className="absolute inset-0 bg-[var(--bg)]/85" aria-hidden />
        </>
      )}
      <Panel className="auth-card relative z-10">
        <div className="mb-8 flex justify-center"><Logo settings={settings ?? undefined} /></div>
        <Eyebrow className="mb-3">{mode === 'login' ? 'Members only' : mode === 'signup' ? 'Start your path' : 'Account recovery'}</Eyebrow>
        <h1 className="h1 text-3xl">{titles[mode]}</h1>
        <p className="muted mt-2 text-sm">{subs[mode]}</p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          {mode === 'signup' && (
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="input-group">
            <label>Email address</label>
            <input className="input" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== 'forgot' && (
            <div className="input-group">
              <label>Password</label>
              <input className="input" required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          {mode === 'login' && (
            <div className="text-right">
              <Link href="/forgot-password" className="mono text-xs text-muted hover:text-yellow">Forgot password?</Link>
            </div>
          )}
          {message && <p className="text-sm text-yellow">{message}</p>}
          <Btn type="submit" className="w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </Btn>
        </form>
        <div className="muted mt-6 text-center text-sm">
          {mode === 'login' && <>Need an account? <Link href="/signup" className="text-yellow">Register</Link></>}
          {mode === 'signup' && <>Already registered? <Link href="/login" className="text-yellow">Sign in</Link></>}
          {mode === 'forgot' && <Link href="/login" className="text-yellow">Back to login</Link>}
        </div>
      </Panel>
    </main>
  )
}
