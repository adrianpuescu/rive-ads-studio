import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'

function readStored(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    return v === 'true'
  } catch {
    return fallback
  }
}

export function usePanelCollapse() {
  const [chatCollapsed, setChatCollapsed] = useState(() =>
    readStored(STORAGE_KEYS.CHAT_COLLAPSED, false)
  )
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    readStored(STORAGE_KEYS.INSPECTOR_COLLAPSED, false)
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT_COLLAPSED, String(chatCollapsed))
  }, [chatCollapsed])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSPECTOR_COLLAPSED, String(inspectorCollapsed))
  }, [inspectorCollapsed])

  const toggleChat = useCallback(() => {
    setChatCollapsed((c) => !c)
  }, [])

  const toggleInspector = useCallback(() => {
    setInspectorCollapsed((c) => !c)
  }, [])

  return {
    chatCollapsed,
    setChatCollapsed,
    inspectorCollapsed,
    toggleChat,
    toggleInspector,
  }
}
