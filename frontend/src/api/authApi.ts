import { http } from './http'

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string
}

export type LoginResponse = {
  token: string
  user: {
    _id: string
    name?: string
    email: string
    phone?: string
    language?: string
  }
}

export async function login(email: string, password: string) {
  const res = await http.post<ApiEnvelope<LoginResponse>>('/api/auth/login', { email, password })
  return res.data
}

export async function register(payload: {
  name: string
  email: string
  phone?: string
  password: string
  language?: string
}) {
  const res = await http.post<ApiEnvelope<{ _id: string; name?: string; email: string }>>(
    '/api/auth/register',
    payload,
  )
  return res.data
}

export async function fetchProfile() {
  const res = await http.get<ApiEnvelope<any>>('/api/auth/profile')
  return res.data
}

