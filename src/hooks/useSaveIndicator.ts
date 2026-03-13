import { useRef, useState, useCallback, useMemo } from 'react'
import type { AdSpec } from '../types/ad-spec.schema'

export type SaveStatus = 'saved' | 'unsaved' | null

interface UseSaveIndicatorReturn {
  saveStatus: SaveStatus
  lastSavedSpec: AdSpec | null
  markAsSaved: (spec: AdSpec) => void
  clearSavedState: () => void
}

export function useSaveIndicator(currentSpec: AdSpec | null): UseSaveIndicatorReturn {
  const lastSavedStateRef = useRef<AdSpec | null>(null)
  const [, setSaveVersion] = useState(0)

  const saveStatus: SaveStatus = useMemo(() => {
    if (currentSpec === null) return null
    if (lastSavedStateRef.current === null) return 'unsaved'
    return JSON.stringify(currentSpec) === JSON.stringify(lastSavedStateRef.current)
      ? 'saved'
      : 'unsaved'
  }, [currentSpec])

  const markAsSaved = useCallback((spec: AdSpec) => {
    lastSavedStateRef.current = spec
    setSaveVersion((v) => v + 1)
  }, [])

  const clearSavedState = useCallback(() => {
    lastSavedStateRef.current = null
    setSaveVersion((v) => v + 1)
  }, [])

  return {
    saveStatus,
    lastSavedSpec: lastSavedStateRef.current,
    markAsSaved,
    clearSavedState,
  }
}
