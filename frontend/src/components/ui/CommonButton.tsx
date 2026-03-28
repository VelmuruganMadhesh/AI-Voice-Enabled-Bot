import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200',
  outline: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
}

export function CommonButton({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  type = 'button',
  onClick,
  disabled,
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
}) {
  return (
    <motion.div whileHover={disabled || loading ? undefined : { y: -1 }} whileTap={disabled || loading ? undefined : { scale: 0.99 }}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          sizeClasses[size],
          variantClasses[variant],
          className,
        ].join(' ')}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        <span>{children}</span>
      </button>
    </motion.div>
  )
}
