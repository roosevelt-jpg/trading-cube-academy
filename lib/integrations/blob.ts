import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { IntegrationSetting } from '@/lib/types/database'
import { parseIntegrationSecrets } from '@/lib/integrations/secrets'

type BlobIntegration = {
  enabled: boolean
  token: string
}

export async function loadBlobIntegration(): Promise<BlobIntegration | null> {
  if (!getSupabaseEnv().configured) return null
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('integration_settings')
      .select('*')
      .eq('provider', 'blob')
      .maybeSingle()
    if (!data) return null
    const row = data as IntegrationSetting
    const secrets = parseIntegrationSecrets(row.secret_value)
    return {
      enabled: row.enabled,
      token: secrets.read_write_token ?? '',
    }
  } catch {
    return null
  }
}

/** Resolve Vercel Blob token from env var or Admin → Integrations. */
export async function getBlobReadWriteToken(): Promise<string | null> {
  const envToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (envToken) return envToken
  const integration = await loadBlobIntegration()
  if (integration?.enabled && integration.token.trim()) return integration.token.trim()
  return null
}

export async function isBlobStorageConfigured(): Promise<boolean> {
  return Boolean(await getBlobReadWriteToken())
}
