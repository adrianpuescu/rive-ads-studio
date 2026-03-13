import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://riveads.webz.ro/reset-password',
    })

    if (resetError) {
      setError(resetError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-center">
        <div className="text-lg font-semibold">RiveAds Studio</div>
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-medium mb-4">Reset password</h2>

        {success ? (
          <p className="text-sm text-gray-700">
            Check your email for a reset link.
          </p>
        ) : (
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
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                autoComplete="email"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gray-900 text-white rounded py-2 text-sm hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-gray-600 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-gray-900 hover:underline"
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  )
}
