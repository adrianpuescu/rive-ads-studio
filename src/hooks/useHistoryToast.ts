import { useState, useEffect, useCallback } from 'react'

const HISTORY_TOAST_DURATION_MS = 1500

interface HistoryToast {
  message: string
}

export function useHistoryToast() {
  const [historyToast, setHistoryToast] = useState<HistoryToast | null>(null)

  useEffect(() => {
    if (!historyToast) return
    const id = setTimeout(() => setHistoryToast(null), HISTORY_TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [historyToast])

  const showToast = useCallback((message: string) => {
    setHistoryToast({ message })
  }, [])

  return {
    historyToast,
    showToast,
  }
}
