import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { Breadcrumbs } from './Breadcrumbs'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function RootLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(true)}
        onLogout={onLogout}
        userName={user?.name || user?.email}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64">
        <div className="px-4 py-6">
          <Breadcrumbs />
          <div className="mt-4">{children}</div>
        </div>
      </main>
    </div>
  )
}

