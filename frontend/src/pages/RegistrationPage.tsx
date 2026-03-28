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
  const { pushToast } = useToast()

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
      pushToast({ tone: 'success', title: 'Account created', description: 'You can sign in now.' })
      navigate('/login')
    } catch {
      // authError shown below
    }
  }

  return (
    <AuthShell title="Register" subtitle="Create your banking support account.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormInput label="Full Name" value={name} onChange={setName} required error={errors.name || null} />
        <FormInput label="Email" value={email} onChange={setEmail} required error={errors.email || null} placeholder="you@example.com" />
        <FormInput label="Phone" value={phone} onChange={setPhone} error={errors.phone || null} />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-600"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ta' | 'hi')}
          >
            <option value="en">English</option>
            <option value="ta">Tamil</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <FormInput label="Password" type="password" value={password} onChange={setPassword} required error={errors.password || null} />

        {authError ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{authError}</div> : null}

        <CommonButton className="w-full" type="submit" loading={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </CommonButton>

        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link className="font-medium text-blue-600 hover:underline" to="/login">
            Login
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
