import DashboardSidebar from '@/components/DashboardSidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <DashboardSidebar />
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
