import { AdminStudentDetailView } from '@/components/admin/admin-views'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminStudentDetailView studentId={id} />
}
