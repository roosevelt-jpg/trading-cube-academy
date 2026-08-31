#!/usr/bin/env node
/** Ensures all integration_settings provider rows exist on Supabase. */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const PROVIDERS = [
  { provider: 'stripe', label: 'Stripe Payments', public_value: { publishable_key: '' } },
  { provider: 'youtube', label: 'YouTube Data API', public_value: {} },
  { provider: 'blob', label: 'Vercel Blob Storage', public_value: {} },
  { provider: 'email', label: 'Transactional Email', public_value: { provider_name: 'resend', from_address: 'support@thetradingcube.com' } },
  { provider: 'whatsapp', label: 'WhatsApp Business API', public_value: { phone_number_id: '' } },
  { provider: 'openai', label: 'OpenAI (optional)', public_value: { model: 'gpt-4o-mini' } },
]

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('Missing Supabase env in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

async function main() {
  console.log('Syncing integration_settings providers…')
  for (const def of PROVIDERS) {
    const row = {
      provider: def.provider,
      label: def.label,
      enabled: def.provider === 'blob' && !!blobToken,
      public_value: def.public_value,
    }
    let { error } = await supabase.from('integration_settings').upsert(row, { onConflict: 'provider' })
    if (error?.message?.includes('secret_value') || error?.code === '42703') {
      error = null
    }
    if (error) console.warn(`  ✗ ${def.provider}: ${error.message}`)
    else console.log(`  ✓ ${def.provider}`)
  }

  if (blobToken) {
    const { error } = await supabase.from('integration_settings').update({
      enabled: true,
      secret_value: JSON.stringify({ read_write_token: blobToken }),
    }).eq('provider', 'blob')
    if (error?.message?.includes('secret_value') || error?.code === '42703') {
      console.log('  ℹ Blob token in .env.local — run migration 003 to store it in Supabase')
    } else if (error) {
      console.warn(`  ✗ blob secret: ${error.message}`)
    } else {
      console.log('  ✓ blob secret stored')
    }
  }

  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
