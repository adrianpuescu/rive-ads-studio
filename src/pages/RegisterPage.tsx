import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { sendAdminNotification, sendWelcomeEmail } from '../lib/notifications'

export function RegisterPage() {
  const { user, loading: authLoading, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [authLoading, user, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)

    const { error: signUpError } = await signUp(email, password)

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    const userEmail = email.trim().toLowerCase()
    sendWelcomeEmail(userEmail)
    sendAdminNotification('REGISTER', userEmail)
    setSuccessMessage('Check your email to confirm your account')
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-lg font-semibold">RiveAds Studio</div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-medium mb-4">Create account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus:border-gray-400"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus:border-gray-400"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus:border-gray-400"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          {successMessage && (
            <p className="text-xs text-green-600 mt-1">{successMessage}</p>
          )}

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full bg-gray-900 text-white rounded py-2 text-sm hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting || authLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
