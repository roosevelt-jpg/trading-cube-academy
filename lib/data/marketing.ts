import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import type { Course, FaqItem, MarketingPillar, MarketingStat, MarketingStep, SiteSettings, Testimonial, YoutubeVideo } from '@/lib/types/database'

export type MarketingBundle = {
  settings: SiteSettings
  stats: MarketingStat[]
  pillars: MarketingPillar[]
  steps: MarketingStep[]
  testimonials: Testimonial[]
  faqs: FaqItem[]
  courses: Course[]
  videos: YoutubeVideo[]
}

export async function fetchMarketingData(): Promise<MarketingBundle | null> {
  const { configured } = getSupabaseEnv()
  if (!configured) return null

  const supabase = await createClient()
  const [settingsRes, stats, pillars, steps, testimonials, faqs, courses, videos] = await Promise.all([
    supabase.from('site_settings').select('key,value'),
    supabase.from('marketing_stats').select('*').order('sort_order'),
    supabase.from('marketing_pillars').select('*').order('sort_order'),
    supabase.from('marketing_steps').select('*').order('sort_order'),
    supabase.from('testimonials').select('*').order('sort_order'),
    supabase.from('faq_items').select('*').order('sort_order'),
    supabase.from('courses').select('*').eq('published', true).order('sort_order'),
    supabase.from('youtube_videos').select('*').eq('visibility', 'marketing').eq('published', true).order('sort_order'),
  ])

  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.key, r.value])) as SiteSettings
  return {
    settings,
    stats: (stats.data ?? []) as MarketingStat[],
    pillars: (pillars.data ?? []) as MarketingPillar[],
    steps: (steps.data ?? []) as MarketingStep[],
    testimonials: (testimonials.data ?? []) as Testimonial[],
    faqs: (faqs.data ?? []) as FaqItem[],
    courses: (courses.data ?? []) as Course[],
    videos: (videos.data ?? []) as YoutubeVideo[],
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const { configured } = getSupabaseEnv()
  if (!configured) return null
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key,value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as SiteSettings
}

export async function fetchContactPage() {
  const { configured } = getSupabaseEnv()
  if (!configured) return null
  const supabase = await createClient()
  const [settingsRes, pageRes] = await Promise.all([
    supabase.from('site_settings').select('key,value'),
    supabase.from('page_contents').select('*').eq('slug', 'contact').maybeSingle(),
  ])
  const settings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.key, r.value])) as SiteSettings
  return { settings, page: pageRes.data }
}
