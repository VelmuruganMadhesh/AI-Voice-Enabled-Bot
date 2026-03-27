import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { CommonButton } from '../components/ui/CommonButton'
import { FormInput } from '../components/ui/FormInput'
import { useAuth } from '../contexts/AuthContext'

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, authError } = useAuth()

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
      navigate('/dashboard')
    } catch {
      // authError will be shown
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-800 px-4">
    
    <div className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur-md p-8 shadow-xl border border-white/30">
      
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Login
      </h1>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        
        <FormInput
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          required
          error={errors.email || null}
        />

        <FormInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          error={errors.password || null}
        />

        {authError && (
          <div className="text-sm text-red-500 text-center">
            {authError}
          </div>
        )}

        <CommonButton
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Signing in...' : 'Login'}
        </CommonButton>

        <div className="text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            className="text-blue-600 font-medium hover:underline"
            to="/register"
          >
            Register
          </Link>
        </div>
      </form>
    </div>
  </div>
)
}

