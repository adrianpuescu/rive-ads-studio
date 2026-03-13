import { useState, useCallback, useEffect, useRef } from 'react'
import type { AdSpec } from '../types/ad-spec.schema'
import type { SaveStatus } from './useSaveIndicator'

const CONFIRM_DIALOG_TIMEOUT_MS = 8000

interface UseUnsavedChangesOptions {
  adSpec: AdSpec | null
  saveStatus: SaveStatus
  onNewAd: () => void
  onSaveAndNew: () => void
}

interface UseUnsavedChangesReturn {
  showNewAdConfirm: boolean
  handleNewAdClick: () => void
  handleSaveAndNew: () => void
  handleDiscard: () => void
  cancelConfirm: () => void
}

export function useUnsavedChanges({
  adSpec,
  saveStatus,
  onNewAd,
  onSaveAndNew,
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn {
  const [showNewAdConfirm, setShowNewAdConfirm] = useState(false)
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearConfirmTimeout = useCallback(() => {
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current)
      confirmTimeoutRef.current = null
    }
  }, [])

  const cancelConfirm = useCallback(() => {
    setShowNewAdConfirm(false)
    clearConfirmTimeout()
  }, [clearConfirmTimeout])

  const handleNewAdClick = useCallback(() => {
    if (adSpec && saveStatus === 'unsaved') {
      setShowNewAdConfirm(true)
      clearConfirmTimeout()
      confirmTimeoutRef.current = setTimeout(() => {
        setShowNewAdConfirm(false)
        confirmTimeoutRef.current = null
      }, CONFIRM_DIALOG_TIMEOUT_MS)
    } else {
      onNewAd()
    }
  }, [adSpec, saveStatus, clearConfirmTimeout, onNewAd])

  const handleSaveAndNew = useCallback(() => {
    cancelConfirm()
    onSaveAndNew()
  }, [cancelConfirm, onSaveAndNew])

  const handleDiscard = useCallback(() => {
    cancelConfirm()
    onNewAd()
  }, [cancelConfirm, onNewAd])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved' && adSpec !== null) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveStatus, adSpec])

  useEffect(() => {
    return () => clearConfirmTimeout()
  }, [clearConfirmTimeout])

  return {
    showNewAdConfirm,
    handleNewAdClick,
    handleSaveAndNew,
    handleDiscard,
    cancelConfirm,
  }
}
