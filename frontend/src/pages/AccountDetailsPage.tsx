import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getAccountDetails, type AccountDetails } from '../api/accountApi'

export function AccountDetailsPage() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [details, setDetails] = useState<AccountDetails | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const env = await getAccountDetails()
        setDetails(env.data)
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load account details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Account Details</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Customer ID: {user?._id}</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? <div className="text-sm text-zinc-600">Loading...</div> : null}

      {details ? (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">Account Number</div>
          <div className="text-lg font-semibold mt-1">{details.account_number}</div>

          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">Balance</div>
          <div className="text-2xl font-semibold mt-1">
            {details.balance.toFixed(2)} {details.currency}
          </div>
        </div>
      ) : null}
    </div>
  )
}

