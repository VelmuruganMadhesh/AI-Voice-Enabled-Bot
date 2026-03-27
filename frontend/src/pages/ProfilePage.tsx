import { useAuth } from '../contexts/AuthContext'

export function ProfilePage() {
  const { user } = useAuth()
  return (
    <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
      <h2 className="text-xl font-semibold">Profile</h2>
      <div className="mt-4 text-sm text-zinc-700 dark:text-zinc-200 space-y-2">
        <div>
          <span className="font-medium">Name:</span> {user?.name || '-'}
        </div>
        <div>
          <span className="font-medium">Email:</span> {user?.email || '-'}
        </div>
        <div>
          <span className="font-medium">Phone:</span> {user?.phone || '-'}
        </div>
        <div>
          <span className="font-medium">Language:</span> {user?.language || '-'}
        </div>
      </div>
    </div>
  )
}

