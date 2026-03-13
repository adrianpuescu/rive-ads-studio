import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-lg font-semibold">RiveAds Studio</div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-medium mb-4">Set new password</h2>

        {success ? (
          <p className="text-sm text-gray-700">
            Password updated. Redirecting to login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                New password
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
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus:border-gray-400"
                autoComplete="new-password"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white rounded py-2 text-sm hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
