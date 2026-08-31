import { createClient } from '@/lib/supabase/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { defaultMarketingBundle, defaultPage, DEFAULT_PAGES, mergeSettings } from '@/lib/defaults/cms-defaults'
import type { Course, FaqItem, MarketingPillar, MarketingStat, MarketingStep, PageContent, SiteSettings, Testimonial, YoutubeVideo } from '@/lib/types/database'

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

function mergeCourseImages(courses: Course[], defaults: Course[]): Course[] {
  const bySlug = Object.fromEntries(defaults.map((c) => [c.slug, c.image_url]))
  return courses.map((c) => ({ ...c, image_url: c.image_url ?? bySlug[c.slug] ?? null }))
}

function mergeTestimonialImages(testimonials: Testimonial[], defaults: Testimonial[]): Testimonial[] {
  const byAuthor = Object.fromEntries(defaults.map((t) => [t.author_name, t.image_url]))
  return testimonials.map((t, i) => ({ ...t, image_url: t.image_url ?? byAuthor[t.author_name] ?? defaults[i]?.image_url ?? null }))
}

export async function fetchMarketingData(): Promise<MarketingBundle> {
  const defaults = defaultMarketingBundle()
  const { configured } = getSupabaseEnv()
  if (!configured) return defaults as MarketingBundle

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

  const rawSettings = Object.fromEntries((settingsRes.data ?? []).map((r) => [r.key, r.value]))
  return {
    settings: mergeSettings(rawSettings) as SiteSettings,
    stats: (stats.data?.length ? stats.data : defaults.stats) as MarketingStat[],
    pillars: (pillars.data?.length ? pillars.data : defaults.pillars) as MarketingPillar[],
    steps: (steps.data?.length ? steps.data : defaults.steps) as MarketingStep[],
    testimonials: mergeTestimonialImages((testimonials.data?.length ? testimonials.data : defaults.testimonials) as Testimonial[], defaults.testimonials as Testimonial[]),
    faqs: (faqs.data?.length ? faqs.data : defaults.faqs) as FaqItem[],
    courses: mergeCourseImages((courses.data?.length ? courses.data : defaults.courses) as Course[], defaults.courses as Course[]),
    videos: (videos.data?.length ? videos.data : defaults.videos) as YoutubeVideo[],
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { configured } = getSupabaseEnv()
  if (!configured) return mergeSettings(null) as SiteSettings
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key,value')
  const raw = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))
  return mergeSettings(raw) as SiteSettings
}

export async function fetchContactPage() {
  const settings = await fetchSiteSettings()
  const { configured } = getSupabaseEnv()
  const fallback = defaultPage('contact')
  if (!configured) return { settings, page: fallback as PageContent | null }

  const supabase = await createClient()
  const { data: page } = await supabase.from('page_contents').select('*').eq('slug', 'contact').maybeSingle()
  return {
    settings,
    page: (page ?? fallback) as PageContent | null,
  }
}

export async function fetchCmsPage(slug: string): Promise<{ settings: SiteSettings; page: PageContent | null }> {
  const settings = await fetchSiteSettings()
  const fallback = defaultPage(slug)
  const { configured } = getSupabaseEnv()
  if (!configured) {
    return { settings, page: fallback as PageContent | null }
  }

  const supabase = await createClient()
  const { data: page } = await supabase.from('page_contents').select('*').eq('slug', slug).maybeSingle()
  if (page) return { settings, page: page as PageContent }
  if (fallback) return { settings, page: fallback as PageContent }
  return { settings, page: null }
}

export async function fetchAllPages(): Promise<PageContent[]> {
  const { configured } = getSupabaseEnv()
  const fallbackPages = Object.values(DEFAULT_PAGES) as PageContent[]
  if (!configured) return fallbackPages

  const supabase = await createClient()
  const { data } = await supabase.from('page_contents').select('*').order('slug')
  if (!data?.length) return fallbackPages
  return data as PageContent[]
}
