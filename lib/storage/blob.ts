export type BlobCategory =
  | 'marketing'
  | 'branding'
  | 'courses'
  | 'testimonials'
  | 'pages'
  | 'materials'
  | 'proctoring'

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
}

export function blobAccessForCategory(category: BlobCategory): 'public' | 'private' {
  return category === 'materials' ? 'private' : 'public'
}

export function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120)
}

export function buildBlobPathname(category: BlobCategory, userId: string, fileName: string) {
  const safe = safeFileName(fileName)
  const prefix = category === 'materials' ? 'course-materials' : category === 'proctoring' ? 'quiz-proctoring' : category
  return `${prefix}/${userId}/${crypto.randomUUID()}-${safe}`
}

export function isVercelBlobUrl(url?: string | null) {
  return Boolean(url?.includes('.blob.vercel-storage.com'))
}
