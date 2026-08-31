import { put } from '@vercel/blob'
import type { BlobCategory } from '@/lib/storage/blob'
import { buildBlobPathname, isBlobConfigured, blobAccessForCategory } from '@/lib/storage/blob'

export async function uploadToBlob(
  category: BlobCategory,
  userId: string,
  file: File | Blob,
  fileName: string,
  contentType?: string,
) {
  if (!isBlobConfigured()) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not configured')
  }

  const pathname = buildBlobPathname(category, userId, fileName)
  const access = blobAccessForCategory(category)

  return put(pathname, file, {
    access,
    contentType: contentType ?? (file instanceof File ? file.type : undefined),
  })
}
