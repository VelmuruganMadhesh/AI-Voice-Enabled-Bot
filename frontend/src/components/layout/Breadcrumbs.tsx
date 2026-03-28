import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const labelByPath: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/voice': 'Voice Assistant',
  '/transactions': 'Transactions',
  '/account': 'Account Details',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

export function Breadcrumbs() {
  const location = useLocation()
  const label = labelByPath[location.pathname] || location.pathname.replace(/^\//, '')

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Link to="/dashboard" className="inline-flex items-center gap-2 hover:text-gray-900">
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      <ChevronRight className="h-4 w-4 text-gray-400" />
      <span className="font-medium text-gray-900">{label}</span>
    </div>
  )
}
