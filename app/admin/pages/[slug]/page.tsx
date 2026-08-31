import { AdminPageEditor } from '@/components/admin/admin-views'

export default async function AdminPageEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <AdminPageEditor slug={slug} />
}
