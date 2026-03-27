import { http } from './http'

type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export type AccountDetails = {
  account_number: string
  currency: string
  balance: number
  created_at: string | Date | null
}

export async function getAccountDetails() {
  const res = await http.get<ApiEnvelope<AccountDetails>>('/api/account/details')
  return res.data
}

