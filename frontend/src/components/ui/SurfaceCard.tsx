import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function SurfaceCard({
  children,
  className = '',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <motion.div
      whileHover={interactive ? { y: -2 } : undefined}
      transition={{ duration: 0.15 }}
      className={['rounded-lg border border-gray-200 bg-white p-6 shadow-sm', className].join(' ')}
    >
      {children}
    </motion.div>
  )
}
