import DashboardApp from '@/components/dashboard-app'

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  await params
  return <DashboardApp />
}
