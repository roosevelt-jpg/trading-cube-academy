export type IntegrationField = {
  key: string
  label: string
  secret?: boolean
  placeholder?: string
}

export type IntegrationProviderDef = {
  provider: string
  label: string
  description: string
  fields: IntegrationField[]
}

export const INTEGRATION_PROVIDERS: IntegrationProviderDef[] = [
  {
    provider: 'stripe',
    label: 'Stripe Payments',
    description: 'Accept enrollment payments, subscriptions, and webhooks.',
    fields: [
      { key: 'publishable_key', label: 'Publishable key', placeholder: 'pk_live_...' },
      { key: 'secret_key', label: 'Secret key', secret: true, placeholder: 'sk_live_...' },
      { key: 'webhook_secret', label: 'Webhook signing secret', secret: true, placeholder: 'whsec_...' },
    ],
  },
  {
    provider: 'youtube',
    label: 'YouTube Data API',
    description: 'Fetch video metadata, thumbnails, and duration for lesson embeds.',
    fields: [
      { key: 'api_key', label: 'API key', secret: true, placeholder: 'AIza...' },
    ],
  },
  {
    provider: 'blob',
    label: 'Vercel Blob Storage',
    description: 'Store course materials, logos, and admin-uploaded images.',
    fields: [
      { key: 'read_write_token', label: 'Read/write token', secret: true, placeholder: 'vercel_blob_rw_...' },
    ],
  },
  {
    provider: 'email',
    label: 'Transactional Email',
    description: 'Send access invitations, quiz results, and support replies (Resend/SendGrid).',
    fields: [
      { key: 'provider_name', label: 'Provider', placeholder: 'resend' },
      { key: 'from_address', label: 'From address', placeholder: 'support@thetradingcube.com' },
      { key: 'api_key', label: 'API key', secret: true },
    ],
  },
  {
    provider: 'whatsapp',
    label: 'WhatsApp Business API',
    description: 'Desk support messages and access-request notifications.',
    fields: [
      { key: 'phone_number_id', label: 'Phone number ID' },
      { key: 'access_token', label: 'Access token', secret: true },
    ],
  },
  {
    provider: 'openai',
    label: 'OpenAI (optional)',
    description: 'Optional AI assist for quiz explanations or admin copy drafts.',
    fields: [
      { key: 'api_key', label: 'API key', secret: true, placeholder: 'sk-...' },
      { key: 'model', label: 'Model', placeholder: 'gpt-4o-mini' },
    ],
  },
]

export function maskSecret(value: string | null | undefined) {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}${'•'.repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`
}
