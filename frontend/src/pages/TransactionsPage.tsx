import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PencilLine, Plus, Search, Trash2 } from 'lucide-react'

import { getAccountDetails } from '../api/accountApi'
import { createTransaction, deleteTransaction, listTransactions, updateTransaction, type TransactionItem } from '../api/transactionsApi'
import { CommonButton } from '../components/ui/CommonButton'
import { CommonTable } from '../components/ui/CommonTable'
import { FormInput } from '../components/ui/FormInput'
import { Modal } from '../components/ui/Modal'
import { SurfaceCard } from '../components/ui/SurfaceCard'
import { useToast } from '../components/ui/ToastProvider'
import { useAuth } from '../contexts/AuthContext'

type TxDraft = {
  account_number: string
  type: 'credit' | 'debit'
  amount: string
  description: string
  date: string
}

function formatCurrency(value: number) {
  return `INR ${Number(value || 0).toFixed(2)}`
}

export function TransactionsPage() {
  const { loading: authLoading } = useAuth()
  const { pushToast } = useToast()

  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<TransactionItem[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all')
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [draft, setDraft] = useState<TxDraft>({
    account_number: '',
    type: 'credit',
    amount: '',
    description: '',
    date: '',
  })

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const env = await listTransactions(50)
      setItems(env.data.items)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load transactions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      const accountEnv = await getAccountDetails().catch(() => null)
      if (accountEnv?.data.account_number) {
        setAccountNumber(accountEnv.data.account_number)
        setDraft((current) => ({ ...current, account_number: accountEnv.data.account_number }))
      }
      await refresh()
    }

    void load()
  }, [])

  const onStartCreate = () => {
    setMode('create')
    setEditingId(null)
    setIsFormOpen(true)
    setDraft({
      account_number: accountNumber || '',
      type: 'credit',
      amount: '',
      description: '',
      date: '',
    })
  }

  const onEdit = (item: TransactionItem) => {
    setMode('edit')
    setEditingId(item._id)
    setIsFormOpen(true)
    setDraft({
      account_number: item.account_number,
      type: item.type === 'debit' ? 'debit' : 'credit',
      amount: String(item.amount ?? ''),
      description: String(item.description ?? ''),
      date: typeof item.date === 'string' ? item.date.slice(0, 10) : new Date(item.date).toISOString().slice(0, 10),
    })
  }

  const onDelete = async (txId: string) => {
    const ok = confirm('Delete this transaction?')
    if (!ok) return

    setLoading(true)
    setError(null)
    try {
      await deleteTransaction(txId)
      pushToast({ tone: 'success', title: 'Transaction deleted' })
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete transaction.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const amountNum = Number(draft.amount)
      if (!draft.account_number) throw new Error('Account number is required.')
      if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Amount must be a positive number.')

      const payload = {
        account_number: draft.account_number,
        type: draft.type,
        amount: amountNum,
        description: draft.description || undefined,
        date: draft.date ? new Date(draft.date).toISOString() : undefined,
      }

      if (mode === 'create') {
        await createTransaction(payload)
        pushToast({ tone: 'success', title: 'Transaction created' })
      } else {
        if (!editingId) throw new Error('Missing transaction id.')
        await updateTransaction(editingId, payload)
        pushToast({ tone: 'success', title: 'Transaction updated' })
      }

      await refresh()
      setIsFormOpen(false)
    } catch (e: any) {
      setError(e?.message || e?.response?.data?.message || 'Operation failed.')
    } finally {
      setLoading(false)
    }
  }

  const totals = useMemo(() => {
    const credits = items.filter((item) => item.type === 'credit').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const debits = items.filter((item) => item.type === 'debit').reduce((sum, item) => sum + Number(item.amount || 0), 0)
    return { credits, debits }
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = typeFilter === 'all' ? true : item.type === typeFilter
      const term = search.trim().toLowerCase()
      const matchesSearch = !term
        ? true
        : item.account_number.toLowerCase().includes(term) ||
          String(item.description || '').toLowerCase().includes(term)
      return matchesType && matchesSearch
    })
  }, [items, search, typeFilter])

  const columns = [
    { key: 'account_number', header: 'Account' },
    { key: 'type', header: 'Type' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: TransactionItem) => (
        <span className={row.type === 'credit' ? 'font-medium text-green-600' : 'font-medium text-red-600'}>
          {row.type === 'credit' ? '+' : '-'} {formatCurrency(Number(row.amount || 0))}
        </span>
      ),
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
    {
      key: '_id',
      header: 'Actions',
      render: (row: TransactionItem) => (
        <div className="flex gap-2">
          <CommonButton size="sm" variant="outline" onClick={() => onEdit(row)} disabled={loading || authLoading} leftIcon={<PencilLine className="h-4 w-4" />}>
            Edit
          </CommonButton>
          <CommonButton size="sm" variant="secondary" onClick={() => onDelete(row._id)} disabled={loading || authLoading} leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </CommonButton>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
            <p className="mt-1 text-sm text-gray-600">Create, update, and review customer transaction records.</p>
          </div>
          <CommonButton onClick={onStartCreate} leftIcon={<Plus className="h-4 w-4" />}>
            New Transaction
          </CommonButton>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard>
          <p className="text-sm text-gray-600">Linked Account</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{accountNumber || 'Manual entry'}</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-gray-600">Total Credits</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(totals.credits)}</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-gray-600">Total Debits</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{formatCurrency(totals.debits)}</p>
        </SurfaceCard>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <SurfaceCard>
          <h2 className="text-lg font-semibold text-gray-900">Transaction Form</h2>
          <p className="mt-2 text-sm text-gray-600">
            The transaction form is disabled until you click <span className="font-medium text-gray-900">New Transaction</span> or <span className="font-medium text-gray-900">Edit</span>.
          </p>
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            Form is currently disabled.
          </div>
          <CommonButton className="mt-4 w-full" onClick={onStartCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Open Create Transaction
          </CommonButton>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="mt-1 text-sm text-gray-600">Latest transaction records in the system.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transactions"
                  className="rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'credit' | 'debit')}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Types</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <CommonTable columns={columns as any} rows={filteredItems as any} />
          </div>
        </SurfaceCard>
      </div>

      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="text-lg font-semibold text-gray-900">{mode === 'create' ? 'Create Transaction' : 'Edit Transaction'}</h2>
          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
                value={draft.type}
                onChange={(e) => setDraft((current) => ({ ...current, type: e.target.value as 'credit' | 'debit' }))}
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <FormInput label="Account Number" value={draft.account_number} onChange={(value) => setDraft((current) => ({ ...current, account_number: value }))} required />
            <FormInput label="Amount" type="number" value={draft.amount} onChange={(value) => setDraft((current) => ({ ...current, amount: value }))} required />
            <FormInput label="Description" value={draft.description} onChange={(value) => setDraft((current) => ({ ...current, description: value }))} />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((current) => ({ ...current, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex gap-3">
              <CommonButton className="flex-1" variant="outline" onClick={() => setIsFormOpen(false)} disabled={loading || authLoading}>
                Cancel
              </CommonButton>
              <CommonButton className="flex-1" type="submit" loading={loading || authLoading}>
                {mode === 'create' ? 'Save Transaction' : 'Update Transaction'}
              </CommonButton>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
