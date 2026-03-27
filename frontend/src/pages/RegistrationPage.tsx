import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { CommonButton } from '../components/ui/CommonButton'
import { FormInput } from '../components/ui/FormInput'
import { useAuth } from '../contexts/AuthContext'

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function validatePassword(password: string) {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.'
  return null
}

export function RegistrationPage() {
  const navigate = useNavigate()
  const { register, loading, authError } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi'>('en')
  const [password, setPassword] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!name.trim()) nextErrors.name = 'Name is required.'
    if (!email.trim()) nextErrors.email = 'Email is required.'
    else if (!validateEmail(email)) nextErrors.email = 'Enter a valid email address.'

    if (phone.trim() && phone.trim().length < 6) nextErrors.phone = 'Phone number looks too short.'

    const pwdError = validatePassword(password)
    if (!password.trim()) nextErrors.password = 'Password is required.'
    else if (pwdError) nextErrors.password = pwdError

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
        password,
        language,
      })
      // After registration, we send the user to login for a clean demo flow.
      navigate('/login')
    } catch {
      // authError is displayed
    }
  }

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-800 px-4">
    
    <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-8">
      
      <h1 className="text-3xl font-bold text-center text-gray-800">
        Create Account
      </h1>
      <p className="mt-2 text-sm text-center text-gray-600">
        Set up your multilingual support profile
      </p>

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        
        <FormInput
          label="Full Name"
          value={name}
          onChange={setName}
          required
          placeholder="Your name"
          error={errors.name || null}
        />

        <FormInput
          label="Email"
          value={email}
          onChange={setEmail}
          required
          placeholder="you@example.com"
          error={errors.email || null}
        />

        <FormInput
          label="Phone (optional)"
          value={phone}
          onChange={setPhone}
          placeholder="9999999999"
          error={errors.phone || null}
        />

        {/* Language Dropdown */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-900">
            Preferred Language <span className="text-red-600">*</span>
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
          >
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
            <option value="en">English</option>
          </select>
        </div>

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
          {loading ? 'Creating...' : 'Register'}
        </CommonButton>

        <div className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link
            className="text-blue-600 font-medium hover:underline"
            to="/login"
          >
            Login
          </Link>
        </div>

      </form>
    </div>
  </div>
)
}

