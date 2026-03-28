import type { ReactNode } from 'react'

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">{title}</h1>
        <p className="mt-2 text-sm text-gray-600 text-center">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
