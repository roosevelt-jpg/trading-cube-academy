import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { IntegrationSetting } from '@/lib/types/database'

type WhatsAppIntegration = {
  enabled: boolean
  phoneNumberId: string
  accessToken: string
  businessPhone: string
  notifyPhone: string
}

function parseSecrets(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return { api_key: raw }
  }
}

export async function loadWhatsAppIntegration(): Promise<WhatsAppIntegration | null> {
  if (!getSupabaseEnv().configured) return null
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('integration_settings')
      .select('*')
      .eq('provider', 'whatsapp')
      .maybeSingle()

    if (!data) return null
    const row = data as IntegrationSetting
    const secrets = parseSecrets(row.secret_value)
    const publicValue = (row.public_value ?? {}) as Record<string, string>
    return {
      enabled: row.enabled,
      phoneNumberId: publicValue.phone_number_id ?? '',
      accessToken: secrets.access_token ?? '',
      businessPhone: publicValue.business_phone ?? '',
      notifyPhone: publicValue.notify_phone ?? publicValue.business_phone ?? '',
    }
  } catch {
    return null
  }
}

/** Sends a desk notification via WhatsApp Cloud API when integration credentials are configured. */
export async function sendWhatsAppDeskNotification(body: string) {
  const integration = await loadWhatsAppIntegration()
  if (!integration?.enabled) return { sent: false, reason: 'integration_disabled' as const }
  if (!integration.phoneNumberId || !integration.accessToken || !integration.notifyPhone) {
    return { sent: false, reason: 'missing_credentials' as const }
  }

  const to = integration.notifyPhone.replace(/\D/g, '')
  const res = await fetch(`https://graph.facebook.com/v21.0/${integration.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('[whatsapp] notify failed', res.status, detail)
    return { sent: false, reason: 'api_error' as const }
  }

  return { sent: true as const }
}
