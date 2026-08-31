'use client'

import { FormEvent, useActionState, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { loginAction, type LoginState } from '@/lib/auth/actions'
import { Btn, Eyebrow, Logo, Panel } from '@/components/ui/academy-ui'
import type { SiteSettings } from '@/lib/types/database'

export function AuthForm({
  mode,
  settings,
  initialMessage,
}: {
  mode: 'login' | 'signup' | 'forgot'
  settings?: SiteSettings | null
  initialMessage?: string
}) {
  const configured = getSupabaseEnv().configured
  const bg = settings?.homepage?.heroImageUrl ?? (settings?.images as Record<string, string> | undefined)?.authBackground

  const [loginState, loginFormAction, loginPending] = useActionState<LoginState, FormData>(
    loginAction,
    initialMessage ? { error: initialMessage } : null,
  )

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
      const { error } = await client.auth.resetPasswordForEmail(normalized, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      setMessage(error ? error.message : 'Check your email for a reset link.')
      setBusy(false)
      return
    }

    if (mode === 'signup') {
      const result = await client.auth.signUp({
        email: normalized,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: name.trim() },
        },
      })
      if (result.error) {
        setMessage(result.error.message)
        setBusy(false)
        return
      }
      setMessage('Account created. Check your email to confirm access.')
      setBusy(false)
    }
  }

  const titles = { login: 'Welcome back.', signup: 'Create your account.', forgot: 'Reset your password.' }
  const subs = {
    login: 'Sign in to continue your learning path.',
    signup: 'Open access to the Trading Cube Academy.',
    forgot: 'We will email you a reset link.',
  }

  const errorMessage = mode === 'login' ? loginState?.error : message
  const pending = mode === 'login' ? loginPending : busy

  return (
    <main className="auth-wrap relative bg-grid">
      {bg && (
        <>
          <img src={bg} alt="" className="absolute inset-0 size-full object-cover opacity-20" aria-hidden />
          <div className="absolute inset-0 bg-[var(--bg)]/85" aria-hidden />
        </>
      )}
      <Panel className="auth-card relative z-10">
        <div className="mb-8 flex justify-center">
          <Logo settings={settings ?? undefined} variant="banner" />
        </div>
        <Eyebrow className="mb-3">
          {mode === 'login' ? 'Members only' : mode === 'signup' ? 'Start your path' : 'Account recovery'}
        </Eyebrow>
        <h1 className="h1 text-3xl">{titles[mode]}</h1>
        <p className="muted mt-2 text-sm">{subs[mode]}</p>

        {mode === 'login' ? (
          <form className="mt-8 space-y-4" action={loginFormAction} method="post">
            <div className="input-group">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className="input"
                name="email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="input"
                name="password"
                required
                minLength={6}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-right">
              <Link href="/forgot-password" className="mono text-xs text-muted hover:text-yellow">
                Forgot password?
              </Link>
            </div>
            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
            <Btn type="submit" className="w-full" disabled={pending}>
              {pending ? 'Please wait…' : 'Sign in'}
            </Btn>
          </form>
        ) : (
          <form className="mt-8 space-y-4" method="post" onSubmit={submit}>
            {mode === 'signup' && (
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div className="input-group">
              <label>Email address</label>
              <input
                className="input"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {mode !== 'forgot' && (
              <div className="input-group">
                <label>Password</label>
                <input
                  className="input"
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
            <Btn type="submit" className="w-full" disabled={pending}>
              {pending ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </Btn>
          </form>
        )}

        <div className="muted mt-6 text-center text-sm">
          {mode === 'login' && (
            <>
              Need an account?{' '}
              <Link href="/signup" className="text-yellow">
                Register
              </Link>
            </>
          )}
          {mode === 'signup' && (
            <>
              Already registered?{' '}
              <Link href="/login" className="text-yellow">
                Sign in
              </Link>
            </>
          )}
          {mode === 'forgot' && (
            <Link href="/login" className="text-yellow">
              Back to login
            </Link>
          )}
        </div>
      </Panel>
    </main>
  )
}
