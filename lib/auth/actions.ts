'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export type LoginState = { error?: string } | null

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!getSupabaseEnv().configured) {
    return { error: 'Supabase is not configured. Check .env.local and restart the dev server.' }
  }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const userId = data.user?.id
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId ?? '')
    .maybeSingle()

  const role = profile?.role ?? (data.user?.user_metadata?.role as string | undefined)

  if (role === 'admin') redirect('/admin')
  redirect('/student')
}
