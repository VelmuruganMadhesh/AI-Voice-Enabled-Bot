import { NavLink } from 'react-router-dom'

type NavItem = { to: string; label: string }

const items: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/voice', label: 'Voice Assistant' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/account', label: 'Account Details' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={[
          'fixed left-0 top-0 z-40 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800',
          'transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="font-semibold">Voice Banking Support</div>
          <div className="text-xs text-zinc-500">Multilingual assistant</div>
        </div>

        <nav className="p-2 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                ].join(' ')
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

