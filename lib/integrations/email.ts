import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { IntegrationSetting } from '@/lib/types/database'
import { parseIntegrationSecrets } from '@/lib/integrations/secrets'

type EmailIntegration = {
  enabled: boolean
  providerName: string
  fromAddress: string
  apiKey: string
}

export async function loadEmailIntegration(): Promise<EmailIntegration | null> {
  if (!getSupabaseEnv().configured) return null
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('integration_settings')
      .select('*')
      .eq('provider', 'email')
      .maybeSingle()
    if (!data) return null
    const row = data as IntegrationSetting
    const secrets = parseIntegrationSecrets(row.secret_value)
    const publicValue = (row.public_value ?? {}) as Record<string, string>
    return {
      enabled: row.enabled,
      providerName: (publicValue.provider_name ?? 'resend').toLowerCase(),
      fromAddress: publicValue.from_address ?? 'support@thetradingcube.com',
      apiKey: secrets.api_key ?? '',
    }
  } catch {
    return null
  }
}

export type SendEmailInput = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendTransactionalEmail(input: SendEmailInput) {
  const integration = await loadEmailIntegration()
  if (!integration?.enabled || !integration.apiKey) {
    return { sent: false as const, reason: 'integration_disabled' as const }
  }

  if (integration.providerName.includes('sendgrid')) {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integration.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: input.to }] }],
        from: { email: integration.fromAddress },
        subject: input.subject,
        content: [
          ...(input.text ? [{ type: 'text/plain', value: input.text }] : []),
          { type: 'text/html', value: input.html },
        ],
      }),
    })
    if (!res.ok) {
      console.error('[email] sendgrid failed', res.status, await res.text())
      return { sent: false as const, reason: 'api_error' as const }
    }
    return { sent: true as const }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${integration.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: integration.fromAddress,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })

  if (!res.ok) {
    console.error('[email] resend failed', res.status, await res.text())
    return { sent: false as const, reason: 'api_error' as const }
  }

  return { sent: true as const }
}

export async function sendWelcomeEnrollmentEmail(params: {
  to: string
  name: string
  courseTitles: string[]
  loginUrl: string
}) {
  const courses =
    params.courseTitles.length > 0
      ? `<ul>${params.courseTitles.map((t) => `<li>${t}</li>`).join('')}</ul>`
      : '<p>Your course access is being prepared.</p>'

  return sendTransactionalEmail({
    to: params.to,
    subject: 'Welcome to The Trading Cube Academy',
    html: `
      <p>Hi ${params.name},</p>
      <p>Your academy account is ready. You can sign in and start learning:</p>
      <p><a href="${params.loginUrl}">${params.loginUrl}</a></p>
      <p><strong>Your courses:</strong></p>
      ${courses}
      <p>— The Trading Cube Academy</p>
    `,
    text: `Hi ${params.name},\n\nYour account is ready: ${params.loginUrl}\n\nCourses: ${params.courseTitles.join(', ') || 'See dashboard'}`,
  })
}

export async function sendSupportReplyEmail(params: {
  to: string
  name: string
  subject: string
  reply: string
}) {
  return sendTransactionalEmail({
    to: params.to,
    subject: `Re: ${params.subject}`,
    html: `
      <p>Hi ${params.name},</p>
      <p>Our support team replied to your ticket:</p>
      <blockquote style="border-left:3px solid #F4C522;padding-left:12px;margin:16px 0">${params.reply.replace(/\n/g, '<br>')}</blockquote>
      <p>Reply from your student dashboard if you need more help.</p>
      <p>— The Trading Cube Academy</p>
    `,
    text: `Hi ${params.name},\n\nRe: ${params.subject}\n\n${params.reply}`,
  })
}
