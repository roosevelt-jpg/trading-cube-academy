'use client'

import { useRef, useState } from 'react'
import type { BlobCategory } from '@/lib/storage/blob'
import { Btn } from '@/components/ui/academy-ui'

type Props = {
  label?: string
  value: string
  onChange: (url: string) => void
  category: BlobCategory
  accept?: string
  placeholder?: string
}

export function BlobUploadField({
  label,
  value,
  onChange,
  category,
  accept = 'image/*',
  placeholder = 'https://… or upload',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      const res = await fetch('/api/media/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      onChange(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input min-w-0 flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <Btn
          type="button"
          size="sm"
          variant="ghost"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </Btn>
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      {value && (
        <img src={value} alt="" className="mt-2 h-24 max-w-xs rounded border border-[var(--border-soft)] object-cover" />
      )}
    </div>
  )
}
