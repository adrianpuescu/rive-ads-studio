import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  displayName: string | null
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(!!userId)

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', userId)
          .maybeSingle()

        if (cancelled) return
        if (error) {
          setProfile(null)
          setLoading(false)
          return
        }
        setProfile({
          id: data?.id ?? userId,
          displayName: data?.display_name ?? null,
        })
      } catch {
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchProfile()
    return () => {
      cancelled = true
    }
  }, [userId])

  const updateDisplayName = useCallback(
    async (displayName: string | null) => {
      if (!userId) return

      const { error } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, display_name: displayName?.trim() || null },
          { onConflict: 'id' }
        )

      if (error) throw error
      setProfile((p) => (p ? { ...p, displayName: displayName?.trim() || null } : null))
    },
    [userId]
  )

  return { profile, loading, updateDisplayName }
}
