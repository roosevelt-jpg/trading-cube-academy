import { DEFAULT_SITE_SETTINGS, mergeSettings } from '@/lib/defaults/cms-defaults'
import type { SiteSettings } from '@/lib/types/database'
import { whatsappUrl } from '@/lib/utils/site'

export const DEFAULT_SUPPORT_WHATSAPP = '447757464428'
export const DEFAULT_SUPPORT_EMAIL = 'support@thetradingcube.com'

export type SupportContact = {
  email: string
  whatsapp: string
  whatsappLabel: string
  waUrl: string
  apiEnabled: boolean
}

export type WhatsAppMessageContext = 'homepage' | 'student' | 'support' | 'lesson'

export function resolveSupportFromSettings(settings?: SiteSettings | null) {
  const support = settings?.support
  const footer = settings?.footer
  const whatsapp = support?.whatsapp ?? footer?.whatsapp ?? DEFAULT_SUPPORT_WHATSAPP
  const email = support?.email ?? footer?.email ?? DEFAULT_SUPPORT_EMAIL
  const whatsappLabel = support?.whatsappLabel ?? 'WhatsApp the desk'
  return { email, whatsapp, whatsappLabel, waUrl: whatsappUrl(whatsapp) }
}

export function buildWhatsAppMessage(
  context: WhatsAppMessageContext,
  profile?: { full_name?: string | null; email?: string | null },
) {
  if (context === 'homepage') {
    return 'Hello Trading Cube Academy — I would like to learn more about access and onboarding.'
  }
  const name = profile?.full_name?.trim() || 'a student'
  const email = profile?.email?.trim()
  const identity = email ? `${name} (${email})` : name
  if (context === 'support') {
    return `Hi, I'm ${identity}, a Trading Cube Academy student. I need help from the desk.`
  }
  if (context === 'lesson') {
    return `Hi, I'm ${identity}. I'm stuck on a lesson and need help from the Trading Cube desk.`
  }
  return `Hi, I'm ${identity}, a Trading Cube Academy student. I have a question for the desk.`
}

export function supportContactUrl(
  contact: Pick<SupportContact, 'whatsapp'>,
  context: WhatsAppMessageContext,
  profile?: { full_name?: string | null; email?: string | null },
) {
  return whatsappUrl(contact.whatsapp, buildWhatsAppMessage(context, profile))
}

export function mergeSiteSettingsRows(rows: { key: string; value: unknown }[] | null | undefined) {
  const raw = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]))
  return mergeSettings(raw) as SiteSettings
}

export function defaultSupportContact(): SupportContact {
  const base = resolveSupportFromSettings(DEFAULT_SITE_SETTINGS)
  return { ...base, apiEnabled: false }
}
