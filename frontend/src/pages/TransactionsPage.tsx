import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CommonButton } from '../components/ui/CommonButton'
import { CommonTable } from '../components/ui/CommonTable'
import { FormInput } from '../components/ui/FormInput'
import { useAuth } from '../contexts/AuthContext'
import { getAccountDetails } from '../api/accountApi'
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '../api/transactionsApi'
import type { TransactionItem } from '../api/transactionsApi'

type TxDraft = {
  account_number: string
  type: 'credit' | 'debit'
  amount: string
  description: string
  date: string
}

function formatDate(d: any) {
  if (!d) return ''
  try {
    const dt = typeof d === 'string' ? new Date(d) : d
    if (Number.isNaN(dt.getTime())) return String(d)
    return dt.toISOString().slice(0, 10)
  } catch {
    return String(d)
  }
}

export function TransactionsPage() {
  const { loading: authLoading } = useAuth()

  const [accountNumber, setAccountNumber] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<TransactionItem[]>([])

  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)

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

  const refreshAccount = async () => {
    try {
      const env = await getAccountDetails()
      setAccountNumber(env.data.account_number)
      setDraft((d) => ({ ...d, account_number: env.data.account_number }))
    } catch {
      // ignore; allow manual input
    }
  }

  useEffect(() => {
    refreshAccount().finally(() => refresh())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (accountNumber) setDraft((d) => ({ ...d, account_number: accountNumber }))
  }, [accountNumber])

  const onStartCreate = () => {
    setMode('create')
    setEditingId(null)
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
    setDraft({
      account_number: item.account_number,
      type: (item.type as any) || 'credit',
      amount: String(item.amount ?? ''),
      description: String(item.description ?? ''),
      date: formatDate(item.date),
    })
  }

  const onDelete = async (txId: string) => {
    const ok = confirm('Delete this transaction?')
    if (!ok) return
    setLoading(true)
    setError(null)
    try {
      await deleteTransaction(txId)
      await refresh()
      onStartCreate()
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
        description: draft.description ? draft.description : undefined,
        date: draft.date ? new Date(draft.date).toISOString() : undefined,
      }

      if (mode === 'create') {
        await createTransaction(payload)
      } else {
        if (!editingId) throw new Error('Missing transaction id.')
        await updateTransaction(editingId, payload)
      }

      await refresh()
      onStartCreate()
    } catch (e: any) {
      setError(e?.message || e?.response?.data?.message || 'Operation failed.')
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      { key: 'account_number', header: 'Account' },
      { key: 'type', header: 'Type' },
      {
        key: 'amount',
        header: 'Amount (INR)',
        render: (r: TransactionItem) => `${Number(r.amount).toFixed(2)}`,
      },
      { key: 'description', header: 'Description', render: (r: TransactionItem) => r.description || '-' },
      { key: 'date', header: 'Date', render: (r: TransactionItem) => formatDate(r.date) },
      {
        key: '_id',
        header: 'Actions',
        render: (r: TransactionItem) => (
          <div className="flex gap-2">
            <CommonButton
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              onClick={() => onEdit(r)}
              disabled={loading || authLoading}
            >
              Edit
            </CommonButton>
            <CommonButton
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => onDelete(r._id)}
              disabled={loading || authLoading}
            >
              Delete
            </CommonButton>
          </div>
        ),
      },
    ],
    [authLoading, loading],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h2 className="text-xl font-semibold">Transactions</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Create, update, and delete transactions.</p>
        </div>
        <CommonButton onClick={onStartCreate} disabled={loading || authLoading} className="bg-violet-600 hover:bg-violet-700">
          New Transaction
        </CommonButton>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-4">
          <h3 className="font-medium">Transaction Form</h3>
          <form className="mt-4 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Type <span className="text-violet-600">*</span>
              </label>
              <select
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={draft.type}
                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as any }))}
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            <FormInput
              label="Account Number"
              value={draft.account_number}
              onChange={(v) => setDraft((d) => ({ ...d, account_number: v }))}
              required
              placeholder="e.g., 1234567890"
            />
            <FormInput
              label="Amount (INR)"
              value={draft.amount}
              onChange={(v) => setDraft((d) => ({ ...d, amount: v }))}
              required
              placeholder="e.g., 500"
              type="number"
            />
            <FormInput
              label="Description (optional)"
              value={draft.description}
              onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
              placeholder="e.g., Grocery purchase"
            />

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-800 dark:text-zinc-100">Date (optional)</label>
              <input
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              />
            </div>

            <CommonButton disabled={loading || authLoading} type="submit">
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </CommonButton>
          </form>
        </div>

        <div className="lg:col-span-3">
          {loading ? <div className="text-sm text-zinc-600">Loading transactions...</div> : null}
          <CommonTable columns={columns as any} rows={items as any} />
        </div>
      </div>
    </div>
  )
}

