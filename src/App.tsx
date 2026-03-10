import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import { ChatPanel } from './components/ChatPanel'
import { AdCanvas } from './components/AdCanvas'
import { ExportButton } from './components/ExportButton'
import { SpecInspector } from './components/SpecInspector'
import { LibraryPanel } from './components/LibraryPanel'
import { BrandTokensPanel } from './components/BrandTokensPanel'
import { useLibrary } from './hooks/useLibrary'
import { useBrandTokens } from './hooks/useBrandTokens'
import { useAdHistory } from './hooks/useAdHistory'
import { libraryItemToAdSpec, adSpecToLibraryItemPayload } from './lib/libraryAdSpec'
import type { AdSpec } from './types/ad-spec.schema'

const INSPECTOR_PUSH_DEBOUNCE_MS = 600
const HISTORY_TOAST_DURATION_MS = 1500

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
  const {
    present: adSpec,
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear: clearHistory,
    replacePresent,
  } = useAdHistory(null)
  const [chatCollapsed, setChatCollapsed] = useState(() =>
    readStored(CHAT_COLLAPSED_KEY, false)
  )
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    readStored(INSPECTOR_COLLAPSED_KEY, false)
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [activeLibraryItemId, setActiveLibraryItemId] = useState<string | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)
  const [showNewAdConfirm, setShowNewAdConfirm] = useState(false)
  const [newAdTrigger, setNewAdTrigger] = useState(0)
  const [restoredChatHistory, setRestoredChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }> | null
  >(null)
  const [historyToast, setHistoryToast] = useState<{ message: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const newAdConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inspectorPushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null)
  /** Last AdSpec state saved to Library (for "Saved" vs "Unsaved" indicator). */
  const lastSavedStateRef = useRef<AdSpec | null>(null)
  const [saveVersion, setSaveVersion] = useState(0)
  const { items: libraryItems, addItem, updateItemThumbnail, updateItem, removeItem } = useLibrary()
  const {
    brands,
    activeBrandId,
    activeBrand,
    isEnabled,
    hasActiveBrand,
    addBrand,
    updateBrand,
    deleteBrand,
    setActiveBrand,
    toggleEnabled,
  } = useBrandTokens()

  const clearNewAdConfirmTimeout = useCallback(() => {
    if (newAdConfirmTimeoutRef.current) {
      clearTimeout(newAdConfirmTimeoutRef.current)
      newAdConfirmTimeoutRef.current = null
    }
  }, [])

  const saveStatus =
    adSpec === null
      ? null
      : lastSavedStateRef.current != null &&
        JSON.stringify(adSpec) === JSON.stringify(lastSavedStateRef.current)
        ? 'saved'
        : 'unsaved'

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

  const handleNewAdClick = useCallback(() => {
    if (adSpec && saveStatus === 'unsaved') {
      setShowNewAdConfirm(true)
      clearNewAdConfirmTimeout()
      newAdConfirmTimeoutRef.current = setTimeout(() => {
        setShowNewAdConfirm(false)
        newAdConfirmTimeoutRef.current = null
      }, 8000)
    } else {
      doNewAd()
    }
  }, [adSpec, saveStatus])

  const doNewAd = useCallback(() => {
    setShowNewAdConfirm(false)
    clearNewAdConfirmTimeout()
    if (inspectorPushDebounceRef.current) {
      clearTimeout(inspectorPushDebounceRef.current)
      inspectorPushDebounceRef.current = null
    }
    setLibraryOpen(false)
    setActiveLibraryItemId(null)
    lastSavedStateRef.current = null
    setSaveVersion((v) => v + 1)
    clearHistory()
    setNewAdTrigger((t) => t + 1)
    setTimeout(() => promptInputRef.current?.focus(), 100)
  }, [clearHistory])

  const handleUndo = useCallback(() => {
    if (!canUndo) return
    if (inspectorPushDebounceRef.current) {
      clearTimeout(inspectorPushDebounceRef.current)
      inspectorPushDebounceRef.current = null
    }
    undo()
    setHistoryToast({ message: '↩ Reverted to previous version' })
  }, [canUndo, undo])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    if (inspectorPushDebounceRef.current) {
      clearTimeout(inspectorPushDebounceRef.current)
      inspectorPushDebounceRef.current = null
    }
    redo()
    setHistoryToast({ message: '↪ Restored next version' })
  }, [canRedo, redo])

  const handleInspectorChange = useCallback(
    (updated: AdSpec) => {
      if (inspectorPushDebounceRef.current) {
        clearTimeout(inspectorPushDebounceRef.current)
        replacePresent(updated)
        inspectorPushDebounceRef.current = setTimeout(() => {
          inspectorPushDebounceRef.current = null
        }, INSPECTOR_PUSH_DEBOUNCE_MS)
      } else {
        push(updated)
        inspectorPushDebounceRef.current = setTimeout(() => {
          inspectorPushDebounceRef.current = null
        }, INSPECTOR_PUSH_DEBOUNCE_MS)
      }
    },
    [replacePresent, push]
  )

  useEffect(() => {
    if (!historyToast) return
    const id = setTimeout(() => setHistoryToast(null), HISTORY_TOAST_DURATION_MS)
    return () => clearTimeout(id)
  }, [historyToast])

  const captureAndUpdateThumbnail = useCallback(
    (itemId: string, onDone?: () => void) => {
      setTimeout(() => {
        try {
          const canvas = document.querySelector('canvas')
          if (canvas) {
            const thumbnail = (canvas as HTMLCanvasElement).toDataURL('image/png')
            updateItemThumbnail(itemId, thumbnail)
          }
        } catch {
          // omit thumbnail
        }
        onDone?.()
      }, 800)
    },
    [updateItemThumbnail]
  )

  const handleSaveToLibrary = useCallback(
    (onAfterSave?: () => void) => {
      if (!adSpec) return
      const payload = adSpecToLibraryItemPayload(adSpec)
      let itemId: string
      if (activeLibraryItemId) {
        updateItem(activeLibraryItemId, payload)
        itemId = activeLibraryItemId
      } else {
        itemId = addItem(payload)
        setActiveLibraryItemId(itemId)
      }
      lastSavedStateRef.current = adSpec
      setSaveVersion((v) => v + 1)
      captureAndUpdateThumbnail(itemId, onAfterSave)
    },
    [adSpec, activeLibraryItemId, addItem, updateItem, captureAndUpdateThumbnail]
  )

  const handleSaveAndNew = useCallback(() => {
    handleSaveToLibrary(doNewAd)
  }, [handleSaveToLibrary, doNewAd])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveToLibrary()
        return
      }
      if (e.metaKey && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handleUndo, handleRedo, handleSaveToLibrary])

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
          headlineColor: spec.colors?.headlineColor,
          subheadlineColor: spec.colors?.subheadlineColor,
          ctaColor: spec.colors?.ctaColor,
        },
        prompt,
        chatHistory,
      }
      const id = addItem(baseItem)
      setActiveLibraryItemId(id)
      lastSavedStateRef.current = spec
      setSaveVersion((v) => v + 1)
      captureAndUpdateThumbnail(id)
    },
    [addItem, captureAndUpdateThumbnail]
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
            <span className="app-toolbar-newad-confirm-text">Unsaved changes</span>
            <button
              type="button"
              className="app-toolbar-newad-btn app-toolbar-newad-btn-save"
              onClick={handleSaveAndNew}
            >
              Save & New
            </button>
            <button
              type="button"
              className="app-toolbar-newad-btn app-toolbar-newad-btn-discard"
              onClick={doNewAd}
            >
              Discard
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
          className="app-toolbar-undo-btn"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Cmd+Z)"
        >
          <span className="app-toolbar-undo-icon" aria-hidden>↩</span>
        </button>
        <button
          type="button"
          className="app-toolbar-redo-btn"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Cmd+Shift+Z)"
        >
          <span className="app-toolbar-redo-icon" aria-hidden>↪</span>
        </button>
        {adSpec && (
          <span className="app-toolbar-save-status" aria-live="polite">
            {lastSavedStateRef.current != null &&
            JSON.stringify(adSpec) === JSON.stringify(lastSavedStateRef.current) ? (
              <>
                <span className="app-toolbar-save-status-dot app-toolbar-save-status-dot-saved" aria-hidden />
                Saved
              </>
            ) : (
              <>
                <span className="app-toolbar-save-status-dot app-toolbar-save-status-dot-unsaved" aria-hidden />
                Unsaved changes
              </>
            )}
          </span>
        )}
        <button
          type="button"
          className="app-toolbar-brand-btn"
          onClick={() => setBrandOpen((prev) => !prev)}
          aria-label={hasActiveBrand ? `${activeBrand?.name ?? 'Brand'} active — edit` : 'Open Brand Manager'}
          title={hasActiveBrand ? `◈ ${activeBrand?.name ?? 'Brand'} active` : 'Brand Manager'}
        >
          <span className="app-toolbar-brand-icon" aria-hidden>◈</span>
          Brand
          {hasActiveBrand && <span className="app-toolbar-brand-dot" aria-hidden />}
        </button>
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
          {adSpec && (
            <ExportButton
              spec={adSpec}
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
              currentSpec={adSpec}
              onSpecUpdate={push}
              onInitialGenerate={push}
              onAdGenerated={handleAdGenerated}
              onGeneratingChange={setIsGenerating}
              restoredChatHistory={restoredChatHistory}
              onRestoredChatHistoryApplied={() => setRestoredChatHistory(null)}
              newAdTrigger={newAdTrigger}
              apiKey={apiKey}
              activeBrand={hasActiveBrand && activeBrand ? { name: activeBrand.name, tokens: activeBrand.tokens } : null}
              hasActiveBrand={hasActiveBrand}
              activeBrandName={activeBrand?.name ?? ''}
              onOpenBrandTokens={() => setBrandOpen(true)}
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
          {adSpec ? (
            <div className="app-canvas-wrapper">
              <AdCanvas
                spec={adSpec}
                width={728}
                height={90}
                isGenerating={isGenerating}
              />
              {historyToast && (
                <div className="app-history-toast" role="status">
                  {historyToast.message}
                </div>
              )}
            </div>
          ) : (
            <p className="app-placeholder">Your ad will appear here</p>
          )}
          {adSpec && (
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
            const spec = libraryItemToAdSpec(item)
            push(spec)
            setActiveLibraryItemId(item.id)
            lastSavedStateRef.current = spec
            setRestoredChatHistory(item.chatHistory ?? [])
            setLibraryOpen(false)
          }}
          onRemove={(id) => {
            if (id === activeLibraryItemId) {
              clearHistory()
              setActiveLibraryItemId(null)
              lastSavedStateRef.current = null
              setSaveVersion((v) => v + 1)
              setRestoredChatHistory(null)
              setNewAdTrigger((t) => t + 1)
            }
            removeItem(id)
          }}
        />
        <BrandTokensPanel
          isOpen={brandOpen}
          onClose={() => setBrandOpen(false)}
          brands={brands}
          activeBrandId={activeBrandId}
          isEnabled={isEnabled}
          onToggleEnabled={toggleEnabled}
          onAddBrand={addBrand}
          onUpdateBrand={updateBrand}
          onDeleteBrand={deleteBrand}
          onSetActiveBrand={setActiveBrand}
        />
        {adSpec && (
          <div
            className={`app-right-wrap ${inspectorCollapsed ? 'app-sidebar-collapsed' : ''}`}
          >
            <div
              className={`app-right-panel ${inspectorCollapsed ? 'app-sidebar-content-collapsed' : ''}`}
            >
              <p className="panel-label">INSPECTOR</p>
              <SpecInspector
                spec={adSpec}
                onChange={handleInspectorChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
