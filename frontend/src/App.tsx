import { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RootLayout } from './components/layout/RootLayout'
import { ToastProvider } from './components/ui/ToastProvider'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { VoiceAssistantPage } from './pages/VoiceAssistantPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { AccountDetailsPage } from './pages/AccountDetailsPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { accessToken, loading } = useAuth()
  if (loading) return null
  if (accessToken) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <RegistrationPage />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RootLayout>
              <DashboardPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice"
        element={
          <ProtectedRoute>
            <RootLayout>
              <VoiceAssistantPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <RootLayout>
              <TransactionsPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <RootLayout>
              <AccountDetailsPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RootLayout>
              <ProfilePage />
            </RootLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RootLayout>
              <SettingsPage />
            </RootLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}

