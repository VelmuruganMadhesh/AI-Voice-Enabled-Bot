export function Navbar({
  onToggleSidebar,
  onLogout,
  userName,
}: {
  onToggleSidebar: () => void
  onLogout: () => void
  userName?: string | null
}) {
  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="h-14 px-4 flex items-center justify-between">
        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
        >
          <span className="text-lg">☰</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-sm text-zinc-600 dark:text-zinc-300 hidden sm:block">
            Multilingual Voice Banking
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-sm font-medium">{userName || 'User'}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Customer Support</div>
          </div>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

