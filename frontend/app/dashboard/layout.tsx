import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-cream-200">
      <Sidebar userName="Dra. Ana Lima" userEmail="ana@consultorio.com" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
