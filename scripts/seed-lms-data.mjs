#!/usr/bin/env node
/**
 * Seed LMS data (courses, modules, lessons, quizzes, student progress) via Supabase API.
 * Safe to re-run. Works around legacy schema differences (e.g. missing youtube_videos.course_name).
 * Run: node scripts/seed-lms-data.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
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

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const COURSE_IMAGES = {
  'market-structure-basics': 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=800&q=80&auto=format&fit=crop',
  'risk-management-fundamentals': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80&auto=format&fit=crop',
  'price-action-mastery': 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=800&q=80&auto=format&fit=crop',
  'technical-analysis-101': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop',
  'options-trading-blueprint': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop',
  'trading-psychology-discipline': 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80&auto=format&fit=crop',
}

const COURSES = [
  { id: 'c0010000-0000-4000-8000-000000000001', slug: 'market-structure-basics', title: 'Market Structure Basics', description: 'Read structure before you trade it', tier: 'foundation', status: 'live', module_count: 4, lesson_count: 16, enrolled_count: 280, sort_order: 0, published: true },
  { id: 'c0010000-0000-4000-8000-000000000002', slug: 'risk-management-fundamentals', title: 'Risk Management Fundamentals', description: 'Position sizing, R-multiples, drawdown control', tier: 'foundation', status: 'live', module_count: 5, lesson_count: 20, enrolled_count: 245, sort_order: 1, published: true },
  { id: 'c0010000-0000-4000-8000-000000000003', slug: 'price-action-mastery', title: 'Price Action Mastery', description: 'Read raw price movement without indicators — structure, liquidity, support/resistance and entry timing.', tier: 'core', status: 'live', module_count: 6, lesson_count: 28, enrolled_count: 198, sort_order: 2, published: true },
  { id: 'c0010000-0000-4000-8000-000000000004', slug: 'technical-analysis-101', title: 'Technical Analysis 101', description: 'Indicators as confirmation, not prediction', tier: 'core', status: 'live', module_count: 5, lesson_count: 22, enrolled_count: 156, sort_order: 3, published: true },
  { id: 'c0010000-0000-4000-8000-000000000005', slug: 'options-trading-blueprint', title: 'Options Trading Blueprint', description: 'Structuring trades beyond spot', tier: 'advanced', status: 'live', module_count: 4, lesson_count: 18, enrolled_count: 89, sort_order: 4, published: true },
  { id: 'c0010000-0000-4000-8000-000000000006', slug: 'trading-psychology-discipline', title: 'Trading Psychology & Discipline', description: "The desk's own rules for staying in the game", tier: 'advanced', status: 'live', module_count: 4, lesson_count: 16, enrolled_count: 72, sort_order: 5, published: true },
]

const MODULES = [
  { id: 'a0030001-0000-4000-8000-000000000001', course_id: 'c0010000-0000-4000-8000-000000000003', slug: 'market-structure-basics', title: 'Module 1 — Market Structure Basics', sort_order: 0, lesson_count: 4, unlock_after_module_id: null, published: true },
  { id: 'a0030001-0000-4000-8000-000000000002', course_id: 'c0010000-0000-4000-8000-000000000003', slug: 'trend-liquidity', title: 'Module 2 — Trend & Liquidity', sort_order: 1, lesson_count: 5, unlock_after_module_id: 'a0030001-0000-4000-8000-000000000001', published: true },
  { id: 'a0030001-0000-4000-8000-000000000003', course_id: 'c0010000-0000-4000-8000-000000000003', slug: 'support-resistance', title: 'Module 3 — Support & Resistance', sort_order: 2, lesson_count: 6, unlock_after_module_id: 'a0030001-0000-4000-8000-000000000002', published: true },
  { id: 'a0030001-0000-4000-8000-000000000004', course_id: 'c0010000-0000-4000-8000-000000000003', slug: 'entry-models', title: 'Module 4 — Entry Models & Confirmation', sort_order: 3, lesson_count: 5, unlock_after_module_id: 'a0030001-0000-4000-8000-000000000003', published: true },
]

const LESSONS = [
  { id: 'b0030001-0000-4000-8000-000000000001', module_id: 'a0030001-0000-4000-8000-000000000003', slug: 'what-is-a-level', title: 'What is a Level?', lesson_type: 'video', content: { summary: 'Define horizontal and dynamic support/resistance levels.' }, youtube_video_id: 'dQw4w9WgXcQ', duration_label: '7:12', duration_seconds: 432, sort_order: 0, published: true },
  { id: 'b0030001-0000-4000-8000-000000000002', module_id: 'a0030001-0000-4000-8000-000000000003', slug: 'horizontal-vs-dynamic', title: 'Horizontal vs Dynamic S/R', lesson_type: 'video', content: { summary: 'Compare fixed levels with trend-based dynamic zones.' }, youtube_video_id: 'dQw4w9WgXcQ', duration_label: '8:30', duration_seconds: 510, sort_order: 1, published: true },
  { id: 'b0030001-0000-4000-8000-000000000003', module_id: 'a0030001-0000-4000-8000-000000000003', slug: 'reading-wicks', title: 'Reading Wicks & Rejection', lesson_type: 'video', content: { summary: 'Identify rejection signals at key levels.' }, youtube_video_id: 'dQw4w9WgXcQ', duration_label: '9:04', duration_seconds: 544, sort_order: 2, published: true },
  { id: 'b0030001-0000-4000-8000-000000000004', module_id: 'a0030001-0000-4000-8000-000000000003', slug: 'multi-timeframe-confluence', title: 'Multi-Timeframe Confluence', lesson_type: 'video', content: { summary: 'Stacking S/R levels across timeframes to find high-probability reaction zones.' }, youtube_video_id: 'dQw4w9WgXcQ', duration_label: '11:02', duration_seconds: 662, sort_order: 3, published: true },
  { id: 'b0030001-0000-4000-8000-000000000005', module_id: 'a0030001-0000-4000-8000-000000000003', slug: 'zone-vs-line', title: 'Written: Zone vs Line Debate', lesson_type: 'reading', content: { paragraphs: ['A single price line implies a precision the market rarely respects.', 'The width of that zone should scale with the timeframe you are trading.'], takeaway: 'Mark zones, not lines — then wait for a reaction inside the zone before acting on it.' }, youtube_video_id: null, duration_label: '6 min', duration_seconds: 360, sort_order: 4, published: true },
  { id: 'b0030001-0000-4000-8000-000000000006', module_id: 'a0030001-0000-4000-8000-000000000003', slug: 'module-quiz', title: 'Module Quiz', lesson_type: 'quiz', content: {}, youtube_video_id: null, duration_label: null, duration_seconds: null, sort_order: 5, published: true },
  { id: 'b0030001-0000-4000-8000-000000000010', module_id: 'a0030001-0000-4000-8000-000000000001', slug: 'intro-structure', title: 'Introduction to Market Structure', lesson_type: 'video', content: {}, youtube_video_id: 'dQw4w9WgXcQ', duration_label: '8:00', duration_seconds: null, sort_order: 0, published: true },
  { id: 'b0030001-0000-4000-8000-000000000011', module_id: 'a0030001-0000-4000-8000-000000000002', slug: 'intro-trend', title: 'Trend Identification', lesson_type: 'video', content: {}, youtube_video_id: 'dQw4w9WgXcQ', duration_label: '9:00', duration_seconds: null, sort_order: 0, published: true },
]

const QUIZ_QUESTIONS = [
  { id: 'd0030001-0000-4000-8000-000000000001', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'What defines a horizontal S/R level?', sort_order: 0 },
  { id: 'd0030001-0000-4000-8000-000000000002', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'How does a rejection wick differ from a close?', sort_order: 1 },
  { id: 'd0030001-0000-4000-8000-000000000003', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'A level is tested three times and holds each time, then breaks with a strong close beyond it. What should you expect on the retest?', sort_order: 2 },
  { id: 'd0030001-0000-4000-8000-000000000004', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'Which timeframe carries more weight in confluence?', sort_order: 3 },
  { id: 'd0030001-0000-4000-8000-000000000005', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'Should you trade from a single price line or a zone?', sort_order: 4 },
  { id: 'd0030001-0000-4000-8000-000000000006', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'What happens when former resistance is broken?', sort_order: 5 },
  { id: 'd0030001-0000-4000-8000-000000000007', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'How wide should a zone be on a 15-minute chart?', sort_order: 6 },
  { id: 'd0030001-0000-4000-8000-000000000008', module_id: 'a0030001-0000-4000-8000-000000000003', question: 'When is volume most relevant at a level?', sort_order: 7 },
]

const QUIZ_OPTIONS = [
  { id: 'e0030001-0000-4000-8000-000000000001', question_id: 'd0030001-0000-4000-8000-000000000003', option_text: 'The level often flips — former resistance becomes support', is_correct: true, sort_order: 0 },
  { id: 'e0030001-0000-4000-8000-000000000002', question_id: 'd0030001-0000-4000-8000-000000000003', option_text: 'Price always reverses back below the level', is_correct: false, sort_order: 1 },
  { id: 'e0030001-0000-4000-8000-000000000003', question_id: 'd0030001-0000-4000-8000-000000000003', option_text: 'The level has no further relevance', is_correct: false, sort_order: 2 },
  { id: 'e0030001-0000-4000-8000-000000000004', question_id: 'd0030001-0000-4000-8000-000000000003', option_text: 'Volume becomes irrelevant after a breakout', is_correct: false, sort_order: 3 },
  { id: 'e0030001-0000-4000-8000-000000000005', question_id: 'd0030001-0000-4000-8000-000000000001', option_text: 'A price area where reactions have clustered historically', is_correct: true, sort_order: 0 },
  { id: 'e0030001-0000-4000-8000-000000000006', question_id: 'd0030001-0000-4000-8000-000000000001', option_text: 'Any round number on the chart', is_correct: false, sort_order: 1 },
  { id: 'e0030001-0000-4000-8000-000000000007', question_id: 'd0030001-0000-4000-8000-000000000004', option_text: 'The higher timeframe', is_correct: true, sort_order: 0 },
  { id: 'e0030001-0000-4000-8000-000000000008', question_id: 'd0030001-0000-4000-8000-000000000004', option_text: 'The lowest timeframe always', is_correct: false, sort_order: 1 },
  { id: 'e0030001-0000-4000-8000-000000000009', question_id: 'd0030001-0000-4000-8000-000000000005', option_text: 'A zone scaled to the timeframe', is_correct: true, sort_order: 0 },
  { id: 'e0030001-0000-4000-8000-000000000010', question_id: 'd0030001-0000-4000-8000-000000000005', option_text: 'A single exact tick', is_correct: false, sort_order: 1 },
]

const YOUTUBE_VIDEOS = [
  { id: 'f0000001-0000-4000-8000-000000000001', title: 'Reading Your First Candlestick', description: 'Foundation preview', course_name: 'Market Structure Basics', video_id: 'dQw4w9WgXcQ', duration_label: '6:42', visibility: 'marketing', published: true, sort_order: 0 },
  { id: 'f0000001-0000-4000-8000-000000000002', title: 'Position Sizing in 90 Seconds', description: 'Risk preview', course_name: 'Risk Management', video_id: 'dQw4w9WgXcQ', duration_label: '5:18', visibility: 'marketing', published: true, sort_order: 1 },
  { id: 'f0000001-0000-4000-8000-000000000003', title: 'Support & Resistance Zones', description: 'Price action preview', course_name: 'Price Action Mastery', video_id: 'dQw4w9WgXcQ', duration_label: '9:04', visibility: 'marketing', published: true, sort_order: 2 },
  { id: 'f0000001-0000-4000-8000-000000000004', title: 'RSI vs. Price Action', description: 'TA preview', course_name: 'Technical Analysis 101', video_id: 'dQw4w9WgXcQ', duration_label: '7:26', visibility: 'marketing', published: true, sort_order: 3 },
  { id: 'f0000001-0000-4000-8000-000000000005', title: 'Multi-Timeframe Confluence', description: 'Core lesson preview', course_name: 'Price Action Mastery', video_id: 'dQw4w9WgXcQ', duration_label: '11:02', visibility: 'marketing', published: true, sort_order: 4 },
  { id: 'f0000001-0000-4000-8000-000000000006', title: 'Drawdown Control Rules', description: 'Risk preview', course_name: 'Risk Management', video_id: 'dQw4w9WgXcQ', duration_label: '6:33', visibility: 'marketing', published: true, sort_order: 5 },
  { id: 'f0000001-0000-4000-8000-000000000007', title: 'Options Spreads Explained', description: 'Advanced preview', course_name: 'Options Trading Blueprint', video_id: 'dQw4w9WgXcQ', duration_label: '8:15', visibility: 'marketing', published: true, sort_order: 6 },
  { id: 'f0000001-0000-4000-8000-000000000008', title: 'The Revenge Trade Trap', description: 'Psychology preview', course_name: 'Trading Psychology', video_id: 'dQw4w9WgXcQ', duration_label: '5:47', visibility: 'marketing', published: true, sort_order: 7 },
]

async function upsert(table, rows, onConflict = 'id') {
  const { error } = await db.from(table).upsert(rows, { onConflict })
  if (error) throw new Error(`${table}: ${error.message}`)
  console.log(`  ✓ ${table} (${rows.length} rows)`)
}

async function detectYoutubeColumns() {
  const probeId = 'f0000001-0000-4000-8000-000000000099'
  const base = {
    id: probeId,
    title: 'probe',
    video_id: 'probe',
    visibility: 'marketing',
    published: false,
    sort_order: 999,
  }
  const cols = { description: false, course_name: false, duration_label: false }

  async function tryInsert(extra) {
    await db.from('youtube_videos').delete().eq('id', probeId)
    return db.from('youtube_videos').insert({ ...base, ...extra })
  }

  let r = await tryInsert({ description: 'probe' })
  cols.description = !r.error

  r = await tryInsert({ description: 'probe', course_name: 'probe' })
  cols.course_name = !r.error

  r = await tryInsert({ description: 'probe', duration_label: '0:00' })
  cols.duration_label = !r.error

  await db.from('youtube_videos').delete().eq('id', probeId)
  return cols
}

function buildYoutubeRows(cols) {
  return YOUTUBE_VIDEOS.map((v) => {
    const row = {
      id: v.id,
      title: v.title,
      video_id: v.video_id,
      visibility: v.visibility,
      published: v.published,
      sort_order: v.sort_order,
    }
    const descParts = []
    if (!cols.course_name && v.course_name) descParts.push(v.course_name)
    if (!cols.duration_label && v.duration_label) descParts.push(v.duration_label)
    if (v.description) descParts.push(v.description)
    if (cols.description) row.description = descParts.join(' · ')
    if (cols.course_name) row.course_name = v.course_name
    if (cols.duration_label) row.duration_label = v.duration_label
    return row
  })
}

async function detectModuleProgressShape() {
  const probe = {
    user_id: '00000000-0000-4000-8000-000000000099',
    module_id: 'a0030001-0000-4000-8000-000000000001',
    completed: false,
    progress_pct: 0,
  }
  const { error } = await db.from('module_progress').insert(probe)
  if (!error) {
    await db.from('module_progress').delete().eq('user_id', probe.user_id)
    return 'module_id'
  }
  if (String(error.message).includes('module_id')) return 'module_key'
  throw new Error(`module_progress: ${error.message}`)
}

const MODULE_SLUGS = {
  'a0030001-0000-4000-8000-000000000001': 'market-structure-basics',
  'a0030001-0000-4000-8000-000000000002': 'trend-liquidity',
  'a0030001-0000-4000-8000-000000000003': 'support-resistance',
}

async function seedStudentData(studentId, studentName) {
  const enrollments = [
    { user_id: studentId, course_id: 'c0010000-0000-4000-8000-000000000001', progress_pct: 100 },
    { user_id: studentId, course_id: 'c0010000-0000-4000-8000-000000000002', progress_pct: 100 },
    { user_id: studentId, course_id: 'c0010000-0000-4000-8000-000000000003', progress_pct: 68 },
    { user_id: studentId, course_id: 'c0010000-0000-4000-8000-000000000004', progress_pct: 32 },
  ]
  await upsert('enrollments', enrollments, 'user_id,course_id')

  const moduleProgressShape = await detectModuleProgressShape()
  const moduleProgress = [
    { id: 'a0030001-0000-4000-8000-000000000001', completed: true, progress_pct: 100 },
    { id: 'a0030001-0000-4000-8000-000000000002', completed: true, progress_pct: 100 },
    { id: 'a0030001-0000-4000-8000-000000000003', completed: false, progress_pct: 67 },
  ]
  for (const row of moduleProgress) {
    const payload =
      moduleProgressShape === 'module_id'
        ? { user_id: studentId, module_id: row.id, completed: row.completed, progress_pct: row.progress_pct }
        : { user_id: studentId, module_key: MODULE_SLUGS[row.id], completed: row.completed }
    const onConflict = moduleProgressShape === 'module_id' ? 'user_id,module_id' : 'user_id,module_key'
    const { error } = await db.from('module_progress').upsert(payload, { onConflict })
    if (error) throw new Error(`module_progress: ${error.message}`)
  }
  console.log(`  ✓ module_progress (${moduleProgress.length} rows, ${moduleProgressShape} schema)`)

  const lessonProgress = [
    { user_id: studentId, lesson_id: 'b0030001-0000-4000-8000-000000000001', completed: true, progress_pct: 100 },
    { user_id: studentId, lesson_id: 'b0030001-0000-4000-8000-000000000002', completed: true, progress_pct: 100 },
    { user_id: studentId, lesson_id: 'b0030001-0000-4000-8000-000000000003', completed: true, progress_pct: 100 },
    { user_id: studentId, lesson_id: 'b0030001-0000-4000-8000-000000000004', completed: false, progress_pct: 57 },
  ]
  for (const row of lessonProgress) {
    const { error } = await db.from('lesson_progress').upsert(row, { onConflict: 'user_id,lesson_id' })
    if (error) throw new Error(`lesson_progress: ${error.message}`)
  }
  console.log(`  ✓ lesson_progress (${lessonProgress.length} rows)`)

  await db.from('activity_events').insert([
    { event_type: 'enrollment', title: `${studentName} enrolled in Price Action Mastery`, meta: { user_id: studentId } },
    { event_type: 'lesson_complete', title: `${studentName} completed Module 3 · Lesson 3`, meta: { user_id: studentId, lesson_id: 'b0030001-0000-4000-8000-000000000003' } },
  ])
  console.log('  ✓ activity_events (2 rows)')

  const { count } = await db.from('support_tickets').select('id', { count: 'exact', head: true }).eq('user_id', studentId)
  if (!count) {
    const { error } = await db.from('support_tickets').insert({
      user_id: studentId,
      student_name: studentName,
      subject: 'Quiz retry question',
      message: 'Can I review my incorrect answers from the Module 2 quiz?',
      channel: 'email',
      status: 'open',
    })
    if (error) throw new Error(`support_tickets: ${error.message}`)
    console.log('  ✓ support_tickets (1 row)')
  } else {
    console.log('  ✓ support_tickets (already exists)')
  }
}

async function main() {
  console.log('Seeding LMS data to Supabase…\n')

  await upsert('courses', COURSES)
  for (const c of COURSES) {
    const image_url = COURSE_IMAGES[c.slug]
    if (image_url) await db.from('courses').update({ image_url }).eq('id', c.id)
  }
  console.log('  ✓ course images')

  await upsert('modules', MODULES)
  await upsert('lessons', LESSONS)

  await upsert('module_quiz_settings', [{
    module_id: 'a0030001-0000-4000-8000-000000000003',
    passing_score: 70,
    attempts_allowed: 3,
    question_order: 'sequential',
    time_limit_seconds: 1800,
  }], 'module_id')

  await upsert('quiz_questions', QUIZ_QUESTIONS)
  await upsert('quiz_options', QUIZ_OPTIONS)

  const ytCols = await detectYoutubeColumns()
  const videos = buildYoutubeRows(ytCols)
  await upsert('youtube_videos', videos)
  if (!ytCols.course_name || !ytCols.duration_label) {
    console.log('  (youtube_videos: legacy schema — extra fields stored in description)')
  }

  const { data: student } = await db.from('profiles').select('id, full_name').eq('role', 'student').order('created_at').limit(1).maybeSingle()
  if (!student) {
    console.warn('\n⚠ No student profile found. Run: node scripts/seed-auth-users.mjs')
  } else {
    console.log(`\nStudent: ${student.full_name ?? 'Student'} (${student.id})`)
    await seedStudentData(student.id, student.full_name ?? 'Student')
  }

  const { count } = await db.from('courses').select('id', { count: 'exact', head: true })
  console.log(`\nDone. ${count} courses in database.`)
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1) })
