import { mergeHeroSliderSettings } from '@/lib/utils/hero-slider'

/**
 * Default CMS content and industry-focused images.
 * Seeded into Supabase via seed.sql; also used when rendering before DB is connected.
 * Admins replace any value through Settings, Pages, or course editors.
 */

export const DEFAULT_IMAGES = {
  logoIcon: '/brand/logo-icon.svg',
  logoBanner: '/brand/logo-banner.jpg',
  logo: '/brand/logo-icon.svg',
  hero: '/images/hero-trading.svg',
  heroTerminal: '/images/hero-trading.svg',
  ctaBand: '/images/hero-trading.svg',
  authBackground: '/images/hero-trading.svg',
  certificateWatermark: '/images/hero-trading.svg',
  pillars: {
    sequence: '/images/card-charts.svg',
    accountability: '/images/card-terminal.svg',
    support: '/images/card-risk.svg',
  },
  courses: {
    'market-structure-basics': '/images/card-charts.svg',
    'risk-management-fundamentals': '/images/card-risk.svg',
    'price-action-mastery': '/images/card-charts.svg',
    'technical-analysis-101': '/images/card-terminal.svg',
    'options-trading-blueprint': '/images/card-terminal.svg',
    'trading-psychology-discipline': '/images/card-risk.svg',
  },
  testimonials: {
    marcus: '/images/avatar.svg',
    priya: '/images/avatar.svg',
    james: '/images/avatar.svg',
  },
} as const

export const DEFAULT_HOMEPAGE_SECTIONS = {
  pillars: { eyebrow: 'Why Trading Cube', headline: 'Most trading education stops at theory. Ours stops at proof.' },
  curriculum: { eyebrow: 'Curriculum', headline: 'Six courses. One sequence.' },
  videos: {
    eyebrow: 'Inside the Curriculum',
    headline: 'A look at the actual lessons.',
    description: 'Unlisted YouTube lessons, streamed straight from the platform — hover to pause.',
  },
  howItWorks: { eyebrow: 'How It Works', headline: 'From application to certificate.' },
  results: { eyebrow: 'Results', headline: 'Traders who finished the sequence.' },
  faq: { eyebrow: 'Frequently Asked', headline: 'Before you request access.' },
  cta: {
    eyebrow: 'Created by traders, for traders',
    headline: 'Ready to trade with structure?',
    buttonLabel: 'Request Access →',
  },
} as const

export const DEFAULT_NAVIGATION: { label: string; href: string }[] = [
  { label: 'Courses', href: '/courses' },
  { label: 'Method', href: '/method' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '#mkt-faq' },
]

export const DEFAULT_SITE_SETTINGS = {
  branding: {
    companyName: 'The Trading Cube Academy',
    tagline: 'Created by traders, for traders.',
    logoIconPathname: DEFAULT_IMAGES.logoIcon,
    logoBannerPathname: DEFAULT_IMAGES.logoBanner,
    logoPathname: DEFAULT_IMAGES.logoBanner,
  },
  homepage: {
    eyebrow: 'Private trading education · Invite only',
    headline: 'Stop guessing. Start trading with structure.',
    description:
      'A sequential, video-led curriculum built by full-time traders — price action, risk management and execution, taught in order and tested at every step.',
    trustLine: 'TRUSTED BY 300+ ACTIVE TRADERS WORLDWIDE',
    heroImageUrl: DEFAULT_IMAGES.hero,
    heroTerminalImageUrl: DEFAULT_IMAGES.heroTerminal,
    ctaImageUrl: DEFAULT_IMAGES.ctaBand,
    heroPreview: { label: 'Live curriculum preview', title: 'Price Action Mastery · Module 3' },
    heroSlider: {
      enabled: true,
      intervalSeconds: 6,
      transition: 'fade',
      transitionDurationMs: 700,
      autoplay: true,
      pauseOnHover: true,
      showDots: true,
      showArrows: true,
      loop: true,
      slides: [],
    },
    ctas: { requestAccess: 'Request Access →', memberLogin: 'Member Login' },
    sections: { ...DEFAULT_HOMEPAGE_SECTIONS },
    navigation: [...DEFAULT_NAVIGATION],
  },
  footer: {
    description: 'Created by traders, for traders. A structured academy for people serious about the markets.',
    email: 'support@thetradingcube.com',
    whatsapp: '447757464428',
    curriculumTitle: 'Curriculum',
    academyTitle: 'Academy',
    contactTitle: 'Contact',
    requestAccessLabel: 'Request access',
  },
  enrollment: { inviteOnly: true, passingScoreDefault: 70, maxQuizAttempts: 3 },
  support: {
    email: 'support@thetradingcube.com',
    whatsapp: '447757464428',
    whatsappLabel: 'WhatsApp the desk',
  },
  images: { ...DEFAULT_IMAGES },
}

export const DEFAULT_STATS = [
  { id: 'stat-1', label: 'Active students', value: '312', accent: 'yellow', sort_order: 0 },
  { id: 'stat-2', label: 'Core courses, 120+ lessons', value: '6', accent: null, sort_order: 1 },
  { id: 'stat-3', label: 'Average quiz score', value: '84%', accent: 'green', sort_order: 2 },
  { id: 'stat-4', label: 'First-attempt pass rate', value: '91%', accent: null, sort_order: 3 },
]

export const DEFAULT_PILLARS = [
  { id: 'p1', number_label: '01 — SEQUENCE', title: 'Nothing to skip ahead on', body: "Modules unlock in order. You can't reach Risk Management before you've proven you understand Market Structure.", sort_order: 0 },
  { id: 'p2', number_label: '02 — ACCOUNTABILITY', title: 'Every section ends in a test', body: "Quizzes with a real passing score, tracked attempts, and a certificate only once you've actually cleared the bar.", sort_order: 1 },
  { id: 'p3', number_label: '03 — DIRECT SUPPORT', title: 'A team, not a ticket queue', body: 'Stuck on a lesson? Reach the desk directly over WhatsApp or email — no forums, no bots.', sort_order: 2 },
]

export const DEFAULT_STEPS = [
  { id: 's1', number_label: '01', title: 'Request access', body: "Tell us where you're starting from. The desk reviews every application directly.", sort_order: 0 },
  { id: 's2', number_label: '02', title: 'Activate your account', body: "An invitation link arrives by email. Set a password and you're in.", sort_order: 1 },
  { id: 's3', number_label: '03', title: 'Learn in sequence', body: 'Watch, read, then prove it in a quiz. Each pass unlocks the next module.', sort_order: 2 },
  { id: 's4', number_label: '04', title: 'Get certified', body: 'Clear every module in a course and your completion certificate is issued automatically.', sort_order: 3 },
]

export const DEFAULT_TESTIMONIALS = [
  { id: 't1', quote: "I'd read a dozen books on price action. Nothing stuck until I had to pass a quiz on it. Six weeks in, I finally trade levels instead of guessing at them.", author_name: 'Marcus H.', author_meta: 'Completed Price Action Mastery · 94% avg score', image_url: DEFAULT_IMAGES.testimonials.marcus, sort_order: 0 },
  { id: 't2', quote: "The sequencing is the whole point. I couldn't skip to the exciting stuff — which is exactly why the risk management actually landed this time.", author_name: 'Priya N.', author_meta: 'Completed Risk Management Fundamentals · 96%', image_url: DEFAULT_IMAGES.testimonials.priya, sort_order: 1 },
  { id: 't3', quote: 'Emailed the team at 11pm about a failed quiz attempt and had a real answer before I woke up. That kind of support is rare.', author_name: 'James O.', author_meta: 'Active student · 4 courses in progress', image_url: DEFAULT_IMAGES.testimonials.james, sort_order: 2 },
]

export const DEFAULT_FAQ = [
  { id: 'f1', question: 'How do I get access?', answer: "Request access above and the desk will follow up directly. Once approved, you'll get an email invitation to activate your account and set a password.", sort_order: 0 },
  { id: 'f2', question: 'Do I need prior trading experience?', answer: 'No. The curriculum starts at Market Structure Basics and assumes nothing — but it moves quickly, so you should be ready to put in real study time.', sort_order: 1 },
  { id: 'f3', question: 'What happens if I fail a quiz?', answer: "You can review the lesson and retry. There's no penalty for a failed attempt — the module simply stays locked until you clear the passing score.", sort_order: 2 },
  { id: 'f4', question: 'Can I use this on my phone?', answer: 'Yes — the full platform, including video lessons and quizzes, is built to work on mobile as well as desktop.', sort_order: 3 },
  { id: 'f5', question: 'Do I get a certificate?', answer: 'Yes. Completing every module and passing every quiz in a course issues a downloadable certificate automatically.', sort_order: 4 },
]

export const DEFAULT_COURSES = [
  { id: 'c1', slug: 'market-structure-basics', title: 'Market Structure Basics', description: 'Read structure before you trade it', tier: 'foundation' as const, status: 'live' as const, module_count: 4, lesson_count: 16, enrolled_count: 280, sort_order: 0, published: true, image_url: DEFAULT_IMAGES.courses['market-structure-basics'] },
  { id: 'c2', slug: 'risk-management-fundamentals', title: 'Risk Management Fundamentals', description: 'Position sizing, R-multiples, drawdown control', tier: 'foundation' as const, status: 'live' as const, module_count: 5, lesson_count: 20, enrolled_count: 245, sort_order: 1, published: true, image_url: DEFAULT_IMAGES.courses['risk-management-fundamentals'] },
  { id: 'c3', slug: 'price-action-mastery', title: 'Price Action Mastery', description: 'Support, resistance, and reading raw candles', tier: 'core' as const, status: 'live' as const, module_count: 6, lesson_count: 28, enrolled_count: 198, sort_order: 2, published: true, image_url: DEFAULT_IMAGES.courses['price-action-mastery'] },
  { id: 'c4', slug: 'technical-analysis-101', title: 'Technical Analysis 101', description: 'Indicators as confirmation, not prediction', tier: 'core' as const, status: 'live' as const, module_count: 5, lesson_count: 22, enrolled_count: 156, sort_order: 3, published: true, image_url: DEFAULT_IMAGES.courses['technical-analysis-101'] },
  { id: 'c5', slug: 'options-trading-blueprint', title: 'Options Trading Blueprint', description: 'Structuring trades beyond spot', tier: 'advanced' as const, status: 'live' as const, module_count: 4, lesson_count: 18, enrolled_count: 89, sort_order: 4, published: true, image_url: DEFAULT_IMAGES.courses['options-trading-blueprint'] },
  { id: 'c6', slug: 'trading-psychology-discipline', title: 'Trading Psychology & Discipline', description: "The desk's own rules for staying in the game", tier: 'advanced' as const, status: 'live' as const, module_count: 4, lesson_count: 16, enrolled_count: 72, sort_order: 5, published: true, image_url: DEFAULT_IMAGES.courses['trading-psychology-discipline'] },
]

export const DEFAULT_VIDEOS = [
  { id: 'v1', title: 'Reading Your First Candlestick', description: 'Foundation preview', video_id: 'dQw4w9WgXcQ', course_name: 'Market Structure Basics', duration_label: '6:42', visibility: 'marketing' as const, published: true, sort_order: 0 },
  { id: 'v2', title: 'Position Sizing in 90 Seconds', description: 'Risk preview', video_id: 'dQw4w9WgXcQ', course_name: 'Risk Management', duration_label: '5:18', visibility: 'marketing' as const, published: true, sort_order: 1 },
  { id: 'v3', title: 'Support & Resistance Zones', description: 'Price action preview', video_id: 'dQw4w9WgXcQ', course_name: 'Price Action Mastery', duration_label: '9:04', visibility: 'marketing' as const, published: true, sort_order: 2 },
  { id: 'v4', title: 'RSI vs. Price Action', description: 'TA preview', video_id: 'dQw4w9WgXcQ', course_name: 'Technical Analysis 101', duration_label: '7:26', visibility: 'marketing' as const, published: true, sort_order: 3 },
  { id: 'v5', title: 'Multi-Timeframe Confluence', description: 'Core lesson preview', video_id: 'dQw4w9WgXcQ', course_name: 'Price Action Mastery', duration_label: '11:02', visibility: 'marketing' as const, published: true, sort_order: 4 },
  { id: 'v6', title: 'Drawdown Control Rules', description: 'Risk preview', video_id: 'dQw4w9WgXcQ', course_name: 'Risk Management', duration_label: '6:33', visibility: 'marketing' as const, published: true, sort_order: 5 },
  { id: 'v7', title: 'Options Spreads Explained', description: 'Advanced preview', video_id: 'dQw4w9WgXcQ', course_name: 'Options Trading Blueprint', duration_label: '8:15', visibility: 'marketing' as const, published: true, sort_order: 6 },
  { id: 'v8', title: 'The Revenge Trade Trap', description: 'Psychology preview', video_id: 'dQw4w9WgXcQ', course_name: 'Trading Psychology', duration_label: '5:47', visibility: 'marketing' as const, published: true, sort_order: 7 },
]

export const DEFAULT_PAGES: Record<string, {
  slug: string
  title: string
  eyebrow: string
  description: string
  hero_image_url?: string
  sections: { heading: string; body: string }[]
  primary_cta_label?: string
  primary_cta_href?: string
}> = {
  about: {
    slug: 'about',
    title: 'About the Academy',
    eyebrow: 'BUILT FOR BETTER DECISIONS',
    description: 'The Trading Cube Academy turns market curiosity into a structured practice built around process, risk, and review.',
    hero_image_url: DEFAULT_IMAGES.heroTerminal,
    sections: [
      { heading: 'Created by traders, for traders.', body: 'Learn from a practical framework that respects the work behind consistent execution.' },
      { heading: 'A clear path through complexity.', body: 'Move from market foundations to method, risk management, psychology, and assessment.' },
    ],
  },
  courses: {
    slug: 'courses',
    title: 'Courses',
    eyebrow: 'THE LEARNING PATH',
    description: 'A focused curriculum for traders building skill through deliberate practice.',
    hero_image_url: DEFAULT_IMAGES.courses['price-action-mastery'],
    sections: [
      { heading: 'Foundation', body: 'Understand market structure, terminology, and the habits that support clear decisions.' },
      { heading: 'Execution', body: 'Develop a repeatable process for planning, entering, managing, and reviewing trades.' },
      { heading: 'Mastery', body: 'Test your understanding through modules, quizzes, exams, and certificates.' },
    ],
  },
  method: {
    slug: 'method',
    title: 'Trading Method',
    eyebrow: 'PROCESS OVER PREDICTION',
    description: 'A trading method is a sequence of decisions you can explain, repeat, and improve.',
    hero_image_url: DEFAULT_IMAGES.hero,
    sections: [
      { heading: 'Read context', body: 'Start with market structure and the conditions around a setup.' },
      { heading: 'Plan the trade', body: 'Define entry, invalidation, risk, and management before execution.' },
    ],
  },
  risk: {
    slug: 'risk',
    title: 'Risk Management',
    eyebrow: 'PROTECT THE ACCOUNT',
    description: 'Risk management gives your edge enough time to work.',
    hero_image_url: DEFAULT_IMAGES.courses['risk-management-fundamentals'],
    sections: [
      { heading: 'Capital first', body: 'Position sizing and invalidation matter more than being right on every trade.' },
    ],
  },
  psychology: {
    slug: 'psychology',
    title: 'Market Psychology',
    eyebrow: 'THE HUMAN EDGE',
    description: 'Build the awareness to recognize pressure, impatience, and overconfidence before they shape a decision.',
    hero_image_url: DEFAULT_IMAGES.courses['trading-psychology-discipline'],
    sections: [
      { heading: 'Return to process', body: 'Use preparation, limits, and review to make discipline practical.' },
    ],
  },
  resources: {
    slug: 'resources',
    title: 'Resources',
    eyebrow: 'OPEN ACCESS',
    description: 'Explore public lessons, market thinking, and marketing videos from the academy.',
    hero_image_url: DEFAULT_IMAGES.ctaBand,
    sections: [
      { heading: 'Marketing library', body: 'Public YouTube videos are curated here; member-only course lessons stay in the dashboard.' },
    ],
  },
  faq: {
    slug: 'faq',
    title: 'FAQ',
    eyebrow: 'CLEAR ANSWERS',
    description: 'Find practical answers about learning, accounts, assessments, and certificates.',
    hero_image_url: DEFAULT_IMAGES.authBackground,
    sections: DEFAULT_FAQ.map((f) => ({ heading: f.question, body: f.answer })),
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    eyebrow: 'YOUR DATA MATTERS',
    description: 'We collect only the information needed to provide accounts, learning progress, assessments, and support.',
    sections: [
      { heading: 'Account data', body: 'Your email, profile, progress, attempts, and certificates are scoped to your account.' },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Use',
    eyebrow: 'LEARN RESPONSIBLY',
    description: 'Academy content is educational and does not constitute financial advice or a promise of trading results.',
    sections: [
      { heading: 'Responsible learning', body: 'Use the material to build understanding and process. Make independent decisions and manage risk responsibly.' },
    ],
  },
  contact: {
    slug: 'contact',
    title: 'Request Access',
    eyebrow: 'CONTACT THE DESK',
    description: "Tell us where you're starting from. Every application is reviewed directly by the Trading Cube team.",
    hero_image_url: DEFAULT_IMAGES.authBackground,
    sections: [
      { heading: 'Email the desk', body: 'support@thetradingcube.com — we respond within one business day.' },
      { heading: 'WhatsApp', body: 'Message the desk directly for quick questions about access or the curriculum.' },
    ],
    primary_cta_label: 'Submit request',
    primary_cta_href: '/contact',
  },
}

export function defaultMarketingBundle() {
  return {
    settings: DEFAULT_SITE_SETTINGS,
    stats: DEFAULT_STATS,
    pillars: DEFAULT_PILLARS,
    steps: DEFAULT_STEPS,
    testimonials: DEFAULT_TESTIMONIALS,
    faqs: DEFAULT_FAQ,
    courses: DEFAULT_COURSES,
    videos: DEFAULT_VIDEOS,
  }
}

export function defaultPage(slug: string) {
  return DEFAULT_PAGES[slug] ?? null
}

export function normalizeAssetUrl(url?: string | null, fallback?: string) {
  if (!url?.trim()) return fallback ?? DEFAULT_IMAGES.hero
  if (url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('WhatsApp')) {
    return fallback ?? DEFAULT_IMAGES.hero
  }
  return url
}

export function mergeSettings(db: Record<string, unknown> | null | undefined) {
  const base = DEFAULT_SITE_SETTINGS
  if (!db) return base
  const homepage = {
    ...base.homepage,
    ...(db.homepage as object),
    sections: {
      ...base.homepage.sections,
      ...((db.homepage as { sections?: object })?.sections ?? {}),
    },
    navigation: ((db.homepage as { navigation?: typeof DEFAULT_NAVIGATION })?.navigation?.length
      ? (db.homepage as { navigation: typeof DEFAULT_NAVIGATION }).navigation
      : base.homepage.navigation),
    ctas: { ...base.homepage.ctas, ...((db.homepage as { ctas?: object })?.ctas ?? {}) },
    heroPreview: { ...base.homepage.heroPreview, ...((db.homepage as { heroPreview?: object })?.heroPreview ?? {}) },
    heroSlider: {
      ...base.homepage.heroSlider,
      ...((db.homepage as { heroSlider?: object })?.heroSlider ?? {}),
    },
  } as typeof base.homepage
  homepage.heroImageUrl = normalizeAssetUrl(homepage.heroImageUrl, DEFAULT_IMAGES.hero) ?? DEFAULT_IMAGES.hero
  homepage.heroTerminalImageUrl = normalizeAssetUrl(homepage.heroTerminalImageUrl, DEFAULT_IMAGES.heroTerminal) ?? DEFAULT_IMAGES.heroTerminal
  homepage.ctaImageUrl = normalizeAssetUrl(homepage.ctaImageUrl, DEFAULT_IMAGES.ctaBand) ?? DEFAULT_IMAGES.ctaBand
  homepage.heroSlider = mergeHeroSliderSettings(homepage.heroSlider)

  const branding = { ...base.branding, ...(db.branding as object) }
  if (branding.logoBannerPathname?.includes('WhatsApp')) {
    branding.logoBannerPathname = DEFAULT_IMAGES.logoBanner
  }
  if (branding.logoPathname?.includes('WhatsApp')) {
    branding.logoPathname = DEFAULT_IMAGES.logoBanner
  }

  const images = { ...base.images, ...(db.images as object) } as typeof base.images
  if (typeof images.logo === 'string' && (images.logo.includes('WhatsApp') || images.logo.includes('unsplash.com'))) {
    images.logo = DEFAULT_IMAGES.logoBanner
  }
  if (images.pillars && typeof images.pillars === 'object') {
    const p = images.pillars as Record<string, string>
    images.pillars = {
      sequence: normalizeAssetUrl(p.sequence, DEFAULT_IMAGES.pillars.sequence),
      accountability: normalizeAssetUrl(p.accountability, DEFAULT_IMAGES.pillars.accountability),
      support: normalizeAssetUrl(p.support, DEFAULT_IMAGES.pillars.support),
    }
  }

  return {
    branding,
    homepage,
    footer: { ...base.footer, ...(db.footer as object) },
    enrollment: { ...base.enrollment, ...(db.enrollment as object) },
    support: { ...base.support, ...(db.support as object) },
    images,
  }
}
