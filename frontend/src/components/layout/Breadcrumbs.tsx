import { useLocation } from 'react-router-dom'

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
  const path = location.pathname
  const label = labelByPath[path] || path.replace(/^\//, '').replace(/-/g, ' ')

  return (
    <div className="text-sm text-zinc-600 dark:text-zinc-300">
      <span className="font-medium text-zinc-900 dark:text-zinc-100">Home</span>
      <span className="mx-2 text-zinc-400">/</span>
      <span>{label}</span>
    </div>
  )
}

