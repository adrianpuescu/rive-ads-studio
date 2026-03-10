import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import { ChatPanel } from './components/ChatPanel'
import { AdCanvas } from './components/AdCanvas'
import { ExportButton } from './components/ExportButton'
import { SpecInspector } from './components/SpecInspector'
import { LibraryPanel } from './components/LibraryPanel'
import { useLibrary } from './hooks/useLibrary'
import { libraryItemToAdSpec } from './lib/libraryAdSpec'
import type { AdSpec } from './types/ad-spec.schema'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

const CHAT_COLLAPSED_KEY = 'riveads_chat_collapsed'
const INSPECTOR_COLLAPSED_KEY = 'riveads_inspector_collapsed'

function readStored(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    return v === 'true'
  } catch {
    return fallback
  }
}

function App() {
  const [currentSpec, setCurrentSpec] = useState<AdSpec | null>(null)
  const [chatCollapsed, setChatCollapsed] = useState(() =>
    readStored(CHAT_COLLAPSED_KEY, false)
  )
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    readStored(INSPECTOR_COLLAPSED_KEY, false)
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [showNewAdConfirm, setShowNewAdConfirm] = useState(false)
  const [newAdTrigger, setNewAdTrigger] = useState(0)
  const [restoredChatHistory, setRestoredChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }> | null
  >(null)
  const newAdConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null)
  const { items: libraryItems, addItem, updateItemThumbnail, removeItem } = useLibrary()

  const clearNewAdConfirmTimeout = useCallback(() => {
    if (newAdConfirmTimeoutRef.current) {
      clearTimeout(newAdConfirmTimeoutRef.current)
      newAdConfirmTimeoutRef.current = null
    }
  }, [])

  const handleNewAdClick = useCallback(() => {
    if (currentSpec) {
      setShowNewAdConfirm(true)
      clearNewAdConfirmTimeout()
      newAdConfirmTimeoutRef.current = setTimeout(() => {
        setShowNewAdConfirm(false)
        newAdConfirmTimeoutRef.current = null
      }, 5000)
    } else {
      doNewAd()
    }
  }, [currentSpec])

  const doNewAd = useCallback(() => {
    setShowNewAdConfirm(false)
    clearNewAdConfirmTimeout()
    setLibraryOpen(false)
    setCurrentSpec(null)
    setNewAdTrigger((t) => t + 1)
    setTimeout(() => promptInputRef.current?.focus(), 100)
  }, [])

  const handleAdGenerated = useCallback(
    (
      spec: AdSpec,
      prompt: string,
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    ) => {
      const baseItem = {
        headline: spec.text?.headline?.value ?? '',
        subheadline: spec.text?.subheadline?.value ?? '',
        cta: spec.text?.cta?.value ?? '',
        colors: {
          background: spec.colors?.background ?? '#ffffff',
          primary: spec.colors?.primary ?? '#000000',
          secondary: spec.colors?.secondary ?? '#666666',
        },
        prompt,
        chatHistory,
      }
      const id = addItem(baseItem)
      setTimeout(() => {
        try {
          const canvas = document.querySelector('canvas')
          if (canvas) {
            const thumbnail = (canvas as HTMLCanvasElement).toDataURL('image/jpeg', 0.6)
            updateItemThumbnail(id, thumbnail)
          }
        } catch {
          // omit thumbnail
        }
      }, 800)
    },
    [addItem, updateItemThumbnail]
  )

  useEffect(() => {
    return () => clearNewAdConfirmTimeout()
  }, [clearNewAdConfirmTimeout])

  useEffect(() => {
    localStorage.setItem(CHAT_COLLAPSED_KEY, String(chatCollapsed))
  }, [chatCollapsed])

  useEffect(() => {
    localStorage.setItem(INSPECTOR_COLLAPSED_KEY, String(inspectorCollapsed))
  }, [inspectorCollapsed])

  const toggleChat = useCallback(() => {
    setChatCollapsed((c) => !c)
  }, [])

  const toggleInspector = useCallback(() => {
    setInspectorCollapsed((c) => !c)
  }, [])

  return (
    <div className="app">
      <header className="app-toolbar">
        <div className="app-toolbar-wordmark">
          <span className="app-toolbar-wordmark-riveads">RiveAds</span>
          <span className="app-toolbar-wordmark-dot" aria-hidden />
          <span className="app-toolbar-wordmark-studio">Studio</span>
        </div>
        {showNewAdConfirm ? (
          <div className="app-toolbar-newad-confirm">
            <span className="app-toolbar-newad-confirm-text">Unsaved changes — New anyway?</span>
            <button
              type="button"
              className="app-toolbar-newad-btn app-toolbar-newad-btn-yes"
              onClick={doNewAd}
            >
              Yes
            </button>
            <button
              type="button"
              className="app-toolbar-newad-btn app-toolbar-newad-btn-cancel"
              onClick={() => {
                setShowNewAdConfirm(false)
                clearNewAdConfirmTimeout()
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="app-toolbar-newad-btn"
            onClick={handleNewAdClick}
            aria-label="New ad"
          >
            <span className="app-toolbar-newad-icon" aria-hidden>+</span>
            New Ad
          </button>
        )}
        <button
          type="button"
          className="app-toolbar-library-btn"
          onClick={() => setLibraryOpen((prev) => !prev)}
          aria-label="Open Creative Library"
        >
          <span className="app-toolbar-library-icon" aria-hidden>⊞</span>
          Library
          {libraryItems.length > 0 && (
            <span className="app-toolbar-library-badge" aria-label={`${libraryItems.length} ads in library`}>
              {libraryItems.length}
            </span>
          )}
        </button>
        <div className="app-toolbar-spacer" />
        <div className="app-toolbar-actions">
          <span className="app-toolbar-badge" aria-label="Ad size">
            728 × 90
          </span>
          {currentSpec && (
            <ExportButton
              spec={currentSpec}
              rivFileName="test-template.riv"
            />
          )}
        </div>
      </header>

      <div className="app-main">
        <div
          className={`app-left-wrap ${chatCollapsed ? 'app-sidebar-collapsed' : ''}`}
        >
          <div
            className={`app-left-panel ${chatCollapsed ? 'app-sidebar-content-collapsed' : ''}`}
          >
            <ChatPanel
              promptInputRef={promptInputRef}
              currentSpec={currentSpec}
              onSpecUpdate={setCurrentSpec}
              onInitialGenerate={setCurrentSpec}
              onAdGenerated={handleAdGenerated}
              restoredChatHistory={restoredChatHistory}
              onRestoredChatHistoryApplied={() => setRestoredChatHistory(null)}
              newAdTrigger={newAdTrigger}
              apiKey={apiKey}
            />
          </div>
        </div>

        <div className="app-center-panel">
          <button
            type="button"
            className="app-sidebar-toggle app-sidebar-toggle-left"
            onClick={toggleChat}
            aria-label={chatCollapsed ? 'Expand chat' : 'Collapse chat'}
            aria-expanded={!chatCollapsed}
          >
            {chatCollapsed ? '›' : '‹'}
          </button>
          {currentSpec ? (
            <div className="app-canvas-wrapper">
              <AdCanvas
                spec={currentSpec}
                width={728}
                height={90}
              />
            </div>
          ) : (
            <p className="app-placeholder">Your ad will appear here</p>
          )}
          {currentSpec && (
            <button
              type="button"
              className="app-sidebar-toggle app-sidebar-toggle-right"
              onClick={toggleInspector}
              aria-label={
                inspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'
              }
              aria-expanded={!inspectorCollapsed}
            >
              {inspectorCollapsed ? '‹' : '›'}
            </button>
          )}
        </div>

        <LibraryPanel
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          items={libraryItems}
          onLoad={(item) => {
            setCurrentSpec(libraryItemToAdSpec(item))
            setRestoredChatHistory(item.chatHistory ?? [])
            setLibraryOpen(false)
          }}
          onRemove={removeItem}
        />
        {currentSpec && (
          <div
            className={`app-right-wrap ${inspectorCollapsed ? 'app-sidebar-collapsed' : ''}`}
          >
            <div
              className={`app-right-panel ${inspectorCollapsed ? 'app-sidebar-content-collapsed' : ''}`}
            >
              <p className="panel-label">INSPECTOR</p>
              <SpecInspector
                spec={currentSpec}
                onChange={setCurrentSpec}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
