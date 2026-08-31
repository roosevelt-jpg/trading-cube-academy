-- Trading Cube Academy — production seed (mockup-aligned)
-- Run after 001_schema.sql. Default passwords: TradingCube2026! (change in production)

-- Fixed IDs for stable references
-- Admin:  a0000000-0000-4000-8000-000000000001
-- Student: a0000000-0000-4000-8000-000000000002

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
  'm.harrison@email.com',
  crypt('TradingCube2026!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Marcus Harrison","role":"student"}'::jsonb,
  now(), now(),
  '', '', '', ''
)
on conflict (id) do nothing;

insert into public.profiles (id, email, full_name, role, status, avatar_initials, last_active_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'admin@thetradingcube.com', 'Academy Admin', 'admin', 'active', 'AA', now()),
  ('a0000000-0000-4000-8000-000000000002', 'm.harrison@email.com', 'Marcus Harrison', 'student', 'active', 'MH', now())
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  avatar_initials = excluded.avatar_initials;

-- Site settings (CMS)
insert into public.site_settings (key, value) values
('branding', '{"companyName":"The Trading Cube Academy","tagline":"Created by traders, for traders.","logoPathname":"https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-08-28%20at%2001.07.23-KxSUitIOxLLo5caKphzA7Ia47n2FEi.jpeg"}'::jsonb),
('homepage', '{"eyebrow":"Private trading education · Invite only","headline":"Stop guessing. Start trading with structure.","description":"A sequential, video-led curriculum built by full-time traders — price action, risk management and execution, taught in order and tested at every step.","trustLine":"TRUSTED BY 300+ ACTIVE TRADERS WORLDWIDE"}'::jsonb),
('footer', '{"description":"Created by traders, for traders. A structured academy for people serious about the markets.","email":"support@thetradingcube.com","whatsapp":"447757464428"}'::jsonb),
('enrollment', '{"inviteOnly":true,"passingScoreDefault":70,"maxQuizAttempts":3}'::jsonb),
('support', '{"email":"support@thetradingcube.com","whatsapp":"447757464428","whatsappLabel":"WhatsApp the desk"}'::jsonb)
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
insert into public.testimonials (id, quote, author_name, author_meta, sort_order) values
('b4000001-0000-4000-8000-000000000001', 'I''d read a dozen books on price action. Nothing stuck until I had to pass a quiz on it. Six weeks in, I finally trade levels instead of guessing at them.', 'Marcus H.', 'Completed Price Action Mastery · 94% avg score', 0),
('b4000001-0000-4000-8000-000000000002', 'The sequencing is the whole point. I couldn''t skip to the exciting stuff — which is exactly why the risk management actually landed this time.', 'Priya N.', 'Completed Risk Management Fundamentals · 96%', 1),
('b4000001-0000-4000-8000-000000000003', 'Emailed the team at 11pm about a failed quiz attempt and had a real answer before I woke up. That kind of support is rare.', 'James O.', 'Active student · 4 courses in progress', 2);

-- FAQ
insert into public.faq_items (id, question, answer, sort_order) values
('b5000001-0000-4000-8000-000000000001', 'How do I get access?', 'Request access above and the desk will follow up directly. Once approved, you''ll get an email invitation to activate your account and set a password.', 0),
('b5000001-0000-4000-8000-000000000002', 'Do I need prior trading experience?', 'No. The curriculum starts at Market Structure Basics and assumes nothing — but it moves quickly, so you should be ready to put in real study time.', 1),
('b5000001-0000-4000-8000-000000000003', 'What happens if I fail a quiz?', 'You can review the lesson and retry. There''s no penalty for a failed attempt — the module simply stays locked until you clear the passing score.', 2),
('b5000001-0000-4000-8000-000000000004', 'Can I use this on my phone?', 'Yes — the full platform, including video lessons and quizzes, is built to work on mobile as well as desktop.', 3),
('b5000001-0000-4000-8000-000000000005', 'Do I get a certificate?', 'Yes. Completing every module and passing every quiz in a course issues a downloadable certificate automatically.', 4);

-- Contact page CMS
insert into public.page_contents (id, slug, title, eyebrow, description, sections, primary_cta_label, primary_cta_href) values
('b6000001-0000-4000-8000-000000000001', 'contact', 'Request Access', 'CONTACT THE DESK',
 'Tell us where you''re starting from. Every application is reviewed directly by the Trading Cube team.',
 '[{"heading":"Email the desk","body":"support@thetradingcube.com — we respond within one business day."},{"heading":"WhatsApp","body":"Message the desk directly for quick questions about access or the curriculum."}]'::jsonb,
 'Submit request', '/contact')
on conflict (slug) do update set title = excluded.title, description = excluded.description, sections = excluded.sections;

-- Courses
insert into public.courses (id, slug, title, description, tier, status, module_count, lesson_count, enrolled_count, sort_order, published) values
('c0010000-0000-4000-8000-000000000001', 'market-structure-basics', 'Market Structure Basics', 'Read structure before you trade it', 'foundation', 'live', 4, 16, 280, 0, true),
('c0010000-0000-4000-8000-000000000002', 'risk-management-fundamentals', 'Risk Management Fundamentals', 'Position sizing, R-multiples, drawdown control', 'foundation', 'live', 5, 20, 245, 1, true),
('c0010000-0000-4000-8000-000000000003', 'price-action-mastery', 'Price Action Mastery', 'Read raw price movement without indicators — structure, liquidity, support/resistance and entry timing.', 'core', 'live', 6, 28, 198, 2, true),
('c0010000-0000-4000-8000-000000000004', 'technical-analysis-101', 'Technical Analysis 101', 'Indicators as confirmation, not prediction', 'core', 'live', 5, 22, 156, 3, true),
('c0010000-0000-4000-8000-000000000005', 'options-trading-blueprint', 'Options Trading Blueprint', 'Structuring trades beyond spot', 'advanced', 'live', 4, 18, 89, 4, true),
('c0010000-0000-4000-8000-000000000006', 'trading-psychology-discipline', 'Trading Psychology & Discipline', 'The desk''s own rules for staying in the game', 'advanced', 'live', 4, 16, 72, 5, true);

-- Price Action Mastery modules
insert into public.modules (id, course_id, slug, title, sort_order, lesson_count, unlock_after_module_id, published) values
('m0030001-0000-4000-8000-000000000001', 'c0010000-0000-4000-8000-000000000003', 'market-structure-basics', 'Module 1 — Market Structure Basics', 0, 4, null, true),
('m0030001-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000003', 'trend-liquidity', 'Module 2 — Trend & Liquidity', 1, 5, 'm0030001-0000-4000-8000-000000000001', true),
('m0030001-0000-4000-8000-000000000003', 'c0010000-0000-4000-8000-000000000003', 'support-resistance', 'Module 3 — Support & Resistance', 2, 6, 'm0030001-0000-4000-8000-000000000002', true),
('m0030001-0000-4000-8000-000000000004', 'c0010000-0000-4000-8000-000000000003', 'entry-models', 'Module 4 — Entry Models & Confirmation', 3, 5, 'm0030001-0000-4000-8000-000000000003', true);

-- Module 3 lessons
insert into public.lessons (id, module_id, slug, title, lesson_type, content, youtube_video_id, duration_label, duration_seconds, sort_order, published) values
('l0030001-0000-4000-8000-000000000001', 'm0030001-0000-4000-8000-000000000003', 'what-is-a-level', 'What is a Level?', 'video', '{"summary":"Define horizontal and dynamic support/resistance levels."}'::jsonb, 'dQw4w9WgXcQ', '7:12', 432, 0, true),
('l0030001-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000003', 'horizontal-vs-dynamic', 'Horizontal vs Dynamic S/R', 'video', '{"summary":"Compare fixed levels with trend-based dynamic zones."}'::jsonb, 'dQw4w9WgXcQ', '8:30', 510, 1, true),
('l0030001-0000-4000-8000-000000000003', 'm0030001-0000-4000-8000-000000000003', 'reading-wicks', 'Reading Wicks & Rejection', 'video', '{"summary":"Identify rejection signals at key levels."}'::jsonb, 'dQw4w9WgXcQ', '9:04', 544, 2, true),
('l0030001-0000-4000-8000-000000000004', 'm0030001-0000-4000-8000-000000000003', 'multi-timeframe-confluence', 'Multi-Timeframe Confluence', 'video', '{"summary":"Stacking S/R levels across the 4H, 1H and 15M charts to find zones where multiple timeframes agree — the highest-probability reaction points on the chart."}'::jsonb, 'dQw4w9WgXcQ', '11:02', 662, 3, true),
('l0030001-0000-4000-8000-000000000005', 'm0030001-0000-4000-8000-000000000003', 'zone-vs-line', 'Written: Zone vs Line Debate', 'reading', '{"paragraphs":["A single price line implies a precision the market rarely respects. In practice, support and resistance behave as zones — a band of prices where reactions cluster, not one exact tick.","The width of that zone should scale with the timeframe you''re trading. A 15-minute chart might use a ten-pip band; a weekly chart might need fifty."],"takeaway":"Mark zones, not lines — then wait for a reaction inside the zone before acting on it."}'::jsonb, null, '6 min', 360, 4, true),
('l0030001-0000-4000-8000-000000000006', 'm0030001-0000-4000-8000-000000000003', 'module-quiz', 'Module Quiz', 'quiz', '{}'::jsonb, null, null, null, 5, true);

-- Module 1 & 2 sample lessons (completed by Marcus)
insert into public.lessons (id, module_id, slug, title, lesson_type, content, youtube_video_id, duration_label, sort_order, published) values
('l0030001-0000-4000-8000-000000000010', 'm0030001-0000-4000-8000-000000000001', 'intro-structure', 'Introduction to Market Structure', 'video', '{}'::jsonb, 'dQw4w9WgXcQ', '8:00', 0, true),
('l0030001-0000-4000-8000-000000000011', 'm0030001-0000-4000-8000-000000000002', 'intro-trend', 'Trend Identification', 'video', '{}'::jsonb, 'dQw4w9WgXcQ', '9:00', 0, true);

-- Quiz settings & questions for Module 3
insert into public.module_quiz_settings (module_id, passing_score, attempts_allowed, question_order) values
('m0030001-0000-4000-8000-000000000003', 70, 3, 'sequential');

insert into public.quiz_questions (id, module_id, question, sort_order) values
('q0030001-0000-4000-8000-000000000001', 'm0030001-0000-4000-8000-000000000003', 'What defines a horizontal S/R level?', 0),
('q0030001-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000003', 'How does a rejection wick differ from a close?', 1),
('q0030001-0000-4000-8000-000000000003', 'm0030001-0000-4000-8000-000000000003', 'A level is tested three times and holds each time, then breaks with a strong close beyond it. What should you expect on the retest?', 2),
('q0030001-0000-4000-8000-000000000004', 'm0030001-0000-4000-8000-000000000003', 'Which timeframe carries more weight in confluence?', 3),
('q0030001-0000-4000-8000-000000000005', 'm0030001-0000-4000-8000-000000000003', 'Should you trade from a single price line or a zone?', 4),
('q0030001-0000-4000-8000-000000000006', 'm0030001-0000-4000-8000-000000000003', 'What happens when former resistance is broken?', 5),
('q0030001-0000-4000-8000-000000000007', 'm0030001-0000-4000-8000-000000000003', 'How wide should a zone be on a 15-minute chart?', 6),
('q0030001-0000-4000-8000-000000000008', 'm0030001-0000-4000-8000-000000000003', 'When is volume most relevant at a level?', 7);

insert into public.quiz_options (id, question_id, option_text, is_correct, sort_order) values
('o0030001-0000-4000-8000-000000000001', 'q0030001-0000-4000-8000-000000000003', 'The level often flips — former resistance becomes support', true, 0),
('o0030001-0000-4000-8000-000000000002', 'q0030001-0000-4000-8000-000000000003', 'Price always reverses back below the level', false, 1),
('o0030001-0000-4000-8000-000000000003', 'q0030001-0000-4000-8000-000000000003', 'The level has no further relevance', false, 2),
('o0030001-0000-4000-8000-000000000004', 'q0030001-0000-4000-8000-000000000003', 'Volume becomes irrelevant after a breakout', false, 3),
('o0030001-0000-4000-8000-000000000005', 'q0030001-0000-4000-8000-000000000001', 'A price area where reactions have clustered historically', true, 0),
('o0030001-0000-4000-8000-000000000006', 'q0030001-0000-4000-8000-000000000001', 'Any round number on the chart', false, 1),
('o0030001-0000-4000-8000-000000000007', 'q0030001-0000-4000-8000-000000000004', 'The higher timeframe', true, 0),
('o0030001-0000-4000-8000-000000000008', 'q0030001-0000-4000-8000-000000000004', 'The lowest timeframe always', false, 1),
('o0030001-0000-4000-8000-000000000009', 'q0030001-0000-4000-8000-000000000005', 'A zone scaled to the timeframe', true, 0),
('o0030001-0000-4000-8000-000000000010', 'q0030001-0000-4000-8000-000000000005', 'A single exact tick', false, 1);

-- YouTube marketing videos (marquee)
insert into public.youtube_videos (id, title, description, video_id, course_name, duration_label, visibility, published, sort_order) values
('v0000001-0000-4000-8000-000000000001', 'Reading Your First Candlestick', 'Foundation preview', 'dQw4w9WgXcQ', 'Market Structure Basics', '6:42', 'marketing', true, 0),
('v0000001-0000-4000-8000-000000000002', 'Position Sizing in 90 Seconds', 'Risk preview', 'dQw4w9WgXcQ', 'Risk Management', '5:18', 'marketing', true, 1),
('v0000001-0000-4000-8000-000000000003', 'Support & Resistance Zones', 'Price action preview', 'dQw4w9WgXcQ', 'Price Action Mastery', '9:04', 'marketing', true, 2),
('v0000001-0000-4000-8000-000000000004', 'RSI vs. Price Action', 'TA preview', 'dQw4w9WgXcQ', 'Technical Analysis 101', '7:26', 'marketing', true, 3),
('v0000001-0000-4000-8000-000000000005', 'Multi-Timeframe Confluence', 'Core lesson preview', 'dQw4w9WgXcQ', 'Price Action Mastery', '11:02', 'marketing', true, 4),
('v0000001-0000-4000-8000-000000000006', 'Drawdown Control Rules', 'Risk preview', 'dQw4w9WgXcQ', 'Risk Management', '6:33', 'marketing', true, 5),
('v0000001-0000-4000-8000-000000000007', 'Options Spreads Explained', 'Advanced preview', 'dQw4w9WgXcQ', 'Options Trading Blueprint', '8:15', 'marketing', true, 6),
('v0000001-0000-4000-8000-000000000008', 'The Revenge Trade Trap', 'Psychology preview', 'dQw4w9WgXcQ', 'Trading Psychology', '5:47', 'marketing', true, 7);

-- Student enrollments & progress (Marcus)
insert into public.enrollments (user_id, course_id, progress_pct) values
('a0000000-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000001', 100),
('a0000000-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000002', 100),
('a0000000-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000003', 68),
('a0000000-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000004', 32);

insert into public.module_progress (user_id, module_id, completed, progress_pct) values
('a0000000-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000001', true, 100),
('a0000000-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000002', true, 100),
('a0000000-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000003', false, 67);

insert into public.lesson_progress (user_id, lesson_id, completed, progress_pct) values
('a0000000-0000-4000-8000-000000000002', 'l0030001-0000-4000-8000-000000000001', true, 100),
('a0000000-0000-4000-8000-000000000002', 'l0030001-0000-4000-8000-000000000002', true, 100),
('a0000000-0000-4000-8000-000000000002', 'l0030001-0000-4000-8000-000000000003', true, 100),
('a0000000-0000-4000-8000-000000000002', 'l0030001-0000-4000-8000-000000000004', false, 57);

-- Activity feed
insert into public.activity_events (event_type, title, meta) values
('enrollment', 'Marcus Harrison enrolled in Price Action Mastery', '{"user_id":"a0000000-0000-4000-8000-000000000002"}'::jsonb),
('lesson_complete', 'Marcus Harrison completed Module 3 · Lesson 3', '{"user_id":"a0000000-0000-4000-8000-000000000002","lesson_id":"l0030001-0000-4000-8000-000000000003"}'::jsonb),
('course_complete', 'Priya N. completed Risk Management Fundamentals', '{"score":96}'::jsonb);

-- Support ticket sample
insert into public.support_tickets (user_id, student_name, subject, message, channel, status) values
('a0000000-0000-4000-8000-000000000002', 'Marcus Harrison', 'Quiz retry question', 'Can I review my incorrect answers from the Module 2 quiz?', 'email', 'open');
