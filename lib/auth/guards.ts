import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { Profile } from '@/lib/types/database'

export async function requireAuth() {
  const { configured } = getSupabaseEnv()
  if (!configured) redirect('/login?error=supabase')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/login?error=profile')

  return { supabase, user, profile: profile as Profile }
}

export async function requireAdmin() {
  const ctx = await requireAuth()
  if (ctx.profile.role !== 'admin') redirect('/student')
  return ctx
}

export async function requireStudent() {
  const ctx = await requireAuth()
  if (ctx.profile.role === 'admin') redirect('/admin')
  return ctx
}
