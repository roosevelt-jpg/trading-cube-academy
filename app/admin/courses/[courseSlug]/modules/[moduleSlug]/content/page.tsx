import { AdminContentEditor } from '@/components/admin/admin-views'

export default async function Page({ params }: { params: Promise<{ courseSlug: string; moduleSlug: string }> }) {
  const { courseSlug, moduleSlug } = await params
  return <AdminContentEditor courseSlug={courseSlug} moduleSlug={moduleSlug} />
}
