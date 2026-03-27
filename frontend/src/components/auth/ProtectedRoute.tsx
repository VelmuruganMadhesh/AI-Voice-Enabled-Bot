import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '../../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { accessToken, loading } = useAuth()

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>
  if (!accessToken) return <Navigate to="/login" replace />
  return <>{children}</>
}

