export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'student'
  status: 'active' | 'pending' | 'suspended'
  avatar_initials: string | null
  last_active_at: string | null
}

export type SiteSettings = {
  branding?: { companyName?: string; tagline?: string; logoPathname?: string }
  homepage?: { eyebrow?: string; headline?: string; description?: string; trustLine?: string }
  footer?: { description?: string; email?: string; whatsapp?: string }
  enrollment?: { inviteOnly?: boolean; passingScoreDefault?: number; maxQuizAttempts?: number }
  support?: { email?: string; whatsapp?: string; whatsappLabel?: string }
}

export type Course = {
  id: string
  slug: string
  title: string
  description: string | null
  tier: 'foundation' | 'core' | 'advanced'
  status: 'draft' | 'live'
  module_count: number
  lesson_count: number
  enrolled_count: number
  sort_order: number
  published: boolean
}

export type Module = {
  id: string
  course_id: string
  slug: string
  title: string
  sort_order: number
  lesson_count: number
  unlock_after_module_id: string | null
  published: boolean
}

export type Lesson = {
  id: string
  module_id: string
  slug: string
  title: string
  lesson_type: 'video' | 'reading' | 'quiz'
  content: Record<string, unknown>
  youtube_video_id: string | null
  duration_label: string | null
  duration_seconds: number | null
  sort_order: number
  published: boolean
}

export type YoutubeVideo = {
  id: string
  title: string
  description: string | null
  video_id: string
  course_name: string | null
  duration_label: string | null
  visibility: 'marketing' | 'course' | 'preview'
  published: boolean
  sort_order: number
}

export type MarketingStat = { id: string; label: string; value: string; accent: string | null; sort_order: number }
export type MarketingPillar = { id: string; number_label: string; title: string; body: string; sort_order: number }
export type MarketingStep = { id: string; number_label: string; title: string; body: string; sort_order: number }
export type Testimonial = { id: string; quote: string; author_name: string; author_meta: string; sort_order: number }
export type FaqItem = { id: string; question: string; answer: string; sort_order: number }
export type PageContent = {
  id: string
  slug: string
  title: string
  eyebrow: string | null
  description: string | null
  sections: { heading: string; body: string }[]
  primary_cta_label: string | null
  primary_cta_href: string | null
}

export type Enrollment = { user_id: string; course_id: string; progress_pct: number; enrolled_at: string }
export type LessonProgress = { id: string; user_id: string; lesson_id: string; completed: boolean; progress_pct: number }
export type ModuleProgress = { id: string; user_id: string; module_id: string; completed: boolean; progress_pct: number }
export type QuizQuestion = { id: string; module_id: string; question: string; sort_order: number }
export type QuizOption = { id: string; question_id: string; option_text: string; is_correct: boolean; sort_order: number }
export type QuizAttempt = { id: string; user_id: string; module_id: string; score: number; passed: boolean; attempt_number: number; answers: Record<string, string> }
export type Certificate = { id: string; user_id: string; course_id: string; certificate_code: string; issued_at: string }
export type SupportTicket = { id: string; user_id: string | null; student_name: string | null; subject: string; message: string; channel: string; status: 'open' | 'closed'; created_at: string }
export type ActivityEvent = { id: string; event_type: string; title: string; meta: Record<string, unknown>; created_at: string }
export type AccessRequest = { id: string; full_name: string | null; email: string; message: string | null; status: string; created_at: string }
