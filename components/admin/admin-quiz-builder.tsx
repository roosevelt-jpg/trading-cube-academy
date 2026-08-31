'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel, Pill } from '@/components/ui/academy-ui'
import type { Profile, QuizAttempt, QuizOption, QuizProctoringRecording } from '@/lib/types/database'
import { formatDateTime } from '@/lib/utils/datetime'

type QuizQuestion = { id: string; module_id: string; question: string; sort_order: number }

const EMPTY_OPTIONS = () => [
  { text: '', correct: true },
  { text: '', correct: false },
  { text: '', correct: false },
  { text: '', correct: false },
]

export function AdminQuizBuilder({ courseSlug }: { courseSlug: string }) {
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [passing, setPassing] = useState<number | null>(null)
  const [attemptsAllowed, setAttemptsAllowed] = useState<number | null>(null)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [proctoringRequired, setProctoringRequired] = useState<boolean | null>(null)
  const [questionOrder, setQuestionOrder] = useState<string | null>(null)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newOptions, setNewOptions] = useState(EMPTY_OPTIONS)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [editOptions, setEditOptions] = useState<{ id?: string; text: string; correct: boolean }[]>([])
  const [savingEdit, setSavingEdit] = useState(false)

  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,title,slug').eq('slug', courseSlug).maybeSingle()
    if (!course) return null
    const { data: modules } = await client.from('modules').select('*').eq('course_id', course.id).order('sort_order')
    return { course, modules: modules ?? [] }
  }, [courseSlug])

  const { data, loading } = useRealtimeQuery('modules', fetcher, [courseSlug])
  const activeModuleId = selectedModuleId ?? data?.modules?.[0]?.id ?? null

  const moduleFetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    if (!activeModuleId) return null
    const [{ data: questions }, { data: options }, { data: settings }, { data: mod }, { data: attempts }, { data: recordings }] = await Promise.all([
      client.from('quiz_questions').select('*').eq('module_id', activeModuleId).order('sort_order'),
      client.from('quiz_options').select('*'),
      client.from('module_quiz_settings').select('*').eq('module_id', activeModuleId).maybeSingle(),
      client.from('modules').select('*').eq('id', activeModuleId).maybeSingle(),
      client.from('quiz_attempts').select('*').eq('module_id', activeModuleId).order('created_at', { ascending: false }),
      client.from('quiz_proctoring_recordings').select('*').eq('module_id', activeModuleId).order('created_at', { ascending: false }),
    ])

    const questionIds = (questions ?? []).map((q: QuizQuestion) => q.id)
    const optsForModule = (options ?? []).filter((o: QuizOption) => questionIds.includes(o.question_id))

    const userIds = [...new Set((attempts ?? []).map((a: QuizAttempt) => a.user_id))]
    const { data: profiles } = userIds.length
      ? await client.from('profiles').select('id,full_name,email').in('id', userIds)
      : { data: [] as Profile[] }

    const profileMap = Object.fromEntries(((profiles ?? []) as Profile[]).map((p) => [p.id, p]))
    const recordingsByAttempt = ((recordings ?? []) as QuizProctoringRecording[]).reduce<Record<string, QuizProctoringRecording[]>>((acc, r) => {
      acc[r.attempt_id] = [...(acc[r.attempt_id] ?? []), r]
      return acc
    }, {})

    return {
      module: mod,
      questions: (questions ?? []) as QuizQuestion[],
      options: optsForModule as QuizOption[],
      settings,
      recordingsByAttempt,
      attempts: ((attempts ?? []) as QuizAttempt[]).map((a) => ({
        ...a,
        student: profileMap[a.user_id] ?? null,
        recordings: recordingsByAttempt[a.id] ?? [],
      })),
    }
  }, [activeModuleId])

  const { data: moduleData, loading: moduleLoading, reload: reloadModule } = useRealtimeQuery(
    'quiz_questions',
    moduleFetcher,
    [activeModuleId],
  )

  if (loading) return <LoadingState />
  if (!data?.course) return <div className="content-pad">Course not found.</div>
  if (!data.modules.length) return <div className="content-pad">No modules found.</div>

  const mod = moduleData?.module
  const questions = moduleData?.questions ?? []
  const options = moduleData?.options ?? []
  const settings = moduleData?.settings
  const attempts = moduleData?.attempts ?? []

  const optionsByQuestion = options.reduce<Record<string, QuizOption[]>>((acc, o) => {
    acc[o.question_id] = [...(acc[o.question_id] ?? []), o]
    return acc
  }, {})

  const saveSettings = async () => {
    if (!mod) return
    const score = passing ?? settings?.passing_score ?? 70
    const allowed = attemptsAllowed ?? settings?.attempts_allowed ?? 3
    const mins = timeLimitMinutes ?? (settings?.time_limit_seconds ? Math.round(settings.time_limit_seconds / 60) : null)
    const time_limit_seconds = mins && mins > 0 ? mins * 60 : null
    const proctoring = proctoringRequired ?? settings?.proctoring_required ?? true
    const order = questionOrder ?? settings?.question_order ?? 'sequential'
    await createClient().from('module_quiz_settings').upsert({
      module_id: mod.id,
      passing_score: score,
      attempts_allowed: allowed,
      time_limit_seconds,
      question_order: order,
      proctoring_required: proctoring,
    })
    setPassing(null)
    setAttemptsAllowed(null)
    setTimeLimitMinutes(null)
    setProctoringRequired(null)
    setQuestionOrder(null)
    reloadModule()
  }

  const addQuestion = async () => {
    if (!mod || !newQuestion.trim()) return
    const filled = newOptions.filter((o) => o.text.trim())
    if (filled.length < 2) return
    if (!filled.some((o) => o.correct)) return

    setSavingQuestion(true)
    try {
      const client = createClient()
      const { data: q, error } = await client.from('quiz_questions').insert({
        module_id: mod.id,
        question: newQuestion.trim(),
        sort_order: questions.length,
      }).select('*').single()

      if (error || !q) return

      await client.from('quiz_options').insert(
        filled.map((o, i) => ({
          question_id: q.id,
          option_text: o.text.trim(),
          is_correct: o.correct,
          sort_order: i,
        })),
      )

      setNewQuestion('')
      setNewOptions(EMPTY_OPTIONS())
      setShowAddForm(false)
      reloadModule()
    } finally {
      setSavingQuestion(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    await createClient().from('quiz_questions').delete().eq('id', questionId)
    setEditingQuestionId(null)
    reloadModule()
  }

  const startEditQuestion = (questionId: string) => {
    const q = questions.find((item) => item.id === questionId)
    if (!q) return
    const opts = (optionsByQuestion[questionId] ?? []).sort((a, b) => a.sort_order - b.sort_order)
    setEditingQuestionId(questionId)
    setEditQuestionText(q.question)
    setEditOptions(
      opts.length
        ? opts.map((o) => ({ id: o.id, text: o.option_text, correct: o.is_correct }))
        : EMPTY_OPTIONS(),
    )
    setShowAddForm(false)
  }

  const saveEditedQuestion = async () => {
    if (!editingQuestionId || !editQuestionText.trim()) return
    const filled = editOptions.filter((o) => o.text.trim())
    if (filled.length < 2 || !filled.some((o) => o.correct)) return

    setSavingEdit(true)
    try {
      const client = createClient()
      await client.from('quiz_questions').update({ question: editQuestionText.trim() }).eq('id', editingQuestionId)
      await client.from('quiz_options').delete().eq('question_id', editingQuestionId)
      await client.from('quiz_options').insert(
        filled.map((o, i) => ({
          question_id: editingQuestionId,
          option_text: o.text.trim(),
          is_correct: o.correct,
          sort_order: i,
        })),
      )

      setEditingQuestionId(null)
      reloadModule()
    } finally {
      setSavingEdit(false)
    }
  }

  const currentTimeMins = timeLimitMinutes ?? (settings?.time_limit_seconds ? Math.round(settings.time_limit_seconds / 60) : 0)
  const currentProctoring = proctoringRequired ?? settings?.proctoring_required ?? true

  return (
    <div className="content-pad max-w-3xl">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Eyebrow>Quiz & examination builder</Eyebrow>
          <p className="muted mt-1 text-sm">Create questions, set timers, and review student submissions. Students see quizzes live once questions are saved.</p>
        </div>
        <Btn size="sm" onClick={saveSettings}>Save settings</Btn>
      </div>

      <Panel className="mt-6 space-y-4 p-6">
        <div className="input-group">
          <label>Module</label>
          <select className="input" value={activeModuleId ?? ''} onChange={(e) => setSelectedModuleId(e.target.value)}>
            {data.modules.map((m: { id: string; title: string }) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="input-group">
            <label>Passing score (%)</label>
            <input className="input" type="number" min={1} max={100} defaultValue={settings?.passing_score ?? 70} onChange={(e) => setPassing(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label>Attempts allowed</label>
            <input className="input" type="number" min={1} max={10} defaultValue={settings?.attempts_allowed ?? 3} onChange={(e) => setAttemptsAllowed(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label>Time limit (minutes)</label>
            <input className="input" type="number" min={0} placeholder="0 = no timer" defaultValue={currentTimeMins || ''} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} />
          </div>
          <div className="input-group">
            <label>Question order</label>
            <select className="input" defaultValue={settings?.question_order ?? 'sequential'} onChange={(e) => setQuestionOrder(e.target.value)}>
              <option value="sequential">Fixed</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="accent-yellow"
            checked={currentProctoring}
            onChange={(e) => setProctoringRequired(e.target.checked)}
          />
          Require webcam proctoring (camera + microphone recorded for admin review)
        </label>
        <p className="muted text-xs">Timed exams use a server-synced countdown and auto-submit when time runs out. Proctored exams require students to enable their camera before starting.</p>
      </Panel>

      <div className="mt-8 flex items-center justify-between gap-4">
        <Eyebrow>Questions ({questions.length})</Eyebrow>
        <Btn size="sm" variant="ghost" onClick={() => setShowAddForm((v) => !v)}>{showAddForm ? 'Cancel' : '+ Add question'}</Btn>
      </div>

      {showAddForm && (
        <Panel className="mt-4 space-y-4 p-6">
          <div className="input-group">
            <label>Question text</label>
            <textarea className="input min-h-[80px]" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="What defines a valid higher-high in market structure?" />
          </div>
          <p className="mono muted text-[11px]">Answer options (mark one correct)</p>
          {newOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <input type="radio" name="correct-option" checked={opt.correct} onChange={() => setNewOptions(newOptions.map((o, j) => ({ ...o, correct: j === i })))} className="accent-yellow" />
              <input className="input flex-1" value={opt.text} onChange={(e) => setNewOptions(newOptions.map((o, j) => j === i ? { ...o, text: e.target.value } : o))} placeholder={`Option ${i + 1}`} />
            </div>
          ))}
          <Btn size="sm" onClick={addQuestion} disabled={savingQuestion || !newQuestion.trim()}>
            {savingQuestion ? 'Saving…' : 'Save question'}
          </Btn>
        </Panel>
      )}

      {moduleLoading && !moduleData ? <LoadingState /> : (
        <>
          {questions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  type="button"
                  className={`mono rounded border px-3 py-1.5 text-xs ${selectedQuestionIndex === i ? 'border-yellow text-yellow' : 'border-[var(--border-soft)]'}`}
                  onClick={() => { setSelectedQuestionIndex(i); setShowAddForm(false) }}
                >
                  Q{i + 1}
                </button>
              ))}
              <button type="button" className="mono text-xs text-yellow hover:underline" onClick={() => setShowAddForm(true)}>+ Add Question</button>
            </div>
          )}
          <div className="mt-4 space-y-3">
            {questions.filter((_, i) => selectedQuestionIndex === i || questions.length === 1).map((q, i) => {
              const qi = questions.length === 1 ? 0 : selectedQuestionIndex
              const question = questions[qi]
              if (!question) return null
              return (
            <Panel key={question.id} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <p className="mono muted text-xs">Question {qi + 1} of {questions.length}</p>
                <div className="flex gap-3">
                  {editingQuestionId !== question.id && (
                    <button type="button" className="mono text-xs text-yellow hover:underline" onClick={() => startEditQuestion(question.id)}>Edit</button>
                  )}
                  <button type="button" className="mono text-xs text-red-400 hover:underline" onClick={() => void deleteQuestion(question.id)}>Delete</button>
                </div>
              </div>
              {editingQuestionId === question.id ? (
                <div className="space-y-4">
                  <div className="input-group">
                    <label>Question text</label>
                    <textarea className="input min-h-[80px]" value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} />
                  </div>
                  <p className="mono muted text-[11px]">Answer options (mark one correct)</p>
                  {editOptions.map((opt, i) => (
                    <div key={opt.id ?? i} className="flex items-center gap-3">
                      <input type="radio" name={`edit-correct-${question.id}`} checked={opt.correct} onChange={() => setEditOptions(editOptions.map((o, j) => ({ ...o, correct: j === i })))} className="accent-yellow" />
                      <input className="input flex-1" value={opt.text} onChange={(e) => setEditOptions(editOptions.map((o, j) => j === i ? { ...o, text: e.target.value } : o))} placeholder={`Option ${i + 1}`} />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Btn size="sm" onClick={() => void saveEditedQuestion()} disabled={savingEdit || !editQuestionText.trim()}>
                      {savingEdit ? 'Saving…' : 'Save changes'}
                    </Btn>
                    <Btn size="sm" variant="ghost" onClick={() => setEditingQuestionId(null)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm font-medium">{question.question}</p>
                  <ul className="space-y-2">
                    {(optionsByQuestion[question.id] ?? []).sort((a, b) => a.sort_order - b.sort_order).map((o) => (
                      <li key={o.id} className={`rounded border px-3 py-2 text-sm ${o.is_correct ? 'border-green/40 bg-green/5 text-green' : 'border-[var(--border-soft)]'}`}>
                        {o.option_text}{o.is_correct ? ' ✓' : ''}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Panel>
              )
            })}
          </div>
          {!questions.length && <p className="muted text-sm">No questions yet — add one above. Students will see the quiz once at least one question exists.</p>}
        </>
      )}

      <Eyebrow className="mt-10 mb-4">Student submissions ({attempts.length})</Eyebrow>
      <p className="muted mb-4 text-sm">Multiple-choice answers are auto-marked. Proctored attempts include webcam recordings for anti-cheat review.</p>
      <div className="space-y-4">
        {attempts.map((attempt) => {
          const typed = attempt as QuizAttempt & { student: Profile | null; recordings: QuizProctoringRecording[] }
          const recording = typed.recordings?.[0]
          return (
          <Panel key={attempt.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{typed.student?.full_name ?? 'Student'}</p>
                <p className="mono muted text-xs">{typed.student?.email}</p>
                {attempt.proctoring_status && attempt.proctoring_status !== 'none' && (
                  <Pill className="mt-2">{attempt.proctoring_status === 'recorded' ? 'Proctoring recorded' : 'Proctoring consented'}</Pill>
                )}
              </div>
              <div className="text-right">
                <Pill tone={attempt.passed ? 'green' : attempt.timed_out ? 'red' : undefined}>{attempt.passed ? 'Passed' : attempt.timed_out ? 'Timed out' : 'Failed'}</Pill>
                <p className="mono mt-2 text-lg text-yellow">{attempt.score}%</p>
                <p className="mono muted text-[11px]">Attempt {attempt.attempt_number} · {formatDateTime(attempt.completed_at ?? attempt.started_at)}</p>
              </div>
            </div>
            {recording?.blob_url && (
              <div className="mt-4 border-t border-[var(--border-soft)] pt-4">
                <p className="mono muted mb-2 text-[11px]">PROCTORING RECORDING · {recording.duration_seconds ? `${recording.duration_seconds}s` : 'session'}</p>
                <video controls className="max-h-64 w-full rounded border border-[var(--border-soft)] bg-black" src={recording.blob_url}>
                  <track kind="captions" />
                </video>
              </div>
            )}
            {attempt.status === 'completed' || attempt.status === 'timed_out' ? (
              <div className="mt-4 space-y-3 border-t border-[var(--border-soft)] pt-4">
                {questions.map((q, qi) => {
                  const selectedId = (attempt.answers as Record<string, string>)?.[q.id]
                  const qOpts = optionsByQuestion[q.id] ?? []
                  const selected = qOpts.find((o) => o.id === selectedId)
                  const correct = qOpts.find((o) => o.is_correct)
                  const isRight = selected?.id === correct?.id
                  return (
                    <div key={q.id} className="text-sm">
                      <p className="mono muted mb-1 text-[11px]">Q{qi + 1}</p>
                      <p className="mb-1">{q.question}</p>
                      <p className={isRight ? 'text-green' : 'text-red'}>
                        Student: {selected?.option_text ?? '—'} {isRight ? '✓' : `✗ (correct: ${correct?.option_text ?? '—'})`}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="muted mt-3 text-sm">In progress…</p>
            )}
          </Panel>
        )})}
        {!attempts.length && <p className="muted text-sm">No student attempts for this module yet.</p>}
      </div>
    </div>
  )
}
