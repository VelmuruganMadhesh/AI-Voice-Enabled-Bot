import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { AppShell } from './AppShell'

export function RootLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AppShell onLogout={onLogout}>{children}</AppShell>
  )
}
