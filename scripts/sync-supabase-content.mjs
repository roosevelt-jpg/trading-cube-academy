/**
 * Sync default CMS images and copy to the connected Supabase project via REST API.
 * Run: node scripts/sync-supabase-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Load .env.local manually
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error('Missing Supabase env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

const DEFAULT_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=1400&q=80&auto=format&fit=crop',
  heroTerminal: 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=900&q=80&auto=format&fit=crop',
  ctaBand: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1400&q=80&auto=format&fit=crop',
  authBackground: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80&auto=format&fit=crop',
  pillars: {
    sequence: 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=600&q=80&auto=format&fit=crop',
    accountability: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop',
    support: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80&auto=format&fit=crop',
  },
  courses: {
    'market-structure-basics': 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=800&q=80&auto=format&fit=crop',
    'risk-management-fundamentals': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80&auto=format&fit=crop',
    'price-action-mastery': 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=800&q=80&auto=format&fit=crop',
    'technical-analysis-101': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop',
    'options-trading-blueprint': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop',
    'trading-psychology-discipline': 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80&auto=format&fit=crop',
  },
}

const PAGE_HERO = {
  about: DEFAULT_IMAGES.heroTerminal,
  courses: DEFAULT_IMAGES.courses['price-action-mastery'],
  method: DEFAULT_IMAGES.hero,
  risk: DEFAULT_IMAGES.courses['risk-management-fundamentals'],
  psychology: DEFAULT_IMAGES.courses['trading-psychology-discipline'],
  resources: DEFAULT_IMAGES.ctaBand,
  faq: DEFAULT_IMAGES.authBackground,
  contact: DEFAULT_IMAGES.authBackground,
}

async function main() {
  console.log('Syncing page hero images…')
  for (const [slug, hero_image_url] of Object.entries(PAGE_HERO)) {
    const { error } = await supabase.from('page_contents').update({ hero_image_url }).eq('slug', slug)
    if (error) console.warn(`  ${slug}:`, error.message)
    else console.log(`  ✓ ${slug}`)
  }

  console.log('Syncing site_settings…')
  const homepage = {
    eyebrow: 'Private trading education · Invite only',
    headline: 'Stop guessing. Start trading with structure.',
    description:
      'A sequential, video-led curriculum built by full-time traders — price action, risk management and execution, taught in order and tested at every step.',
    trustLine: 'TRUSTED BY 300+ ACTIVE TRADERS WORLDWIDE',
    heroImageUrl: DEFAULT_IMAGES.hero,
    heroTerminalImageUrl: DEFAULT_IMAGES.heroTerminal,
    ctaImageUrl: DEFAULT_IMAGES.ctaBand,
  }
  const branding = {
    companyName: 'The Trading Cube Academy',
    tagline: 'Created by traders, for traders.',
    logoIconPathname: '/brand/logo-icon.svg',
    logoBannerPathname: '/brand/logo-banner.jpg',
    logoPathname: '/brand/logo-icon.svg',
  }
  const footer = {
    description: 'Created by traders, for traders. A structured academy for people serious about the markets.',
    email: 'support@thetradingcube.com',
    whatsapp: '447757464428',
  }

  for (const [key, value] of Object.entries({ homepage, branding, footer, images: DEFAULT_IMAGES })) {
    const { error } = await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
    if (error) console.warn(`  ${key}:`, error.message)
    else console.log(`  ✓ ${key}`)
  }

  // Check LMS tables
  const { error: coursesErr } = await supabase.from('courses').select('id').limit(1)
  if (coursesErr) {
    console.log('\n⚠ LMS tables (courses, modules, etc.) are not in this Supabase project yet.')
    console.log('  Run these in the Supabase SQL Editor (https://supabase.com/dashboard/project/fddgprldihdvtumydwzy/sql/new):')
    console.log('    1. supabase/migrations/001_schema.sql')
    console.log('    2. supabase/migrations/002_cms_images.sql')
    console.log('    3. supabase/seed.sql')
  } else {
    console.log('\n✓ courses table exists — run seed.sql if data is missing.')
  }

  console.log('\nDone.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
