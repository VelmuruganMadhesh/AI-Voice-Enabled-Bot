import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, TriangleAlert } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

const ToastContext = createContext<{ pushToast: (toast: Omit<ToastItem, 'id'>) => void } | undefined>(undefined)

const toneIcon = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} satisfies Record<ToastTone, any>

const toneClasses = {
  success: 'border-green-200 bg-white text-gray-900',
  error: 'border-red-200 bg-white text-gray-900',
  info: 'border-blue-200 bg-white text-gray-900',
} satisfies Record<ToastTone, string>

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3000)
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toneIcon[toast.tone]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className={['pointer-events-auto rounded-lg border p-4 shadow-md', toneClasses[toast.tone]].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-semibold">{toast.title}</div>
                    {toast.description ? <div className="mt-1 text-xs text-gray-600">{toast.description}</div> : null}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
