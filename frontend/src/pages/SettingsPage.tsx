import { SurfaceCard } from '../components/ui/SurfaceCard'

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <SurfaceCard>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage workspace preferences and default support configuration.</p>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard>
          <h2 className="text-base font-semibold text-gray-900">Security</h2>
          <p className="mt-2 text-sm text-gray-600">Configure session handling and account protection preferences.</p>
        </SurfaceCard>
        <SurfaceCard>
          <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
          <p className="mt-2 text-sm text-gray-600">Control support alerts and operational reminders.</p>
        </SurfaceCard>
        <SurfaceCard>
          <h2 className="text-base font-semibold text-gray-900">Language</h2>
          <p className="mt-2 text-sm text-gray-600">Set the default language for voice assistant interactions.</p>
        </SurfaceCard>
      </div>
    </div>
  )
}
