import { CommonButton } from '../components/ui/CommonButton'
import { SurfaceCard } from '../components/ui/SurfaceCard'
import { useAuth } from '../contexts/AuthContext'

function getInitials(name?: string, email?: string) {
  const source = name || email || 'U'
  return source
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfilePage() {
  const { user } = useAuth()

  const rows = [
    { label: 'Name', value: user?.name || 'Not provided' },
    { label: 'Email', value: user?.email || 'Not provided' },
    { label: 'Phone', value: user?.phone || 'Not provided' },
    { label: 'Language', value: user?.language?.toUpperCase() || 'EN' },
    { label: 'Account Type', value: 'Savings Account' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <SurfaceCard>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-semibold text-blue-600">
            {getInitials(user?.name, user?.email)}
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">{user?.name || 'User'}</h1>
          <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
          <CommonButton className="mt-6 w-full" variant="outline">
            Edit Profile
          </CommonButton>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
        <div className="mt-4 divide-y divide-gray-200">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr]">
              <div className="text-sm font-medium text-gray-600">{row.label}</div>
              <div className="text-sm text-gray-900">{row.value}</div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
