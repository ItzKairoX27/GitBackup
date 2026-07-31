import { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#06080a] text-[#f0f6fc] selection:bg-orange-500/30 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent pointer-events-none"></div>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 p-8 relative z-10">
        {children}
      </main>
    </div>
  )
}
