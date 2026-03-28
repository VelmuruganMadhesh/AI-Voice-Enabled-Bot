import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  error?: string | null
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-700">*</span> : null}
      </label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={[
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors',
            'placeholder:text-gray-400',
            isPassword ? 'pr-10' : '',
            error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-600',
          ].join(' ')}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
