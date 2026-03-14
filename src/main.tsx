import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ProjectsPage } from './pages/ProjectsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx'
import { PreviewPage } from './pages/PreviewPage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'
import { useAuth } from './hooks/useAuth'
import { PageLoader } from './components/PageLoader'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader message="Loading session…" />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/preview/:token" element={<PreviewPage />} />
      <Route
        path="/dashboard"
        element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/editor"
        element={user ? <App /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/projects"
        element={user ? <ProjectsPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)
