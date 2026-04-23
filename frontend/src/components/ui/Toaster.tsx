import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

const toneIcon = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} satisfies Record<ToastTone, any>

const toneIconClasses = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
} satisfies Record<ToastTone, string>

const toneClasses = {
  success: 'border-green-200 bg-white text-gray-900',
  error: 'border-red-200 bg-white text-gray-900',
  info: 'border-blue-200 bg-white text-gray-900',
} satisfies Record<ToastTone, string>

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={['pointer-events-auto rounded-lg border p-4 shadow-md', toneClasses[toast.tone]].join(' ')}
            >
              <div className="flex items-start gap-3">
                <Icon className={['mt-0.5 h-5 w-5 shrink-0', toneIconClasses[toast.tone]].join(' ')} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{toast.title}</div>
                  {toast.description ? <div className="mt-1 text-xs text-gray-600">{toast.description}</div> : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
