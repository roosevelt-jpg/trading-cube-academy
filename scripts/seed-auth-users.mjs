#!/usr/bin/env node
/**
 * Create/fix admin + student auth users via Supabase Admin API.
 * Run: node scripts/seed-auth-users.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SECRET_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const USERS = [
  {
    email: 'admin@thetradingcube.com',
    password: 'TradingCube2026!',
    profile: { full_name: 'Academy Admin', role: 'admin', avatar_initials: 'AA' },
  },
  {
    email: 'm.harrison@email.com',
    password: 'TradingCube2026!',
    profile: { full_name: 'Marcus Harrison', role: 'student', avatar_initials: 'MH' },
  },
]

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
}

async function upsertUser({ email, password, profile }) {
  console.log(`\n→ ${email}`)
  let user = await findUserByEmail(email)

  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: profile.full_name, role: profile.role },
    })
    if (error) {
      console.warn(`  update failed: ${error.message}`)
    } else {
      user = data.user
      console.log('  ✓ Password reset & email confirmed')
    }
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: profile.full_name, role: profile.role },
    })
    if (error) {
      console.error(`  ✗ create failed: ${error.message}`)
      return
    }
    user = data.user
    console.log('  ✓ User created')
  }

  const row = {
    id: user.id,
    email,
    full_name: profile.full_name,
    role: profile.role,
    status: 'active',
    avatar_initials: profile.avatar_initials,
    last_active_at: new Date().toISOString(),
  }

  const { error: profileErr } = await admin.from('profiles').upsert(row, { onConflict: 'id' })
  if (profileErr) {
    // Legacy schema may lack columns — try minimal upsert
    const minimal = { id: user.id, full_name: profile.full_name, role: profile.role }
    const { error: e2 } = await admin.from('profiles').upsert(minimal, { onConflict: 'id' })
    if (e2) console.warn(`  profile: ${e2.message}`)
    else console.log('  ✓ Profile linked (minimal columns)')
  } else {
    console.log('  ✓ Profile linked')
  }
}

async function main() {
  console.log('Seeding auth users via Admin API…')
  for (const u of USERS) await upsertUser(u)

  // Verify login
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const client = createClient(url, pub)
  const test = await client.auth.signInWithPassword({
    email: 'admin@thetradingcube.com',
    password: 'TradingCube2026!',
  })
  if (test.error) console.warn('\n⚠ Login test failed:', test.error.message)
  else console.log('\n✓ Admin login verified')

  console.log('\nDone. Sign in at /login')
}

main().catch((e) => { console.error(e); process.exit(1) })
