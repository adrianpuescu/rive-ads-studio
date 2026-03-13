import { useRef, useState, useCallback, useEffect } from 'react'
import type { AdSpec } from '../types/ad-spec.schema'

export type SaveStatus = 'saved' | 'unsaved' | null

interface UseSaveIndicatorReturn {
  saveStatus: SaveStatus
  lastSavedSpec: AdSpec | null
  markAsSaved: (spec: AdSpec) => void
  clearSavedState: () => void
}

function specsMatch(a: AdSpec | null, b: AdSpec | null): boolean {
  if (a === null || b === null) return false
  const normalize = (spec: AdSpec) => {
    const { formatId, ...rest } = spec
    return rest
  }
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
}

export function useSaveIndicator(currentSpec: AdSpec | null): UseSaveIndicatorReturn {
  const lastSavedStateRef = useRef<AdSpec | null>(null)
  const [forceSaved, setForceSaved] = useState(false)
  const prevSpecRef = useRef<string | null>(null)

  useEffect(() => {
    const currentJson = currentSpec ? JSON.stringify(currentSpec) : null
    if (prevSpecRef.current !== null && currentJson !== prevSpecRef.current) {
      setForceSaved(false)
    }
    prevSpecRef.current = currentJson
  }, [currentSpec])

  const saveStatus: SaveStatus = (() => {
    if (currentSpec === null) return null
    if (forceSaved) return 'saved'
    if (lastSavedStateRef.current === null) return 'unsaved'
    return specsMatch(currentSpec, lastSavedStateRef.current) ? 'saved' : 'unsaved'
  })()

  const markAsSaved = useCallback((spec: AdSpec) => {
    console.log('markAsSaved called', spec)
    lastSavedStateRef.current = spec
    setForceSaved(true)
  }, [])

  const clearSavedState = useCallback(() => {
    lastSavedStateRef.current = null
    setForceSaved(false)
  }, [])

  return {
    saveStatus,
    lastSavedSpec: lastSavedStateRef.current,
    markAsSaved,
    clearSavedState,
  }
}
