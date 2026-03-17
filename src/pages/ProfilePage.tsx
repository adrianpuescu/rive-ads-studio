import { useState, useCallback, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../lib/supabase'
import { UserNavDropdown } from '../components/UserNavDropdown'

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { profile, loading: profileLoading, updateDisplayName } = useProfile(user?.id)

  const [displayName, setDisplayName] = useState('')
  const [displayNameSaving, setDisplayNameSaving] = useState(false)
  const [displayNameSaved, setDisplayNameSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '')
    }
  }, [profile])

  const handleDisplayNameSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!user?.id) return
      setDisplayNameSaving(true)
      setDisplayNameSaved(false)
      try {
        await updateDisplayName(displayName.trim() || null)
        setDisplayNameSaved(true)
        setTimeout(() => setDisplayNameSaved(false), 2000)
      } finally {
        setDisplayNameSaving(false)
      }
    },
    [user?.id, displayName, updateDisplayName]
  )

  const handlePasswordSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setPasswordError(null)
      setPasswordSuccess(false)

      if (newPassword !== confirmPassword) {
        setPasswordError('New passwords do not match.')
        return
      }
      if (newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters.')
        return
      }

      const email = user?.email
      if (!email) {
        setPasswordError('Session expired. Please sign in again.')
        return
      }

      setPasswordSubmitting(true)

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })

      if (signInError) {
        setPasswordError('Current password is incorrect.')
        setPasswordSubmitting(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setPasswordError(updateError.message)
        setPasswordSubmitting(false)
        return
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSubmitting(false)
    },
    [user?.email, currentPassword, newPassword, confirmPassword]
  )

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate('/login')
  }, [signOut, navigate])

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="h-11 flex-shrink-0 flex items-center px-5 bg-white border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-1.5 no-underline text-gray-900">
          <span className="font-serif text-sm font-semibold leading-none">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-gray-900" aria-hidden />
          <span className="font-sans text-sm font-semibold leading-none">Studio</span>
        </Link>
        <div className="flex-1" />
        <UserNavDropdown
          user={user}
          displayName={profile?.displayName ?? null}
          onSignOut={handleSignOut}
        />
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-6 py-8 flex flex-col gap-8">
        <h1 className="text-lg font-semibold text-gray-900 m-0">Profile</h1>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-gray-900 m-0">Account</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                readOnly
                value={user.email ?? ''}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
                aria-readonly="true"
              />
            </div>

            <form onSubmit={handleDisplayNameSubmit} className="flex flex-col gap-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors duration-150"
                  disabled={profileLoading}
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={profileLoading || displayNameSaving}
                  className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed min-h-[32px]"
                >
                  {displayNameSaving ? 'Saving…' : displayNameSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-gray-900 m-0">Change password</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {passwordSuccess ? (
              <p className="text-sm text-gray-700 m-0">Password updated successfully.</p>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Current password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:border-gray-400 transition-colors duration-150"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    New password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:border-gray-400 transition-colors duration-150"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:border-gray-400 transition-colors duration-150"
                    autoComplete="new-password"
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 m-0">{passwordError}</p>
                )}
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="w-full py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 border-0 cursor-pointer transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passwordSubmitting ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
