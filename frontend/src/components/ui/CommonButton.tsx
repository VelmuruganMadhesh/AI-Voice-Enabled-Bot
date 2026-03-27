import React from 'react'

export function CommonButton({
  children,
  onClick,
  type = 'button',
  disabled,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
        'bg-blue-400 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-400',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}

