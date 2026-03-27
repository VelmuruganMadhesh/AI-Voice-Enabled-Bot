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
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-black">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        className={[
          'w-full rounded-md border px-3 py-2 text-sm text-black outline-none placeholder:text-zinc-500',
          'bg-white',
          error ? 'border-red-500 focus:border-red-500' : 'border-black/20 focus:border-black',
        ].join(' ')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
      />
      {error ? <div className="text-xs text-red-600">{error}</div> : null}
    </div>
  )
}

