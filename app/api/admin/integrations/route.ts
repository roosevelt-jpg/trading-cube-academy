import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { INTEGRATION_PROVIDERS, maskSecret } from '@/lib/integrations/providers'
import type { IntegrationSetting } from '@/lib/types/database'

function parseSecrets(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return { api_key: raw }
  }
}

function maskRow(row: IntegrationSetting) {
  const secrets = parseSecrets(row.secret_value)
  const maskedSecrets: Record<string, string> = {}
  for (const [k, v] of Object.entries(secrets)) {
    maskedSecrets[k] = maskSecret(v)
  }
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    enabled: row.enabled,
    public_value: row.public_value ?? {},
    masked_secrets: maskedSecrets,
    has_secrets: Object.keys(secrets).length > 0,
    updated_at: row.updated_at,
  }
}

async function requireAdmin() {
  if (!getSupabaseEnv().configured) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const service = createServiceClient()
    const { data, error } = await service.from('integration_settings').select('*').order('provider')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const byProvider = Object.fromEntries((data ?? []).map((r) => [r.provider, r]))
    const merged = INTEGRATION_PROVIDERS.map((def) => {
      const row = byProvider[def.provider]
      if (row) return { ...maskRow(row as IntegrationSetting), definition: def }
      return {
        id: null,
        provider: def.provider,
        label: def.label,
        enabled: false,
        public_value: {},
        masked_secrets: {},
        has_secrets: false,
        updated_at: null,
        definition: def,
      }
    })

    return NextResponse.json({ integrations: merged })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Service unavailable' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as {
    provider: string
    enabled?: boolean
    public_value?: Record<string, string>
    secrets?: Record<string, string>
  }

  const def = INTEGRATION_PROVIDERS.find((p) => p.provider === body.provider)
  if (!def) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  try {
    const service = createServiceClient()

    let secretPayload: string | null = null
    if (body.secrets && Object.keys(body.secrets).length) {
      const { data: existing } = await service
        .from('integration_settings')
        .select('secret_value')
        .eq('provider', body.provider)
        .maybeSingle()

      const current = parseSecrets(existing?.secret_value)
      const merged = { ...current }
      for (const [k, v] of Object.entries(body.secrets)) {
        if (v && v.trim() && !v.includes('•')) merged[k] = v.trim()
      }
      secretPayload = JSON.stringify(merged)
    }

    const row = {
      provider: body.provider,
      label: def.label,
      enabled: body.enabled ?? false,
      public_value: body.public_value ?? {},
      ...(secretPayload !== null ? { secret_value: secretPayload } : {}),
    }

    const { data, error } = await service
      .from('integration_settings')
      .upsert(row, { onConflict: 'provider' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ integration: maskRow(data as IntegrationSetting) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Service unavailable' }, { status: 503 })
  }
}
