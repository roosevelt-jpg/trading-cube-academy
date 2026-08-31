import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import {
  defaultSupportContact,
  mergeSiteSettingsRows,
  resolveSupportFromSettings,
} from '@/lib/support/contact'
import { loadWhatsAppIntegration } from '@/lib/integrations/whatsapp'
import { whatsappUrl } from '@/lib/utils/site'

export async function GET() {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json(defaultSupportContact())
  }

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('site_settings').select('key,value')
    const settings = mergeSiteSettingsRows(data)
    const base = resolveSupportFromSettings(settings)
    const integration = await loadWhatsAppIntegration()

    const whatsapp = integration?.businessPhone?.trim() || base.whatsapp

    return NextResponse.json({
      email: base.email,
      whatsapp,
      whatsappLabel: base.whatsappLabel,
      waUrl: whatsappUrl(whatsapp),
      apiEnabled: Boolean(integration?.enabled),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unable to load support contact.' },
      { status: 500 },
    )
  }
}
