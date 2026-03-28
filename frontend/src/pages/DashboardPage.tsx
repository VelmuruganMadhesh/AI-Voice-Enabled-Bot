import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowRight, CreditCard, Mic, Receipt, Send, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'

import { getAccountDetails, type AccountDetails } from '../api/accountApi'
import { listTransactions, type TransactionItem } from '../api/transactionsApi'
import { CommonButton } from '../components/ui/CommonButton'
import { CommonTable } from '../components/ui/CommonTable'
import { Skeleton } from '../components/ui/Skeleton'
import { SurfaceCard } from '../components/ui/SurfaceCard'
import { useAuth } from '../contexts/AuthContext'

function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<AccountDetails | null>(null)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [accountEnvelope, transactionEnvelope] = await Promise.all([
        getAccountDetails().catch(() => null),
        listTransactions(5).catch(() => null),
      ])
      setAccount(accountEnvelope?.data || null)
      setTransactions(transactionEnvelope?.data.items || [])
      setLoading(false)
    }

    void load()
  }, [])

  const summary = useMemo(
    () => [
      {
        label: 'Available Balance',
        value: account ? formatCurrency(account.balance, account.currency) : 'Unavailable',
        icon: CreditCard,
      },
      {
        label: 'Recent Requests',
        value: String(transactions.length),
        icon: Activity,
      },
      {
        label: 'Digital Payments',
        value: `${transactions.filter((item) => item.type === 'debit').length}`,
        icon: Receipt,
      },
    ],
    [account, transactions],
  )

  const quickActions = [
    { label: 'Send Money', icon: Send, to: '/transactions' },
    { label: 'Request Money', icon: ArrowRight, to: '/voice' },
    { label: 'Pay Bills', icon: Mic, to: '/voice' },
  ]

  const columns = [
    { key: 'type', header: 'Type' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: TransactionItem) => formatCurrency(Number(row.amount || 0)),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row: TransactionItem) => row.description || 'No description',
    },
    {
      key: 'date',
      header: 'Date',
      render: (row: TransactionItem) => new Date(row.date).toLocaleDateString('en-IN'),
    },
  ]

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name || user?.email || 'User'}</h1>
            <p className="mt-1 text-sm text-gray-600">Here is a quick view of your balances, payment activity, and recent banking operations.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/voice">
              <CommonButton>Open Voice Assistant</CommonButton>
            </Link>
            <Link to="/transactions">
              <CommonButton variant="outline" leftIcon={<ArrowRight className="h-4 w-4" />}>
                View Transactions
              </CommonButton>
            </Link>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32" />)
          : summary.map((item) => {
              const Icon = item.icon
              return (
                <SurfaceCard key={item.label} interactive>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{item.value}</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </SurfaceCard>
              )
            })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="mt-1 text-sm text-gray-600">Latest banking requests and transactions.</p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <WalletCards className="h-4 w-4" />
              {transactions.length} items
            </div>
          </div>
          <div className="mt-4">
            <CommonTable columns={columns as any} rows={transactions as any} />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-gray-600">Common actions for day-to-day banking tasks.</p>
          <div className="mt-4 space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{action.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </Link>
              )
            })}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
