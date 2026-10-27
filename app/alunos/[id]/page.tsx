import StudentDetail from '@/components/student-detail'
export default function StudentPage({ params }: { params: Promise<{ id: string }> }) { return <StudentDetail params={params} /> }
