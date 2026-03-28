import { useEffect, useState } from 'react'

import { getAccountDetails, type AccountDetails } from '../api/accountApi'
import { Skeleton } from '../components/ui/Skeleton'
import { SurfaceCard } from '../components/ui/SurfaceCard'
import { useAuth } from '../contexts/AuthContext'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export function AccountDetailsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<AccountDetails | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const env = await getAccountDetails().catch(() => null)
      setDetails(env?.data || null)
      setLoading(false)
    }

    void load()
  }, [])

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <h1 className="text-2xl font-semibold text-gray-900">Account Details</h1>
        <p className="mt-1 text-sm text-gray-600">Customer ID: {user?._id || 'Unavailable'}</p>
      </SurfaceCard>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : details ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SurfaceCard>
            <p className="text-sm text-gray-600">Account Number</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{details.account_number}</p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-sm text-gray-600">Balance</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(details.balance, details.currency)}</p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-sm text-gray-600">Currency</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">{details.currency}</p>
          </SurfaceCard>
        </div>
      ) : (
        <SurfaceCard>
          <p className="text-sm text-gray-600">No account details available.</p>
        </SurfaceCard>
      )}
    </div>
  )
}
