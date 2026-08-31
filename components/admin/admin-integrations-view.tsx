'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel, Pill } from '@/components/ui/academy-ui'
import { INTEGRATION_PROVIDERS } from '@/lib/integrations/providers'
import { formatDateTime } from '@/lib/utils/datetime'
import type { IntegrationProviderDef } from '@/lib/integrations/providers'

type IntegrationRow = {
  id: string | null
  provider: string
  label: string
  enabled: boolean
  public_value: Record<string, string>
  masked_secrets: Record<string, string>
  has_secrets: boolean
  updated_at: string | null
  definition: IntegrationProviderDef
}

export function AdminIntegrationsView() {
  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const res = await fetch('/api/admin/integrations')
    if (!res.ok) return [] as IntegrationRow[]
    const json = await res.json()
    return (json.integrations ?? []) as IntegrationRow[]
  }, [])

  const { data, loading, reload } = useRealtimeQuery('integration_settings', fetcher, [])
  const [saving, setSaving] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { enabled: boolean; public_value: Record<string, string>; secrets: Record<string, string> }>>({})

  useEffect(() => {
    if (!data?.length) return
    setDrafts((prev) => {
      const next = { ...prev }
      for (const row of data) {
        if (!next[row.provider]) {
          next[row.provider] = {
            enabled: row.enabled,
            public_value: { ...row.public_value },
            secrets: {},
          }
        }
      }
      return next
    })
  }, [data])

  const save = async (provider: string) => {
    const draft = drafts[provider]
    if (!draft) return
    setSaving(provider)
    try {
      await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          enabled: draft.enabled,
          public_value: draft.public_value,
          secrets: draft.secrets,
        }),
      })
      reload()
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <LoadingState />

  return (
    <div className="content-pad max-w-3xl">
      <Eyebrow>API & storage</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Integrations</h1>
      <p className="muted mt-2 text-sm">
        Connect Stripe, YouTube, Blob storage, email, and other services. Secrets are stored server-side and never shown in full after saving.
      </p>

      <div className="mt-8 space-y-6">
        {(data ?? []).map((row) => {
          const draft = drafts[row.provider] ?? { enabled: row.enabled, public_value: row.public_value, secrets: {} }
          const def = row.definition

          return (
            <Panel key={row.provider} className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{def.label}</p>
                  <p className="muted mt-1 text-sm">{def.description}</p>
                  {row.updated_at && (
                    <p className="mono muted mt-2 text-[11px]">Updated {formatDateTime(row.updated_at)}</p>
                  )}
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDrafts({ ...drafts, [row.provider]: { ...draft, enabled: e.target.checked } })}
                    className="accent-yellow"
                  />
                  Enabled
                </label>
              </div>

              {def.fields.map((field) => (
                <div key={field.key} className="input-group">
                  <label>{field.label}</label>
                  {field.secret ? (
                    <>
                      <input
                        className="input"
                        type="password"
                        placeholder={row.masked_secrets[field.key] || field.placeholder || 'Enter secret…'}
                        value={draft.secrets[field.key] ?? ''}
                        onChange={(e) => setDrafts({
                          ...drafts,
                          [row.provider]: {
                            ...draft,
                            secrets: { ...draft.secrets, [field.key]: e.target.value },
                          },
                        })}
                      />
                      {row.masked_secrets[field.key] && (
                        <p className="mono muted mt-1 text-[11px]">Saved: {row.masked_secrets[field.key]}</p>
                      )}
                    </>
                  ) : (
                    <input
                      className="input"
                      placeholder={field.placeholder}
                      value={draft.public_value[field.key] ?? ''}
                      onChange={(e) => setDrafts({
                        ...drafts,
                        [row.provider]: {
                          ...draft,
                          public_value: { ...draft.public_value, [field.key]: e.target.value },
                        },
                      })}
                    />
                  )}
                </div>
              ))}

              <Btn size="sm" onClick={() => save(row.provider)} disabled={saving === row.provider}>
                {saving === row.provider ? 'Saving…' : 'Save integration'}
              </Btn>
            </Panel>
          )
        })}
      </div>

      <Panel className="mt-8 p-6">
        <Eyebrow>Environment status</Eyebrow>
        <ul className="muted mt-3 space-y-2 text-sm">
          <li className="flex justify-between"><span>Supabase</span><Pill tone="green">Connected via .env.local</Pill></li>
          <li className="flex justify-between"><span>Vercel Blob</span><Pill>Configure under Blob Storage above</Pill></li>
        </ul>
      </Panel>
    </div>
  )
}
