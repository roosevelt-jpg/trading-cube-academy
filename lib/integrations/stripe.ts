import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { IntegrationSetting } from '@/lib/types/database'
import { parseIntegrationSecrets } from '@/lib/integrations/secrets'

export type StripeIntegration = {
  enabled: boolean
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

export async function loadStripeIntegration(): Promise<StripeIntegration | null> {
  if (!getSupabaseEnv().configured) return null
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('integration_settings')
      .select('*')
      .eq('provider', 'stripe')
      .maybeSingle()
    if (!data) return null
    const row = data as IntegrationSetting
    const secrets = parseIntegrationSecrets(row.secret_value)
    const publicValue = (row.public_value ?? {}) as Record<string, string>
    return {
      enabled: row.enabled,
      publishableKey: publicValue.publishable_key ?? '',
      secretKey: secrets.secret_key ?? '',
      webhookSecret: secrets.webhook_secret ?? '',
    }
  } catch {
    return null
  }
}

export async function getStripeClient() {
  const integration = await loadStripeIntegration()
  if (!integration?.enabled || !integration.secretKey) return null
  const Stripe = (await import('stripe')).default
  return new Stripe(integration.secretKey)
}
