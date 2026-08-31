import { AdminVideoManager } from '@/components/admin/admin-views'

export default async function Page({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params
  return <AdminVideoManager courseSlug={courseSlug} />
}
