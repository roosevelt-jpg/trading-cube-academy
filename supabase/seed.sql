-- Trading Cube Academy — production seed (mockup-aligned)
-- Run after 001_schema.sql. Default passwords: TradingCube2026! (change in production)

-- Fixed IDs for fresh local installs (hosted Supabase may use different UUIDs from Admin API).
-- Admin:  a0000000-0000-4000-8000-000000000001
-- Student: a0000000-0000-4000-8000-000000000002
-- Run `node scripts/seed-auth-users.mjs` on hosted projects before seeding student progress rows.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated',
  'admin@thetradingcube.com',
  crypt('TradingCube2026!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Academy Admin","role":"admin"}'::jsonb,
  now(), now(),
  '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated',
  'student@thetradingcube.com',
  crypt('TradingCube2026!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Marcus Harrison","role":"student"}'::jsonb,
  now(), now(),
  '', '', '', ''
)
on conflict (id) do nothing;

-- Required for email/password sign-in (GoTrue looks up auth.identities)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
(
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  '{"sub":"a0000000-0000-4000-8000-000000000001","email":"admin@thetradingcube.com"}'::jsonb,
  'email',
  'a0000000-0000-4000-8000-000000000001',
  now(), now(), now()
),
(
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000002',
  '{"sub":"a0000000-0000-4000-8000-000000000002","email":"student@thetradingcube.com"}'::jsonb,
  'email',
  'a0000000-0000-4000-8000-000000000002',
  now(), now(), now()
)
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role, status, avatar_initials, last_active_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'admin@thetradingcube.com', 'Academy Admin', 'admin', 'active', 'AA', now()),
  ('a0000000-0000-4000-8000-000000000002', 'student@thetradingcube.com', 'Marcus Harrison', 'student', 'active', 'MH', now())
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  avatar_initials = excluded.avatar_initials;

-- Site settings (CMS)
insert into public.site_settings (key, value) values
('branding', '{"companyName":"The Trading Cube Academy","tagline":"Created by traders, for traders.","logoIconPathname":"/brand/logo-icon.svg","logoBannerPathname":"/brand/logo-banner.jpg","logoPathname":"/brand/logo-icon.svg"}'::jsonb),
('homepage', '{"eyebrow":"Private trading education · Invite only","headline":"Stop guessing. Start trading with structure.","description":"A sequential, video-led curriculum built by full-time traders — price action, risk management and execution, taught in order and tested at every step.","trustLine":"TRUSTED BY 300+ ACTIVE TRADERS WORLDWIDE","heroImageUrl":"/images/hero-trading.svg","heroTerminalImageUrl":"/images/hero-trading.svg","ctaImageUrl":"/images/hero-trading.svg","heroPreview":{"label":"Live curriculum preview","title":"Price Action Mastery · Module 3"},"ctas":{"requestAccess":"Request Access →","memberLogin":"Member Login"},"sections":{"pillars":{"eyebrow":"Why Trading Cube","headline":"Most trading education stops at theory. Ours stops at proof."},"curriculum":{"eyebrow":"Curriculum","headline":"Six courses. One sequence."},"videos":{"eyebrow":"Inside the Curriculum","headline":"A look at the actual lessons.","description":"Unlisted YouTube lessons, streamed straight from the platform — hover to pause."},"howItWorks":{"eyebrow":"How It Works","headline":"From application to certificate."},"results":{"eyebrow":"Results","headline":"Traders who finished the sequence."},"faq":{"eyebrow":"Frequently Asked","headline":"Before you request access."},"cta":{"eyebrow":"Created by traders, for traders","headline":"Ready to trade with structure?","buttonLabel":"Request Access →"}},"navigation":[{"label":"Courses","href":"/courses"},{"label":"Method","href":"/method"},{"label":"About","href":"/about"},{"label":"FAQ","href":"#mkt-faq"}]}'::jsonb),
('footer', '{"description":"Created by traders, for traders. A structured academy for people serious about the markets.","email":"support@thetradingcube.com","whatsapp":"447757464428","curriculumTitle":"Curriculum","academyTitle":"Academy","contactTitle":"Contact","requestAccessLabel":"Request access"}'::jsonb),
('enrollment', '{"inviteOnly":true,"passingScoreDefault":70,"maxQuizAttempts":3}'::jsonb),
('support', '{"email":"support@thetradingcube.com","whatsapp":"447757464428","whatsappLabel":"WhatsApp the desk"}'::jsonb),
('images', '{"logo":"/brand/logo-banner.jpg","hero":"/images/hero-trading.svg","heroTerminal":"/images/hero-trading.svg","ctaBand":"/images/hero-trading.svg","authBackground":"/images/hero-trading.svg","certificateWatermark":"/images/hero-trading.svg","pillars":{"sequence":"/images/hero-trading.svg","accountability":"/images/hero-trading.svg","support":"/images/hero-trading.svg"}}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Marketing stats
insert into public.marketing_stats (id, label, value, accent, sort_order) values
('b1000001-0000-4000-8000-000000000001', 'Active students', '312', 'yellow', 0),
('b1000001-0000-4000-8000-000000000002', 'Core courses, 120+ lessons', '6', null, 1),
('b1000001-0000-4000-8000-000000000003', 'Average quiz score', '84%', 'green', 2),
('b1000001-0000-4000-8000-000000000004', 'First-attempt pass rate', '91%', null, 3);

-- Marketing pillars
insert into public.marketing_pillars (id, number_label, title, body, sort_order) values
('b2000001-0000-4000-8000-000000000001', '01 — SEQUENCE', 'Nothing to skip ahead on', 'Modules unlock in order. You can''t reach Risk Management before you''ve proven you understand Market Structure.', 0),
('b2000001-0000-4000-8000-000000000002', '02 — ACCOUNTABILITY', 'Every section ends in a test', 'Quizzes with a real passing score, tracked attempts, and a certificate only once you''ve actually cleared the bar.', 1),
('b2000001-0000-4000-8000-000000000003', '03 — DIRECT SUPPORT', 'A team, not a ticket queue', 'Stuck on a lesson? Reach the desk directly over WhatsApp or email — no forums, no bots.', 2);

-- Marketing steps
insert into public.marketing_steps (id, number_label, title, body, sort_order) values
('b3000001-0000-4000-8000-000000000001', '01', 'Request access', 'Tell us where you''re starting from. The desk reviews every application directly.', 0),
('b3000001-0000-4000-8000-000000000002', '02', 'Activate your account', 'An invitation link arrives by email. Set a password and you''re in.', 1),
('b3000001-0000-4000-8000-000000000003', '03', 'Learn in sequence', 'Watch, read, then prove it in a quiz. Each pass unlocks the next module.', 2),
('b3000001-0000-4000-8000-000000000004', '04', 'Get certified', 'Clear every module in a course and your completion certificate is issued automatically.', 3);

-- Testimonials
insert into public.testimonials (id, quote, author_name, author_meta, image_url, sort_order) values
('b4000001-0000-4000-8000-000000000001', 'I''d read a dozen books on price action. Nothing stuck until I had to pass a quiz on it. Six weeks in, I finally trade levels instead of guessing at them.', 'Marcus H.', 'Completed Price Action Mastery · 94% avg score', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop', 0),
('b4000001-0000-4000-8000-000000000002', 'The sequencing is the whole point. I couldn''t skip to the exciting stuff — which is exactly why the risk management actually landed this time.', 'Priya N.', 'Completed Risk Management Fundamentals · 96%', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop', 1),
('b4000001-0000-4000-8000-000000000003', 'Emailed the team at 11pm about a failed quiz attempt and had a real answer before I woke up. That kind of support is rare.', 'James O.', 'Active student · 4 courses in progress', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&auto=format&fit=crop', 2)
on conflict (id) do update set quote = excluded.quote, author_meta = excluded.author_meta, image_url = excluded.image_url;

-- FAQ
insert into public.faq_items (id, question, answer, sort_order) values
('b5000001-0000-4000-8000-000000000001', 'How do I get access?', 'Request access above and the desk will follow up directly. Once approved, you''ll get an email invitation to activate your account and set a password.', 0),
('b5000001-0000-4000-8000-000000000002', 'Do I need prior trading experience?', 'No. The curriculum starts at Market Structure Basics and assumes nothing — but it moves quickly, so you should be ready to put in real study time.', 1),
('b5000001-0000-4000-8000-000000000003', 'What happens if I fail a quiz?', 'You can review the lesson and retry. There''s no penalty for a failed attempt — the module simply stays locked until you clear the passing score.', 2),
('b5000001-0000-4000-8000-000000000004', 'Can I use this on my phone?', 'Yes — the full platform, including video lessons and quizzes, is built to work on mobile as well as desktop.', 3),
('b5000001-0000-4000-8000-000000000005', 'Do I get a certificate?', 'Yes. Completing every module and passing every quiz in a course issues a downloadable certificate automatically.', 4);

-- CMS pages (default copy + hero images — admin-editable)
insert into public.page_contents (id, slug, title, eyebrow, description, hero_image_url, sections, primary_cta_label, primary_cta_href) values
('b6000001-0000-4000-8000-000000000001', 'contact', 'Request Access', 'CONTACT THE DESK',
 'Tell us where you''re starting from. Every application is reviewed directly by the Trading Cube team.',
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80&auto=format&fit=crop',
 '[{"heading":"Email the desk","body":"support@thetradingcube.com — we respond within one business day."},{"heading":"WhatsApp","body":"Message the desk directly for quick questions about access or the curriculum."}]'::jsonb,
 'Submit request', '/contact'),
('b6000001-0000-4000-8000-000000000002', 'about', 'About the Academy', 'BUILT FOR BETTER DECISIONS',
 'The Trading Cube Academy turns market curiosity into a structured practice built around process, risk, and review.',
 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=900&q=80&auto=format&fit=crop',
 '[{"heading":"Created by traders, for traders.","body":"Learn from a practical framework that respects the work behind consistent execution."},{"heading":"A clear path through complexity.","body":"Move from market foundations to method, risk management, psychology, and assessment."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000003', 'courses', 'Courses', 'THE LEARNING PATH',
 'A focused curriculum for traders building skill through deliberate practice.',
 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=800&q=80&auto=format&fit=crop',
 '[{"heading":"Foundation","body":"Understand market structure, terminology, and the habits that support clear decisions."},{"heading":"Execution","body":"Develop a repeatable process for planning, entering, managing, and reviewing trades."},{"heading":"Mastery","body":"Test your understanding through modules, quizzes, exams, and certificates."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000004', 'method', 'Trading Method', 'PROCESS OVER PREDICTION',
 'A trading method is a sequence of decisions you can explain, repeat, and improve.',
 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=1400&q=80&auto=format&fit=crop',
 '[{"heading":"Read context","body":"Start with market structure and the conditions around a setup."},{"heading":"Plan the trade","body":"Define entry, invalidation, risk, and management before execution."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000005', 'risk', 'Risk Management', 'PROTECT THE ACCOUNT',
 'Risk management gives your edge enough time to work.',
 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80&auto=format&fit=crop',
 '[{"heading":"Capital first","body":"Position sizing and invalidation matter more than being right on every trade."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000006', 'psychology', 'Market Psychology', 'THE HUMAN EDGE',
 'Build the awareness to recognize pressure, impatience, and overconfidence before they shape a decision.',
 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80&auto=format&fit=crop',
 '[{"heading":"Return to process","body":"Use preparation, limits, and review to make discipline practical."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000007', 'resources', 'Resources', 'OPEN ACCESS',
 'Explore public lessons, market thinking, and marketing videos from the academy.',
 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1400&q=80&auto=format&fit=crop',
 '[{"heading":"Marketing library","body":"Public YouTube videos are curated here; member-only course lessons stay in the dashboard."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000008', 'faq', 'FAQ', 'CLEAR ANSWERS',
 'Find practical answers about learning, accounts, assessments, and certificates.',
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&q=80&auto=format&fit=crop',
 '[{"heading":"How do I get access?","body":"Request access above and the desk will follow up directly. Once approved, you''ll get an email invitation to activate your account and set a password."},{"heading":"Do I need prior trading experience?","body":"No. The curriculum starts at Market Structure Basics and assumes nothing — but it moves quickly, so you should be ready to put in real study time."},{"heading":"What happens if I fail a quiz?","body":"You can review the lesson and retry. There''s no penalty for a failed attempt — the module simply stays locked until you clear the passing score."},{"heading":"Can I use this on my phone?","body":"Yes — the full platform, including video lessons and quizzes, is built to work on mobile as well as desktop."},{"heading":"Do I get a certificate?","body":"Yes. Completing every module and passing every quiz in a course issues a downloadable certificate automatically."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000009', 'privacy', 'Privacy Policy', 'YOUR DATA MATTERS',
 'We collect only the information needed to provide accounts, learning progress, assessments, and support.',
 null,
 '[{"heading":"Account data","body":"Your email, profile, progress, attempts, and certificates are scoped to your account."}]'::jsonb,
 null, null),
('b6000001-0000-4000-8000-000000000010', 'terms', 'Terms of Use', 'LEARN RESPONSIBLY',
 'Academy content is educational and does not constitute financial advice or a promise of trading results.',
 null,
 '[{"heading":"Responsible learning","body":"Use the material to build understanding and process. Make independent decisions and manage risk responsibly."}]'::jsonb,
 null, null)
on conflict (slug) do update set
  title = excluded.title,
  eyebrow = excluded.eyebrow,
  description = excluded.description,
  hero_image_url = excluded.hero_image_url,
  sections = excluded.sections,
  primary_cta_label = excluded.primary_cta_label,
  primary_cta_href = excluded.primary_cta_href;

-- Courses
insert into public.courses (id, slug, title, description, tier, status, module_count, lesson_count, enrolled_count, sort_order, published) values
('c0010000-0000-4000-8000-000000000001', 'market-structure-basics', 'Market Structure Basics', 'Read structure before you trade it', 'foundation', 'live', 4, 16, 280, 0, true),
('c0010000-0000-4000-8000-000000000002', 'risk-management-fundamentals', 'Risk Management Fundamentals', 'Position sizing, R-multiples, drawdown control', 'foundation', 'live', 5, 20, 245, 1, true),
('c0010000-0000-4000-8000-000000000003', 'price-action-mastery', 'Price Action Mastery', 'Read raw price movement without indicators — structure, liquidity, support/resistance and entry timing.', 'core', 'live', 6, 28, 198, 2, true),
('c0010000-0000-4000-8000-000000000004', 'technical-analysis-101', 'Technical Analysis 101', 'Indicators as confirmation, not prediction', 'core', 'live', 5, 22, 156, 3, true),
('c0010000-0000-4000-8000-000000000005', 'options-trading-blueprint', 'Options Trading Blueprint', 'Structuring trades beyond spot', 'advanced', 'live', 4, 18, 89, 4, true),
('c0010000-0000-4000-8000-000000000006', 'trading-psychology-discipline', 'Trading Psychology & Discipline', 'The desk''s own rules for staying in the game', 'advanced', 'live', 4, 16, 72, 5, true);

-- Course card images (trading-industry Unsplash — admin replaceable)
update public.courses set image_url = 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=800&q=80&auto=format&fit=crop' where slug = 'market-structure-basics';
update public.courses set image_url = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80&auto=format&fit=crop' where slug = 'risk-management-fundamentals';
update public.courses set image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=800&q=80&auto=format&fit=crop' where slug = 'price-action-mastery';
update public.courses set image_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop' where slug = 'technical-analysis-101';
update public.courses set image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop' where slug = 'options-trading-blueprint';
update public.courses set image_url = 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80&auto=format&fit=crop' where slug = 'trading-psychology-discipline';

-- Price Action Mastery modules
insert into public.modules (id, course_id, slug, title, sort_order, lesson_count, unlock_after_module_id, published) values
('a0030001-0000-4000-8000-000000000001', 'c0010000-0000-4000-8000-000000000003', 'market-structure-basics', 'Module 1 — Market Structure Basics', 0, 4, null, true),
('a0030001-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000003', 'trend-liquidity', 'Module 2 — Trend & Liquidity', 1, 5, 'a0030001-0000-4000-8000-000000000001', true),
('a0030001-0000-4000-8000-000000000003', 'c0010000-0000-4000-8000-000000000003', 'support-resistance', 'Module 3 — Support & Resistance', 2, 6, 'a0030001-0000-4000-8000-000000000002', true),
('a0030001-0000-4000-8000-000000000004', 'c0010000-0000-4000-8000-000000000003', 'entry-models', 'Module 4 — Entry Models & Confirmation', 3, 5, 'a0030001-0000-4000-8000-000000000003', true);

-- Module 3 lessons
insert into public.lessons (id, module_id, slug, title, lesson_type, content, youtube_video_id, duration_label, duration_seconds, sort_order, published) values
('b0030001-0000-4000-8000-000000000001', 'a0030001-0000-4000-8000-000000000003', 'what-is-a-level', 'What is a Level?', 'video', '{"summary":"Define horizontal and dynamic support/resistance levels."}'::jsonb, 'dQw4w9WgXcQ', '7:12', 432, 0, true),
('b0030001-0000-4000-8000-000000000002', 'a0030001-0000-4000-8000-000000000003', 'horizontal-vs-dynamic', 'Horizontal vs Dynamic S/R', 'video', '{"summary":"Compare fixed levels with trend-based dynamic zones."}'::jsonb, 'dQw4w9WgXcQ', '8:30', 510, 1, true),
('b0030001-0000-4000-8000-000000000003', 'a0030001-0000-4000-8000-000000000003', 'reading-wicks', 'Reading Wicks & Rejection', 'video', '{"summary":"Identify rejection signals at key levels."}'::jsonb, 'dQw4w9WgXcQ', '9:04', 544, 2, true),
('b0030001-0000-4000-8000-000000000004', 'a0030001-0000-4000-8000-000000000003', 'multi-timeframe-confluence', 'Multi-Timeframe Confluence', 'video', '{"summary":"Stacking S/R levels across the 4H, 1H and 15M charts to find zones where multiple timeframes agree — the highest-probability reaction points on the chart."}'::jsonb, 'dQw4w9WgXcQ', '11:02', 662, 3, true),
('b0030001-0000-4000-8000-000000000005', 'a0030001-0000-4000-8000-000000000003', 'zone-vs-line', 'Written: Zone vs Line Debate', 'reading', '{"paragraphs":["A single price line implies a precision the market rarely respects. In practice, support and resistance behave as zones — a band of prices where reactions cluster, not one exact tick.","The width of that zone should scale with the timeframe you''re trading. A 15-minute chart might use a ten-pip band; a weekly chart might need fifty."],"takeaway":"Mark zones, not lines — then wait for a reaction inside the zone before acting on it."}'::jsonb, null, '6 min', 360, 4, true),
('b0030001-0000-4000-8000-000000000006', 'a0030001-0000-4000-8000-000000000003', 'module-quiz', 'Module Quiz', 'quiz', '{}'::jsonb, null, null, null, 5, true);

-- Module 1 & 2 sample lessons (completed by Marcus)
insert into public.lessons (id, module_id, slug, title, lesson_type, content, youtube_video_id, duration_label, sort_order, published) values
('b0030001-0000-4000-8000-000000000010', 'a0030001-0000-4000-8000-000000000001', 'intro-structure', 'Introduction to Market Structure', 'video', '{}'::jsonb, 'dQw4w9WgXcQ', '8:00', 0, true),
('b0030001-0000-4000-8000-000000000011', 'a0030001-0000-4000-8000-000000000002', 'intro-trend', 'Trend Identification', 'video', '{}'::jsonb, 'dQw4w9WgXcQ', '9:00', 0, true);

-- Quiz settings & questions for Module 3
insert into public.module_quiz_settings (module_id, passing_score, attempts_allowed, question_order, time_limit_seconds) values
('a0030001-0000-4000-8000-000000000003', 70, 3, 'sequential', 1800)
on conflict (module_id) do update set time_limit_seconds = excluded.time_limit_seconds;

insert into public.quiz_questions (id, module_id, question, sort_order) values
('d0030001-0000-4000-8000-000000000001', 'a0030001-0000-4000-8000-000000000003', 'What defines a horizontal S/R level?', 0),
('d0030001-0000-4000-8000-000000000002', 'a0030001-0000-4000-8000-000000000003', 'How does a rejection wick differ from a close?', 1),
('d0030001-0000-4000-8000-000000000003', 'a0030001-0000-4000-8000-000000000003', 'A level is tested three times and holds each time, then breaks with a strong close beyond it. What should you expect on the retest?', 2),
('d0030001-0000-4000-8000-000000000004', 'a0030001-0000-4000-8000-000000000003', 'Which timeframe carries more weight in confluence?', 3),
('d0030001-0000-4000-8000-000000000005', 'a0030001-0000-4000-8000-000000000003', 'Should you trade from a single price line or a zone?', 4),
('d0030001-0000-4000-8000-000000000006', 'a0030001-0000-4000-8000-000000000003', 'What happens when former resistance is broken?', 5),
('d0030001-0000-4000-8000-000000000007', 'a0030001-0000-4000-8000-000000000003', 'How wide should a zone be on a 15-minute chart?', 6),
('d0030001-0000-4000-8000-000000000008', 'a0030001-0000-4000-8000-000000000003', 'When is volume most relevant at a level?', 7);

insert into public.quiz_options (id, question_id, option_text, is_correct, sort_order) values
('e0030001-0000-4000-8000-000000000001', 'd0030001-0000-4000-8000-000000000003', 'The level often flips — former resistance becomes support', true, 0),
('e0030001-0000-4000-8000-000000000002', 'd0030001-0000-4000-8000-000000000003', 'Price always reverses back below the level', false, 1),
('e0030001-0000-4000-8000-000000000003', 'd0030001-0000-4000-8000-000000000003', 'The level has no further relevance', false, 2),
('e0030001-0000-4000-8000-000000000004', 'd0030001-0000-4000-8000-000000000003', 'Volume becomes irrelevant after a breakout', false, 3),
('e0030001-0000-4000-8000-000000000005', 'd0030001-0000-4000-8000-000000000001', 'A price area where reactions have clustered historically', true, 0),
('e0030001-0000-4000-8000-000000000006', 'd0030001-0000-4000-8000-000000000001', 'Any round number on the chart', false, 1),
('e0030001-0000-4000-8000-000000000007', 'd0030001-0000-4000-8000-000000000004', 'The higher timeframe', true, 0),
('e0030001-0000-4000-8000-000000000008', 'd0030001-0000-4000-8000-000000000004', 'The lowest timeframe always', false, 1),
('e0030001-0000-4000-8000-000000000009', 'd0030001-0000-4000-8000-000000000005', 'A zone scaled to the timeframe', true, 0),
('e0030001-0000-4000-8000-000000000010', 'd0030001-0000-4000-8000-000000000005', 'A single exact tick', false, 1);

-- YouTube marketing videos (marquee)
insert into public.youtube_videos (id, title, description, video_id, course_name, duration_label, visibility, published, sort_order) values
('f0000001-0000-4000-8000-000000000001', 'Reading Your First Candlestick', 'Foundation preview', 'dQw4w9WgXcQ', 'Market Structure Basics', '6:42', 'marketing', true, 0),
('f0000001-0000-4000-8000-000000000002', 'Position Sizing in 90 Seconds', 'Risk preview', 'dQw4w9WgXcQ', 'Risk Management', '5:18', 'marketing', true, 1),
('f0000001-0000-4000-8000-000000000003', 'Support & Resistance Zones', 'Price action preview', 'dQw4w9WgXcQ', 'Price Action Mastery', '9:04', 'marketing', true, 2),
('f0000001-0000-4000-8000-000000000004', 'RSI vs. Price Action', 'TA preview', 'dQw4w9WgXcQ', 'Technical Analysis 101', '7:26', 'marketing', true, 3),
('f0000001-0000-4000-8000-000000000005', 'Multi-Timeframe Confluence', 'Core lesson preview', 'dQw4w9WgXcQ', 'Price Action Mastery', '11:02', 'marketing', true, 4),
('f0000001-0000-4000-8000-000000000006', 'Drawdown Control Rules', 'Risk preview', 'dQw4w9WgXcQ', 'Risk Management', '6:33', 'marketing', true, 5),
('f0000001-0000-4000-8000-000000000007', 'Options Spreads Explained', 'Advanced preview', 'dQw4w9WgXcQ', 'Options Trading Blueprint', '8:15', 'marketing', true, 6),
('f0000001-0000-4000-8000-000000000008', 'The Revenge Trade Trap', 'Psychology preview', 'dQw4w9WgXcQ', 'Trading Psychology', '5:47', 'marketing', true, 7);

-- Student enrollments & progress (resolves live student profile — works when auth UUIDs differ from seed)
insert into public.enrollments (user_id, course_id, progress_pct)
select s.id, v.course_id, v.progress_pct
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('c0010000-0000-4000-8000-000000000001'::uuid, 100),
  ('c0010000-0000-4000-8000-000000000002'::uuid, 100),
  ('c0010000-0000-4000-8000-000000000003'::uuid, 68),
  ('c0010000-0000-4000-8000-000000000004'::uuid, 32)
) as v(course_id, progress_pct)
where s.id is not null
on conflict (user_id, course_id) do update set progress_pct = excluded.progress_pct;

insert into public.module_progress (user_id, module_id, completed, progress_pct)
select s.id, v.module_id, v.completed, v.progress_pct
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('a0030001-0000-4000-8000-000000000001'::uuid, true, 100),
  ('a0030001-0000-4000-8000-000000000002'::uuid, true, 100),
  ('a0030001-0000-4000-8000-000000000003'::uuid, false, 67)
) as v(module_id, completed, progress_pct)
where s.id is not null
on conflict (user_id, module_id) do update set
  completed = excluded.completed,
  progress_pct = excluded.progress_pct;

insert into public.lesson_progress (user_id, lesson_id, completed, progress_pct)
select s.id, v.lesson_id, v.completed, v.progress_pct
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('b0030001-0000-4000-8000-000000000001'::uuid, true, 100),
  ('b0030001-0000-4000-8000-000000000002'::uuid, true, 100),
  ('b0030001-0000-4000-8000-000000000003'::uuid, true, 100),
  ('b0030001-0000-4000-8000-000000000004'::uuid, false, 57)
) as v(lesson_id, completed, progress_pct)
where s.id is not null
on conflict (user_id, lesson_id) do update set
  completed = excluded.completed,
  progress_pct = excluded.progress_pct;

-- Activity feed
insert into public.activity_events (event_type, title, meta)
select
  v.event_type,
  v.title,
  case v.event_type
    when 'enrollment' then jsonb_build_object('user_id', s.id)
    when 'lesson_complete' then jsonb_build_object(
      'user_id', s.id,
      'lesson_id', 'b0030001-0000-4000-8000-000000000003'::uuid
    )
  end
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('enrollment'::text, 'Marcus Harrison enrolled in Price Action Mastery'),
  ('lesson_complete'::text, 'Marcus Harrison completed Module 3 · Lesson 3')
) as v(event_type, title)
where s.id is not null;

insert into public.activity_events (event_type, title, meta) values
('course_complete', 'Priya N. completed Risk Management Fundamentals', '{"score":96}'::jsonb);

-- Integration API placeholders (admin fills secrets in dashboard)
insert into public.integration_settings (provider, label, enabled, public_value) values
('stripe', 'Stripe Payments', false, '{"publishable_key":""}'::jsonb),
('youtube', 'YouTube Data API', false, '{}'::jsonb),
('blob', 'Vercel Blob Storage', false, '{}'::jsonb),
('email', 'Transactional Email', false, '{"provider_name":"resend","from_address":"support@thetradingcube.com"}'::jsonb),
('whatsapp', 'WhatsApp Business API', false, '{"business_phone":"447757464428","notify_phone":"447757464428","phone_number_id":""}'::jsonb),
('openai', 'OpenAI (optional)', false, '{"model":"gpt-4o-mini"}'::jsonb)
on conflict (provider) do update set label = excluded.label;

-- Support ticket sample
insert into public.support_tickets (user_id, student_name, subject, message, channel, status)
select
  p.id,
  coalesce(p.full_name, 'Student'),
  'Quiz retry question',
  'Can I review my incorrect answers from the Module 2 quiz?',
  'email',
  'open'
from public.profiles p
where p.role = 'student'
order by p.created_at
limit 1;
