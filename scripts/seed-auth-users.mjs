#!/usr/bin/env node
/**
 * Create/fix admin + student auth users via Supabase Admin API.
 * Works on hosted Supabase (more reliable than raw auth.users SQL inserts).
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
const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

/** Primary accounts. Student email may already exist as student@thetradingcube.com on older projects. */
const USERS = [
  {
    emails: ['admin@thetradingcube.com'],
    password: 'TradingCube2026!',
    profile: { full_name: 'Academy Admin', role: 'admin', avatar_initials: 'AA' },
  },
  {
    emails: ['m.harrison@email.com', 'student@thetradingcube.com'],
    password: 'TradingCube2026!',
    profile: { full_name: 'Marcus Harrison', role: 'student', avatar_initials: 'MH' },
  },
]

async function listUsers() {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users
}

async function upsertProfile(userId, email, profile) {
  const full = {
    id: userId,
    email,
    full_name: profile.full_name,
    role: profile.role,
    status: 'active',
    avatar_initials: profile.avatar_initials,
  }
  let { error } = await admin.from('profiles').upsert(full, { onConflict: 'id' })
  if (error) {
    const { error: e2 } = await admin.from('profiles').upsert(
      { id: userId, full_name: profile.full_name, role: profile.role },
      { onConflict: 'id' },
    )
    if (e2) throw e2
  }
}

async function upsertUser({ emails, password, profile }) {
  const users = await listUsers()
  const existing = users.find((u) => emails.some((e) => u.email?.toLowerCase() === e.toLowerCase()))
  const primaryEmail = emails[0]

  console.log(`\n→ ${existing?.email ?? primaryEmail}`)

  let user = existing
  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: profile.full_name, role: profile.role },
    })
    if (error) throw error
    user = data.user
    console.log('  ✓ Password set & email confirmed')
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: primaryEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: profile.full_name, role: profile.role },
    })
    if (error) throw error
    user = data.user
    console.log('  ✓ User created')
  }

  await upsertProfile(user.id, user.email ?? primaryEmail, profile)
  console.log('  ✓ Profile linked')
  return user
}

async function main() {
  console.log('Seeding auth users via Admin API…')
  const created = []
  for (const u of USERS) created.push(await upsertUser(u))

  if (pub) {
    const client = createClient(url, pub)
    for (const u of created) {
      const r = await client.auth.signInWithPassword({ email: u.email, password: 'TradingCube2026!' })
      console.log(`  login ${u.email}:`, r.error ? r.error.message : 'OK')
    }
  }

  console.log('\nDone. Sign in at /login')
  console.log('  Admin:   admin@thetradingcube.com / TradingCube2026!')
  console.log('  Student: use the student email shown above (often student@thetradingcube.com)')
}

main().catch((e) => { console.error(e); process.exit(1) })
