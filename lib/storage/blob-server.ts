import { put } from '@vercel/blob'
import type { BlobCategory } from '@/lib/storage/blob'
import { buildBlobPathname, blobAccessForCategory } from '@/lib/storage/blob'
import { getBlobReadWriteToken } from '@/lib/integrations/blob'

export async function uploadToBlob(
  category: BlobCategory,
  userId: string,
  file: File | Blob,
  fileName: string,
  contentType?: string,
) {
  const token = await getBlobReadWriteToken()
  if (!token) {
    throw new Error('Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN or configure Admin → Integrations → Vercel Blob.')
  }

  const pathname = buildBlobPathname(category, userId, fileName)
  const access = blobAccessForCategory(category)

  return put(pathname, file, {
    access,
    contentType: contentType ?? (file instanceof File ? file.type : undefined),
    token,
  })
}
