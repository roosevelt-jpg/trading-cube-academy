'use client'

type ToolbarProps = {
  value: string
  onChange: (value: string) => void
}

export function ContentEditorToolbar({ value, onChange }: ToolbarProps) {
  const wrap = (prefix: string, suffix = prefix) => {
    const ta = document.getElementById('content-editor-body') as HTMLTextAreaElement | null
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || 'text'
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end)
    onChange(next)
  }

  const insertLine = (prefix: string) => {
    const ta = document.getElementById('content-editor-body') as HTMLTextAreaElement | null
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(next)
  }

  const buttons = [
    { label: 'B', action: () => wrap('**') },
    { label: 'I', action: () => wrap('*') },
    { label: 'H1', action: () => insertLine('# ') },
    { label: 'H2', action: () => insertLine('## ') },
    { label: '"', action: () => insertLine('> ') },
    { label: 'Callout', action: () => wrap('[callout]\n', '\n[/callout]') },
  ]

  return (
    <div className="content-toolbar mb-2 flex flex-wrap gap-1">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          className="mono rounded border border-[var(--border-soft)] px-2.5 py-1 text-[11px] hover:border-yellow hover:text-yellow"
          onClick={b.action}
        >
          {b.label}
        </button>
      ))}
    </div>
  )
}
