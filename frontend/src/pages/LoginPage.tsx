import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { CommonButton } from '../components/ui/CommonButton'
import { AuthShell } from '../components/ui/AuthShell'
import { FormInput } from '../components/ui/FormInput'
import { useToast } from '../components/ui/ToastProvider'
import { useAuth } from '../contexts/AuthContext'

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, authError } = useAuth()
  const { pushToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: typeof errors = {}

    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!validateEmail(email)) nextErrors.email = 'Enter a valid email address.'
    if (!password.trim()) nextErrors.password = 'Password is required.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await login(email.trim(), password)
      pushToast({ tone: 'success', title: 'Signed in', description: 'Welcome back to the banking dashboard.' })
      navigate('/dashboard')
    } catch {
      // authError shown below
    }
  }

  return (
    <AuthShell title="Login" subtitle="Access your banking support dashboard.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormInput label="Email" value={email} onChange={setEmail} required error={errors.email || null} placeholder="you@example.com" />
        <FormInput label="Password" type="password" value={password} onChange={setPassword} required error={errors.password || null} />

        {authError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{authError}</div> : null}

        <CommonButton className="w-full" type="submit" loading={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </CommonButton>

        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link className="font-medium text-blue-600 hover:underline" to="/register">
            Register
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
