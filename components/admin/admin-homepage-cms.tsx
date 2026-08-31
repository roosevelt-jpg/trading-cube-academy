'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { DEFAULT_HOMEPAGE_SECTIONS, DEFAULT_NAVIGATION, defaultMarketingBundle } from '@/lib/defaults/cms-defaults'
import { Btn, Eyebrow, LoadingState, Panel } from '@/components/ui/academy-ui'
import { BlobUploadField } from '@/components/admin/blob-upload-field'
import type { BlobCategory } from '@/lib/storage/blob'
import type {
  FaqItem,
  MarketingPillar,
  MarketingStat,
  MarketingStep,
  SiteSettings,
  Testimonial,
  YoutubeVideo,
} from '@/lib/types/database'

type Tab = 'hero' | 'stats' | 'pillars' | 'steps' | 'testimonials' | 'faq' | 'videos'

export function AdminHomepageCmsView() {
  const [tab, setTab] = useState<Tab>('hero')
  const [homepageDraft, setHomepageDraft] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  const settingsFetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const { data } = await client.from('site_settings').select('key,value')
    return Object.fromEntries((data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value])) as SiteSettings
  }, [])

  const marketingFetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const defaults = defaultMarketingBundle()
    const [stats, pillars, steps, testimonials, faqs, videos] = await Promise.all([
      client.from('marketing_stats').select('*').order('sort_order'),
      client.from('marketing_pillars').select('*').order('sort_order'),
      client.from('marketing_steps').select('*').order('sort_order'),
      client.from('testimonials').select('*').order('sort_order'),
      client.from('faq_items').select('*').order('sort_order'),
      client.from('youtube_videos').select('*').eq('visibility', 'marketing').order('sort_order'),
    ])
    return {
      stats: (stats.data?.length ? stats.data : defaults.stats) as MarketingStat[],
      pillars: (pillars.data?.length ? pillars.data : defaults.pillars) as MarketingPillar[],
      steps: (steps.data?.length ? steps.data : defaults.steps) as MarketingStep[],
      testimonials: (testimonials.data?.length ? testimonials.data : defaults.testimonials) as Testimonial[],
      faqs: (faqs.data?.length ? faqs.data : defaults.faqs) as FaqItem[],
      videos: (videos.data?.length ? videos.data : defaults.videos) as YoutubeVideo[],
    }
  }, [])

  const { data: rawSettings, loading: settingsLoading, reload: reloadSettings } = useRealtimeQuery('site_settings', settingsFetcher, [])
  const { data: marketing, loading: marketingLoading, reload: reloadMarketing } = useRealtimeQuery(
    'marketing_stats',
    marketingFetcher,
    [],
  )

  const hp = { ...(rawSettings?.homepage ?? {}), ...(homepageDraft as SiteSettings['homepage']) }
  const sections = { ...DEFAULT_HOMEPAGE_SECTIONS, ...hp.sections }
  const navigation = hp.navigation?.length ? hp.navigation : DEFAULT_NAVIGATION

  const saveHomepage = async () => {
    setSaving(true)
    try {
      const client = createClient()
      const value = {
        ...rawSettings?.homepage,
        ...homepageDraft,
        sections: { ...sections, ...(homepageDraft.sections as object) },
      }
      await client.from('site_settings').upsert({ key: 'homepage', value })
      setHomepageDraft({})
      reloadSettings()
    } finally {
      setSaving(false)
    }
  }

  const updateRow = async (table: string, id: string, patch: Record<string, unknown>) => {
    const client = createClient()
    if (id.startsWith('stat-') || id.startsWith('p') || id.startsWith('s') || id.startsWith('t') || id.startsWith('f') || id.startsWith('v')) {
      const { id: _omit, ...insertData } = { id, ...patch } as Record<string, unknown>
      await client.from(table).upsert({ ...insertData, id }, { onConflict: 'id' })
    } else {
      await client.from(table).update(patch).eq('id', id)
    }
    reloadMarketing()
  }

  const deleteRow = async (table: string, id: string) => {
    if (!confirm('Delete this item?')) return
    await createClient().from(table).delete().eq('id', id)
    reloadMarketing()
  }

  const addRow = async (table: string, row: Record<string, unknown>) => {
    await createClient().from(table).insert(row)
    reloadMarketing()
  }

  if (settingsLoading || marketingLoading) return <LoadingState />

  const tabs: { id: Tab; label: string }[] = [
    { id: 'hero', label: 'Hero & sections' },
    { id: 'stats', label: 'Stats' },
    { id: 'pillars', label: 'Pillars' },
    { id: 'steps', label: 'How it works' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'faq', label: 'FAQ' },
    { id: 'videos', label: 'Video marquee' },
  ]

  return (
    <div className="content-pad max-w-4xl">
      <Link href="/admin" className="mono muted text-xs hover:text-yellow">← Dashboard</Link>
      <Eyebrow className="mt-4">Marketing CMS</Eyebrow>
      <h1 className="h1 mt-2 text-3xl">Homepage content</h1>
      <p className="muted mt-2 text-sm">Edit every section of the marketing homepage. Changes sync live to the public site.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mono rounded border px-3 py-1.5 text-xs ${tab === t.id ? 'border-yellow text-yellow' : 'border-[var(--border-soft)] text-[var(--muted)]'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && (
        <div className="mt-6 space-y-6">
          <Panel className="space-y-4 p-6">
            <Eyebrow>Hero copy</Eyebrow>
            <Field label="Eyebrow" value={hp.eyebrow ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, eyebrow: v }))} />
            <Field label="Headline" value={hp.headline ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, headline: v }))} />
            <Field label="Description" value={hp.description ?? ''} multiline onChange={(v) => setHomepageDraft((d) => ({ ...d, description: v }))} />
            <Field label="Trust line" value={hp.trustLine ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, trustLine: v }))} />
            <BlobUploadField label="Hero image" value={hp.heroImageUrl ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, heroImageUrl: v }))} category="marketing" />
            <BlobUploadField label="CTA band image" value={hp.ctaImageUrl ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, ctaImageUrl: v }))} category="marketing" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Hero preview label" value={hp.heroPreview?.label ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, heroPreview: { ...hp.heroPreview, label: v } }))} />
              <Field label="Hero preview title" value={hp.heroPreview?.title ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, heroPreview: { ...hp.heroPreview, title: v } }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Request access button" value={hp.ctas?.requestAccess ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, ctas: { ...hp.ctas, requestAccess: v } }))} />
              <Field label="Member login button" value={hp.ctas?.memberLogin ?? ''} onChange={(v) => setHomepageDraft((d) => ({ ...d, ctas: { ...hp.ctas, memberLogin: v } }))} />
            </div>
          </Panel>

          <Panel className="space-y-4 p-6">
            <Eyebrow>Navigation links</Eyebrow>
            {navigation.map((link, i) => (
              <div key={i} className="grid gap-3 md:grid-cols-2">
                <Field label={`Link ${i + 1} label`} value={link.label} onChange={(v) => {
                  const nav = [...navigation]
                  nav[i] = { ...nav[i], label: v }
                  setHomepageDraft((d) => ({ ...d, navigation: nav }))
                }} />
                <Field label={`Link ${i + 1} URL`} value={link.href} onChange={(v) => {
                  const nav = [...navigation]
                  nav[i] = { ...nav[i], href: v }
                  setHomepageDraft((d) => ({ ...d, navigation: nav }))
                }} />
              </div>
            ))}
          </Panel>

          {(['pillars', 'curriculum', 'videos', 'howItWorks', 'results', 'faq', 'cta'] as const).map((key) => (
            <Panel key={key} className="space-y-4 p-6">
              <Eyebrow>{key} section heading</Eyebrow>
              <Field label="Eyebrow" value={sections[key]?.eyebrow ?? ''} onChange={(v) => setHomepageDraft((d) => ({
                ...d,
                sections: { ...sections, [key]: { ...sections[key], eyebrow: v } },
              }))} />
              <Field label="Headline" value={sections[key]?.headline ?? ''} onChange={(v) => setHomepageDraft((d) => ({
                ...d,
                sections: { ...sections, [key]: { ...sections[key], headline: v } },
              }))} />
              {'description' in (sections[key] ?? {}) && (
                <Field label="Description" value={sections[key]?.description ?? ''} multiline onChange={(v) => setHomepageDraft((d) => ({
                  ...d,
                  sections: { ...sections, [key]: { ...sections[key], description: v } },
                }))} />
              )}
              {key === 'cta' && (
                <Field label="Button label" value={sections.cta?.buttonLabel ?? ''} onChange={(v) => setHomepageDraft((d) => ({
                  ...d,
                  sections: { ...sections, cta: { ...sections.cta, buttonLabel: v } },
                }))} />
              )}
            </Panel>
          ))}

          <Btn onClick={saveHomepage} disabled={saving}>{saving ? 'Saving…' : 'Save homepage settings'}</Btn>
        </div>
      )}

      {tab === 'stats' && marketing && (
        <TableEditor
          title="Stat strip"
          rows={marketing.stats}
          columns={[
            { key: 'value', label: 'Value' },
            { key: 'label', label: 'Label' },
            { key: 'accent', label: 'Accent (yellow/green)' },
          ]}
          onSave={(id, patch) => updateRow('marketing_stats', id, patch)}
          onDelete={(id) => deleteRow('marketing_stats', id)}
          onAdd={() => addRow('marketing_stats', { label: 'New stat', value: '0', accent: null, sort_order: marketing.stats.length })}
        />
      )}

      {tab === 'pillars' && marketing && (
        <TableEditor
          title="Why Trading Cube pillars"
          rows={marketing.pillars}
          columns={[
            { key: 'number_label', label: 'Number label' },
            { key: 'title', label: 'Title' },
            { key: 'body', label: 'Body', multiline: true },
          ]}
          onSave={(id, patch) => updateRow('marketing_pillars', id, patch)}
          onDelete={(id) => deleteRow('marketing_pillars', id)}
          onAdd={() => addRow('marketing_pillars', { number_label: '04', title: 'New pillar', body: 'Description…', sort_order: marketing.pillars.length })}
        />
      )}

      {tab === 'steps' && marketing && (
        <TableEditor
          title="How it works steps"
          rows={marketing.steps}
          columns={[
            { key: 'number_label', label: 'Step number' },
            { key: 'title', label: 'Title' },
            { key: 'body', label: 'Body', multiline: true },
          ]}
          onSave={(id, patch) => updateRow('marketing_steps', id, patch)}
          onDelete={(id) => deleteRow('marketing_steps', id)}
          onAdd={() => addRow('marketing_steps', { number_label: '05', title: 'New step', body: 'Description…', sort_order: marketing.steps.length })}
        />
      )}

      {tab === 'testimonials' && marketing && (
        <TableEditor
          title="Testimonials"
          rows={marketing.testimonials}
          columns={[
            { key: 'quote', label: 'Quote', multiline: true },
            { key: 'author_name', label: 'Author name' },
            { key: 'author_meta', label: 'Author meta' },
            { key: 'image_url', label: 'Avatar image', uploadCategory: 'testimonials' as BlobCategory },
          ]}
          onSave={(id, patch) => updateRow('testimonials', id, patch)}
          onDelete={(id) => deleteRow('testimonials', id)}
          onAdd={() => addRow('testimonials', { quote: 'New testimonial…', author_name: 'Name', author_meta: 'Meta', sort_order: marketing.testimonials.length })}
        />
      )}

      {tab === 'faq' && marketing && (
        <TableEditor
          title="FAQ items"
          rows={marketing.faqs}
          columns={[
            { key: 'question', label: 'Question' },
            { key: 'answer', label: 'Answer', multiline: true },
          ]}
          onSave={(id, patch) => updateRow('faq_items', id, patch)}
          onDelete={(id) => deleteRow('faq_items', id)}
          onAdd={() => addRow('faq_items', { question: 'New question?', answer: 'Answer…', sort_order: marketing.faqs.length })}
        />
      )}

      {tab === 'videos' && marketing && (
        <TableEditor
          title="Homepage video marquee"
          rows={marketing.videos}
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'video_id', label: 'YouTube video ID' },
            { key: 'course_name', label: 'Course label' },
            { key: 'duration_label', label: 'Duration label' },
          ]}
          onSave={(id, patch) => updateRow('youtube_videos', id, patch)}
          onDelete={(id) => deleteRow('youtube_videos', id)}
          onAdd={() => addRow('youtube_videos', { title: 'New preview', video_id: '', course_name: 'Course', duration_label: '0:00', visibility: 'marketing', published: true, sort_order: marketing.videos.length })}
        />
      )}
    </div>
  )
}

function Field({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="input-group">
      <label>{label}</label>
      {multiline ? (
        <textarea className="input min-h-[80px]" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

function TableEditor({
  title,
  rows,
  columns,
  onSave,
  onDelete,
  onAdd,
}: {
  title: string
  rows: Record<string, unknown>[]
  columns: { key: string; label: string; multiline?: boolean; uploadCategory?: BlobCategory }[]
  onSave: (id: string, patch: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onAdd: () => void
}) {
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({})

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>{title}</Eyebrow>
        <Btn size="sm" variant="ghost" onClick={onAdd}>+ Add item</Btn>
      </div>
      {rows.map((row) => {
        const id = String(row.id)
        const draft = drafts[id] ?? {}
        const val = (key: string) => draft[key] ?? String(row[key] ?? '')
        return (
          <Panel key={id} className="space-y-3 p-5">
            {columns.map((col) => (
              <div key={col.key} className="input-group">
                {col.uploadCategory ? (
                  <BlobUploadField
                    label={col.label}
                    value={val(col.key)}
                    onChange={(url) => {
                      void onSave(id, { [col.key]: url })
                    }}
                    category={col.uploadCategory}
                  />
                ) : col.multiline ? (
                  <>
                    <label>{col.label}</label>
                    <textarea
                      className="input min-h-[72px]"
                      value={val(col.key)}
                      onChange={(e) => setDrafts((d) => ({ ...d, [id]: { ...d[id], [col.key]: e.target.value } }))}
                      onBlur={() => {
                        if (draft[col.key] !== undefined) {
                          void onSave(id, { [col.key]: draft[col.key] })
                          setDrafts((d) => {
                            const next = { ...d }
                            delete next[id]
                            return next
                          })
                        }
                      }}
                    />
                  </>
                ) : (
                  <>
                    <label>{col.label}</label>
                    <input
                      className="input"
                      value={val(col.key)}
                      onChange={(e) => setDrafts((d) => ({ ...d, [id]: { ...d[id], [col.key]: e.target.value } }))}
                      onBlur={() => {
                        if (draft[col.key] !== undefined) {
                          void onSave(id, { [col.key]: draft[col.key] })
                          setDrafts((d) => {
                            const next = { ...d }
                            delete next[id]
                            return next
                          })
                        }
                      }}
                    />
                  </>
                )}
              </div>
            ))}
            <button type="button" className="mono text-xs text-red-400 hover:underline" onClick={() => onDelete(id)}>Delete</button>
          </Panel>
        )
      })}
    </div>
  )
}
