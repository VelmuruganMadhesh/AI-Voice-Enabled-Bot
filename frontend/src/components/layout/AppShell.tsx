import { useState, type ReactNode } from 'react'
import {
  Bell,
  User,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeft,
  Mic,
  Settings,
  WalletCards,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/ToastProvider'
import { Breadcrumbs } from './Breadcrumbs'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/account', label: 'Accounts', icon: Landmark },
  { to: '/transactions', label: 'Transactions', icon: WalletCards },
  { to: '/voice', label: 'Voice Assist', icon: Mic },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell({
  children,
  onLogout,
}: {
  children: ReactNode
  onLogout: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user } = useAuth()
  const { pushToast } = useToast()

  const userName = user?.name || user?.email || 'User'
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = () => {
    onLogout()
    pushToast({
      tone: 'info',
      title: 'Signed out',
      description: 'Your session has ended.',
    })
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed left-0 top-0 z-50 h-full border-r border-blue-300 bg-gradient-to-b from-blue-500 to-blue-900 text-white transition-all duration-200',
          sidebarCollapsed ? 'w-20' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-blue-400 px-4">
          {!sidebarCollapsed ? (
            <div>
              <div className="text-sm font-semibold">Banking Portal</div>
              <div className="text-xs text-blue-200">Digital operations</div>
            </div>
          ) : (
            <div className="mx-auto text-sm font-semibold">BP</div>
          )}

          <button
            className="lg:hidden text-blue-200 hover:bg-blue-400 p-2 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Menu */}
        <nav className="space-y-1 p-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    sidebarCollapsed ? 'justify-center px-0' : '',
                    isActive
                      ? 'bg-white text-blue-500 shadow'
                      : 'text-blue-100 hover:bg-blue-400 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="mt-auto border-t border-blue-400 p-3">
          <button
            onClick={handleLogout}
            className={[
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-blue-400 hover:text-white',
              sidebarCollapsed ? 'justify-center px-0' : '',
            ].join(' ')}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-blue-100">
        <div
          className={[
            'mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 transition-all duration-200 sm:px-6 lg:px-8',
            sidebarCollapsed ? 'lg:pl-28' : 'lg:pl-72',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <button
              className="hidden lg:flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-500"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              <PanelLeft className="h-5 w-5" />
            </button>

            <div>
              <div className="text-sm font-semibold text-blue-900">
                Banking Support Dashboard
              </div>
              <div className="text-xs text-blue-500">
                Professional workspace
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="h-10 w-10 flex items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-500 hover:bg-blue-50">
              <Bell className="h-5 w-5" />
            </button>

            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-blue-900">
                {userName}
              </div>
              <div className="text-xs text-blue-500">Retail Banking</div>
            </div>

            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-400 text-white font-semibold">
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main
        className={[
          'mx-auto max-w-[1440px] px-4 py-6 transition-all duration-200 sm:px-6 lg:px-8 bg-blue-50',
          sidebarCollapsed ? 'lg:pl-28' : 'lg:pl-72',
        ].join(' ')}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Breadcrumbs />
          <div className="mt-6">{children}</div>
        </motion.div>
      </main>
    </div>
  )
}