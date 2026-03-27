import { http } from './http'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export type TransactionItem = {
  _id: string
  account_number: string
  type: string
  amount: number
  description?: string | null
  date: string | Date
}

export async function listTransactions(limit = 50) {
  const res = await http.get<ApiEnvelope<{ items: TransactionItem[] }>>(`/api/transactions?limit=${limit}`)
  return res.data
}

export async function createTransaction(payload: {
  account_number: string
  type: 'credit' | 'debit'
  amount: number
  description?: string
  date?: string
}) {
  const res = await http.post<ApiEnvelope<{ item: TransactionItem }>>('/api/transactions', payload)
  return res.data
}

export async function updateTransaction(txId: string, payload: Partial<Omit<Parameters<typeof createTransaction>[0], 'account_number'>>) {
  const res = await http.put<ApiEnvelope<{ item: TransactionItem }>>(`/api/transactions/${txId}`, payload)
  return res.data
}

export async function deleteTransaction(txId: string) {
  const res = await http.delete<ApiEnvelope<{ deleted: boolean }>>(`/api/transactions/${txId}`)
  return res.data
}

