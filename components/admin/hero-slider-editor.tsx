'use client'

import { useRef, useState } from 'react'
import { BlobUploadField } from '@/components/admin/blob-upload-field'
import { Btn, Eyebrow, Panel } from '@/components/ui/academy-ui'
import type { HeroSlide, HeroSliderSettings } from '@/lib/types/database'
import { DEFAULT_HERO_SLIDER } from '@/lib/utils/hero-slider'

type Props = {
  slider: HeroSliderSettings
  heroPreview?: { label?: string; title?: string }
  onChange: (slider: HeroSliderSettings) => void
}

export function HeroSliderEditor({ slider, heroPreview, onChange }: Props) {
  const merged = { ...DEFAULT_HERO_SLIDER, ...slider }
  const slides = merged.slides ?? []
  const multiInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (patch: Partial<HeroSliderSettings>) => onChange({ ...merged, ...patch })

  const patchSlide = (id: string, patch: Partial<HeroSlide>) => {
    patch({
      slides: slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })
  }

  const removeSlide = (id: string) => {
    patch({ slides: slides.filter((s) => s.id !== id) })
  }

  const moveSlide = (id: string, dir: -1 | 1) => {
    const i = slides.findIndex((s) => s.id === id)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= slides.length) return
    const next = [...slides]
    ;[next[i], next[j]] = [next[j], next[i]]
    patch({ slides: next })
  }

  const addSlide = (imageUrl: string) => {
    const slide: HeroSlide = {
      id: crypto.randomUUID(),
      imageUrl,
      alt: 'Hero slide',
      previewLabel: heroPreview?.label,
      previewTitle: heroPreview?.title,
    }
    patch({ slides: [...slides, slide] })
  }

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const form = new FormData()
        form.append('file', file)
        form.append('category', 'marketing')
        const res = await fetch('/api/media/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        addSlide(data.url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (multiInputRef.current) multiInputRef.current.value = ''
    }
  }

  return (
    <Panel className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Hero image slider</Eyebrow>
          <p className="muted mt-1 text-xs">Upload multiple images — the homepage hero rotates when there are 2 or more slides.</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={merged.enabled !== false}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          Slider enabled
        </label>
      </div>

      <input
        ref={multiInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files
          if (files?.length) void uploadFiles(files)
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Btn type="button" size="sm" disabled={uploading} onClick={() => multiInputRef.current?.click()}>
          {uploading ? 'Uploading…' : '+ Upload multiple images'}
        </Btn>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}

      {slides.length === 0 && (
        <p className="muted text-sm">No slides yet — uses the single hero image fallback below until you add slides.</p>
      )}

      {slides.map((slide, i) => (
        <Panel key={slide.id} className="space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="mono text-xs text-yellow">Slide {i + 1}</p>
            <div className="flex gap-2">
              <Btn type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => moveSlide(slide.id, -1)}>↑</Btn>
              <Btn type="button" size="sm" variant="ghost" disabled={i === slides.length - 1} onClick={() => moveSlide(slide.id, 1)}>↓</Btn>
              <Btn type="button" size="sm" variant="ghost" onClick={() => removeSlide(slide.id)}>Remove</Btn>
            </div>
          </div>
          <BlobUploadField
            label="Image"
            value={slide.imageUrl}
            onChange={(url) => patchSlide(slide.id, { imageUrl: url })}
            category="marketing"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="input-group">
              <label>Alt text</label>
              <input
                className="input"
                value={slide.alt ?? ''}
                onChange={(e) => patchSlide(slide.id, { alt: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Preview label (optional override)</label>
              <input
                className="input"
                value={slide.previewLabel ?? ''}
                onChange={(e) => patchSlide(slide.id, { previewLabel: e.target.value })}
                placeholder={heroPreview?.label ?? 'Live curriculum preview'}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Preview title (optional override)</label>
            <input
              className="input"
              value={slide.previewTitle ?? ''}
              onChange={(e) => patchSlide(slide.id, { previewTitle: e.target.value })}
              placeholder={heroPreview?.title ?? 'Price Action Mastery · Module 3'}
            />
          </div>
        </Panel>
      ))}

      <div className="grid gap-4 border-t border-[var(--border-soft)] pt-4 md:grid-cols-2">
        <div className="input-group">
          <label>Slide interval (seconds)</label>
          <input
            className="input"
            type="number"
            min={2}
            max={60}
            value={merged.intervalSeconds ?? 6}
            onChange={(e) => patch({ intervalSeconds: Number(e.target.value) || 6 })}
          />
        </div>
        <div className="input-group">
          <label>Transition duration (ms)</label>
          <input
            className="input"
            type="number"
            min={200}
            max={3000}
            step={100}
            value={merged.transitionDurationMs ?? 700}
            onChange={(e) => patch({ transitionDurationMs: Number(e.target.value) || 700 })}
          />
        </div>
        <div className="input-group">
          <label>Transition style</label>
          <select
            className="input"
            value={merged.transition ?? 'fade'}
            onChange={(e) => patch({ transition: e.target.value as HeroSliderSettings['transition'] })}
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={merged.autoplay !== false} onChange={(e) => patch({ autoplay: e.target.checked })} />
          Autoplay
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={merged.pauseOnHover !== false} onChange={(e) => patch({ pauseOnHover: e.target.checked })} />
          Pause on hover
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={merged.showDots !== false} onChange={(e) => patch({ showDots: e.target.checked })} />
          Show dots
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={merged.showArrows !== false} onChange={(e) => patch({ showArrows: e.target.checked })} />
          Show arrows
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={merged.loop !== false} onChange={(e) => patch({ loop: e.target.checked })} />
          Loop
        </label>
      </div>
    </Panel>
  )
}
