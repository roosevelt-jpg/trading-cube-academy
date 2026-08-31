import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function PATCH(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName } = (await request.json()) as { fullName?: string }
  const trimmed = fullName?.trim()
  if (!trimmed) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })

  const initials = trimmed
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ full_name: trimmed, avatar_initials: initials || null })
    .eq('id', user.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.auth.updateUser({ data: { full_name: trimmed } })

  return NextResponse.json({ profile })
}
