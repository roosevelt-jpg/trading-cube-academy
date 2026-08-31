-- Run in Supabase SQL Editor BEFORE seed-student-data.sql
-- Seeds courses, modules, lessons, quizzes, and marketing videos.

insert into public.courses (id, slug, title, description, tier, status, module_count, lesson_count, enrolled_count, sort_order, published) values
('c0010000-0000-4000-8000-000000000001', 'market-structure-basics', 'Market Structure Basics', 'Read structure before you trade it', 'foundation', 'live', 4, 16, 280, 0, true),
('c0010000-0000-4000-8000-000000000002', 'risk-management-fundamentals', 'Risk Management Fundamentals', 'Position sizing, R-multiples, drawdown control', 'foundation', 'live', 5, 20, 245, 1, true),
('c0010000-0000-4000-8000-000000000003', 'price-action-mastery', 'Price Action Mastery', 'Read raw price movement without indicators — structure, liquidity, support/resistance and entry timing.', 'core', 'live', 6, 28, 198, 2, true),
('c0010000-0000-4000-8000-000000000004', 'technical-analysis-101', 'Technical Analysis 101', 'Indicators as confirmation, not prediction', 'core', 'live', 5, 22, 156, 3, true),
('c0010000-0000-4000-8000-000000000005', 'options-trading-blueprint', 'Options Trading Blueprint', 'Structuring trades beyond spot', 'advanced', 'live', 4, 18, 89, 4, true),
('c0010000-0000-4000-8000-000000000006', 'trading-psychology-discipline', 'Trading Psychology & Discipline', 'The desk''s own rules for staying in the game', 'advanced', 'live', 4, 16, 72, 5, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  tier = excluded.tier,
  status = excluded.status,
  module_count = excluded.module_count,
  lesson_count = excluded.lesson_count,
  published = excluded.published;

update public.courses set image_url = 'https://images.unsplash.com/photo-1642790106117-e829e014aba0?w=800&q=80&auto=format&fit=crop' where slug = 'market-structure-basics';
update public.courses set image_url = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80&auto=format&fit=crop' where slug = 'risk-management-fundamentals';
update public.courses set image_url = 'https://images.unsplash.com/photo-1611974789855-9c2a00d0712a?w=800&q=80&auto=format&fit=crop' where slug = 'price-action-mastery';
update public.courses set image_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80&auto=format&fit=crop' where slug = 'technical-analysis-101';
update public.courses set image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&auto=format&fit=crop' where slug = 'options-trading-blueprint';
update public.courses set image_url = 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80&auto=format&fit=crop' where slug = 'trading-psychology-discipline';

insert into public.modules (id, course_id, slug, title, sort_order, lesson_count, unlock_after_module_id, published) values
('m0030001-0000-4000-8000-000000000001', 'c0010000-0000-4000-8000-000000000003', 'market-structure-basics', 'Module 1 — Market Structure Basics', 0, 4, null, true),
('m0030001-0000-4000-8000-000000000002', 'c0010000-0000-4000-8000-000000000003', 'trend-liquidity', 'Module 2 — Trend & Liquidity', 1, 5, 'm0030001-0000-4000-8000-000000000001', true),
('m0030001-0000-4000-8000-000000000003', 'c0010000-0000-4000-8000-000000000003', 'support-resistance', 'Module 3 — Support & Resistance', 2, 6, 'm0030001-0000-4000-8000-000000000002', true),
('m0030001-0000-4000-8000-000000000004', 'c0010000-0000-4000-8000-000000000003', 'entry-models', 'Module 4 — Entry Models & Confirmation', 3, 5, 'm0030001-0000-4000-8000-000000000003', true)
on conflict (id) do update set title = excluded.title, published = excluded.published;

insert into public.lessons (id, module_id, slug, title, lesson_type, content, youtube_video_id, duration_label, duration_seconds, sort_order, published) values
('l0030001-0000-4000-8000-000000000001', 'm0030001-0000-4000-8000-000000000003', 'what-is-a-level', 'What is a Level?', 'video', '{"summary":"Define horizontal and dynamic support/resistance levels."}'::jsonb, 'dQw4w9WgXcQ', '7:12', 432, 0, true),
('l0030001-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000003', 'horizontal-vs-dynamic', 'Horizontal vs Dynamic S/R', 'video', '{"summary":"Compare fixed levels with trend-based dynamic zones."}'::jsonb, 'dQw4w9WgXcQ', '8:30', 510, 1, true),
('l0030001-0000-4000-8000-000000000003', 'm0030001-0000-4000-8000-000000000003', 'reading-wicks', 'Reading Wicks & Rejection', 'video', '{"summary":"Identify rejection signals at key levels."}'::jsonb, 'dQw4w9WgXcQ', '9:04', 544, 2, true),
('l0030001-0000-4000-8000-000000000004', 'm0030001-0000-4000-8000-000000000003', 'multi-timeframe-confluence', 'Multi-Timeframe Confluence', 'video', '{"summary":"Stacking S/R levels across the 4H, 1H and 15M charts to find zones where multiple timeframes agree — the highest-probability reaction points on the chart."}'::jsonb, 'dQw4w9WgXcQ', '11:02', 662, 3, true),
('l0030001-0000-4000-8000-000000000005', 'm0030001-0000-4000-8000-000000000003', 'zone-vs-line', 'Written: Zone vs Line Debate', 'reading', '{"paragraphs":["A single price line implies a precision the market rarely respects. In practice, support and resistance behave as zones — a band of prices where reactions cluster, not one exact tick.","The width of that zone should scale with the timeframe you''re trading. A 15-minute chart might use a ten-pip band; a weekly chart might need fifty."],"takeaway":"Mark zones, not lines — then wait for a reaction inside the zone before acting on it."}'::jsonb, null, '6 min', 360, 4, true),
('l0030001-0000-4000-8000-000000000006', 'm0030001-0000-4000-8000-000000000003', 'module-quiz', 'Module Quiz', 'quiz', '{}'::jsonb, null, null, null, 5, true)
on conflict (id) do update set title = excluded.title, published = excluded.published;

insert into public.lessons (id, module_id, slug, title, lesson_type, content, youtube_video_id, duration_label, sort_order, published) values
('l0030001-0000-4000-8000-000000000010', 'm0030001-0000-4000-8000-000000000001', 'intro-structure', 'Introduction to Market Structure', 'video', '{}'::jsonb, 'dQw4w9WgXcQ', '8:00', 0, true),
('l0030001-0000-4000-8000-000000000011', 'm0030001-0000-4000-8000-000000000002', 'intro-trend', 'Trend Identification', 'video', '{}'::jsonb, 'dQw4w9WgXcQ', '9:00', 0, true)
on conflict (id) do nothing;

insert into public.module_quiz_settings (module_id, passing_score, attempts_allowed, question_order, time_limit_seconds) values
('m0030001-0000-4000-8000-000000000003', 70, 3, 'sequential', 1800)
on conflict (module_id) do update set time_limit_seconds = excluded.time_limit_seconds;

insert into public.quiz_questions (id, module_id, question, sort_order) values
('q0030001-0000-4000-8000-000000000001', 'm0030001-0000-4000-8000-000000000003', 'What defines a horizontal S/R level?', 0),
('q0030001-0000-4000-8000-000000000002', 'm0030001-0000-4000-8000-000000000003', 'How does a rejection wick differ from a close?', 1),
('q0030001-0000-4000-8000-000000000003', 'm0030001-0000-4000-8000-000000000003', 'A level is tested three times and holds each time, then breaks with a strong close beyond it. What should you expect on the retest?', 2),
('q0030001-0000-4000-8000-000000000004', 'm0030001-0000-4000-8000-000000000003', 'Which timeframe carries more weight in confluence?', 3),
('q0030001-0000-4000-8000-000000000005', 'm0030001-0000-4000-8000-000000000003', 'Should you trade from a single price line or a zone?', 4),
('q0030001-0000-4000-8000-000000000006', 'm0030001-0000-4000-8000-000000000003', 'What happens when former resistance is broken?', 5),
('q0030001-0000-4000-8000-000000000007', 'm0030001-0000-4000-8000-000000000003', 'How wide should a zone be on a 15-minute chart?', 6),
('q0030001-0000-4000-8000-000000000008', 'm0030001-0000-4000-8000-000000000003', 'When is volume most relevant at a level?', 7)
on conflict (id) do nothing;

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
('o0030001-0000-4000-8000-000000000010', 'q0030001-0000-4000-8000-000000000005', 'A single exact tick', false, 1)
on conflict (id) do nothing;

insert into public.youtube_videos (id, title, description, video_id, course_name, duration_label, visibility, published, sort_order) values
('v0000001-0000-4000-8000-000000000001', 'Reading Your First Candlestick', 'Foundation preview', 'dQw4w9WgXcQ', 'Market Structure Basics', '6:42', 'marketing', true, 0),
('v0000001-0000-4000-8000-000000000002', 'Position Sizing in 90 Seconds', 'Risk preview', 'dQw4w9WgXcQ', 'Risk Management', '5:18', 'marketing', true, 1),
('v0000001-0000-4000-8000-000000000003', 'Support & Resistance Zones', 'Price action preview', 'dQw4w9WgXcQ', 'Price Action Mastery', '9:04', 'marketing', true, 2),
('v0000001-0000-4000-8000-000000000004', 'RSI vs. Price Action', 'TA preview', 'dQw4w9WgXcQ', 'Technical Analysis 101', '7:26', 'marketing', true, 3),
('v0000001-0000-4000-8000-000000000005', 'Multi-Timeframe Confluence', 'Core lesson preview', 'dQw4w9WgXcQ', 'Price Action Mastery', '11:02', 'marketing', true, 4),
('v0000001-0000-4000-8000-000000000006', 'Drawdown Control Rules', 'Risk preview', 'dQw4w9WgXcQ', 'Risk Management', '6:33', 'marketing', true, 5),
('v0000001-0000-4000-8000-000000000007', 'Options Spreads Explained', 'Advanced preview', 'dQw4w9WgXcQ', 'Options Trading Blueprint', '8:15', 'marketing', true, 6),
('v0000001-0000-4000-8000-000000000008', 'The Revenge Trade Trap', 'Psychology preview', 'dQw4w9WgXcQ', 'Trading Psychology', '5:47', 'marketing', true, 7)
on conflict (id) do nothing;

-- Verify
select slug, title from public.courses order by sort_order;
