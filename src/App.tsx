import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChatPanel } from './components/ChatPanel'
import { AdCanvas } from './components/AdCanvas'
import { ExportButton } from './components/ExportButton'
import { SpecInspector } from './components/SpecInspector'
import { AdsDrawer } from './components/AdsDrawer'
import { BrandTokensPanel } from './components/BrandTokensPanel'
import { VariantsModal } from './components/VariantsModal'
import { generateVariants, generateSingleVariant, VARIANT_STYLE_LABELS } from './ai/specGenerator'
import { useAds } from './hooks/useAds'
import { useBrandTokens } from './hooks/useBrandTokens'
import { useAdHistory } from './hooks/useAdHistory'
import { adToAdSpec, adSpecToAdPayload } from './lib/adSpecPayload'
import type { AdSpec } from './types/ad-spec.schema'
import { STORAGE_KEYS } from './constants/storageKeys'

const INSPECTOR_PUSH_DEBOUNCE_MS = 600
const HISTORY_TOAST_DURATION_MS = 1500

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

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
    readStored(STORAGE_KEYS.CHAT_COLLAPSED, false)
  )
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    readStored(STORAGE_KEYS.INSPECTOR_COLLAPSED, false)
  )
  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false)
  const [activeAdId, setActiveAdId] = useState<string | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)
  const [showNewAdConfirm, setShowNewAdConfirm] = useState(false)
  const [newAdTrigger, setNewAdTrigger] = useState(0)
  const [restoredChatHistory, setRestoredChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }> | null
  >(null)
  /** Current chat messages (lifted from ChatPanel) so we can include them when saving the ad. */
  const [currentChatMessages, setCurrentChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const [historyToast, setHistoryToast] = useState<{ message: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [variants, setVariants] = useState<(AdSpec | null)[]>([])
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [variantsPrompt, setVariantsPrompt] = useState('')
  const [clearInputTrigger, setClearInputTrigger] = useState(0)
  const newAdConfirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inspectorPushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null)
  /** Last AdSpec state saved to Projects (for "Saved" vs "Unsaved" indicator). */
  const lastSavedStateRef = useRef<AdSpec | null>(null)
  const [, setSaveVersion] = useState(0)
  const { items: ads, saveAd, updateItemThumbnail, updateItem, removeItem } = useAds()
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
    setProjectsDrawerOpen(false)
    setActiveAdId(null)
    setCurrentChatMessages([])
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

  const handleSaveToProjects = useCallback(
    (onAfterSave?: () => void) => {
      if (!adSpec) return
      const payload = adSpecToAdPayload(adSpec)
      payload.chatHistory = currentChatMessages ?? []
      let itemId: string
      if (activeAdId) {
        updateItem(activeAdId, payload)
        itemId = activeAdId
      } else {
        itemId = saveAd(payload)
        setActiveAdId(itemId)
      }
      lastSavedStateRef.current = adSpec
      setSaveVersion((v) => v + 1)
      captureAndUpdateThumbnail(itemId, onAfterSave)
    },
    [adSpec, activeAdId, currentChatMessages, saveAd, updateItem, captureAndUpdateThumbnail]
  )

  const handleSaveAndNew = useCallback(() => {
    handleSaveToProjects(doNewAd)
  }, [handleSaveToProjects, doNewAd])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSaveToProjects()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        handleRedo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo, handleSaveToProjects])

  const handleAdGenerated = useCallback(
    (
      spec: AdSpec,
      prompt: string,
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    ) => {
      setCurrentChatMessages(chatHistory)
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
      const id = saveAd(baseItem)
      setActiveAdId(id)
      lastSavedStateRef.current = spec
      setSaveVersion((v) => v + 1)
      captureAndUpdateThumbnail(id)
    },
    [saveAd, captureAndUpdateThumbnail]
  )

  const handleGenerateVariants = useCallback(
    async (prompt: string) => {
      setIsGeneratingVariants(true)
      setShowVariantsModal(true)
      setVariantsPrompt(prompt)
      setVariants([])
      try {
        const results = await generateVariants(prompt, activeBrand ?? undefined)
        setVariants(results)
      } finally {
        setIsGeneratingVariants(false)
      }
    },
    [activeBrand]
  )

  const handleSelectVariant = useCallback(
    (spec: AdSpec) => {
      push(spec)
      const styleLabel = VARIANT_STYLE_LABELS[spec.generation?.variantIndex ?? 0] ?? 'variant'
      const headline = spec.text?.headline?.value ?? '—'
      const bg = spec.colors?.background ?? '—'
      const headlineColor = spec.colors?.headlineColor ?? '—'
      const assistantMessage = `I generated this ${styleLabel} variant for you. Headline: ${headline}. Colors: ${bg} background, ${headlineColor} text. Feel free to ask me to refine anything.`
      const chatHistory = [
        { role: 'user' as const, content: variantsPrompt },
        { role: 'assistant' as const, content: assistantMessage },
      ]
      const payload = adSpecToAdPayload(spec)
      payload.prompt = variantsPrompt
      payload.chatHistory = chatHistory
      const id = saveAd(payload)
      setActiveAdId(id)
      lastSavedStateRef.current = spec
      setSaveVersion((v) => v + 1)
      captureAndUpdateThumbnail(id)
      setShowVariantsModal(false)
      setVariants([])
      setVariantsPrompt('')
      setClearInputTrigger((t) => t + 1)
      setHistoryToast({ message: 'Variant loaded in editor' })
    },
    [push, saveAd, captureAndUpdateThumbnail, variantsPrompt]
  )

  const handleVariantSelected = useCallback(
    (variant: AdSpec, prompt: string) => {
      const styleLabel = VARIANT_STYLE_LABELS[variant.generation?.variantIndex ?? 0] ?? 'variant'
      const headline = variant.text?.headline?.value ?? '—'
      const bg = variant.colors?.background ?? '—'
      const headlineColor = variant.colors?.headlineColor ?? '—'
      const assistantMessage = `I generated this ${styleLabel} variant for you. Headline: ${headline}. Colors: ${bg} background, ${headlineColor} text. Feel free to ask me to refine anything.`
      setRestoredChatHistory([
        { role: 'user', content: prompt },
        { role: 'assistant', content: assistantMessage },
      ])
    },
    []
  )

  const handleCloseVariantsModal = useCallback(() => {
    setShowVariantsModal(false)
    setVariants([])
    setVariantsPrompt('')
  }, [])

  const handleRetryVariant = useCallback(
    async (index: number) => {
      if (!variantsPrompt || index < 0 || index > 2) return
      const result = await generateSingleVariant(
        variantsPrompt,
        hasActiveBrand && activeBrand ? { name: activeBrand.name, tokens: activeBrand.tokens } : null,
        (index + 1) as 1 | 2 | 3
      )
      setVariants((prev) => {
        const next = [...prev]
        next[index] = result
        return next
      })
    },
    [variantsPrompt, hasActiveBrand, activeBrand]
  )

  useEffect(() => {
    return () => clearNewAdConfirmTimeout()
  }, [clearNewAdConfirmTimeout])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CHAT_COLLAPSED, String(chatCollapsed))
  }, [chatCollapsed])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INSPECTOR_COLLAPSED, String(inspectorCollapsed))
  }, [inspectorCollapsed])

  useEffect(() => {
    try {
      const pendingId = localStorage.getItem(STORAGE_KEYS.PENDING_LOAD)
      if (!pendingId) return
      localStorage.removeItem(STORAGE_KEYS.PENDING_LOAD)
      const item = ads.find((i) => i.id === pendingId)
      if (!item) return
      const spec = adToAdSpec(item)
      push(spec)
      setActiveAdId(item.id)
      lastSavedStateRef.current = spec
      setRestoredChatHistory(item.chatHistory ?? [])
      setHistoryToast({ message: 'Loaded from project' })
    } catch {
      // ignore
    }
  }, [ads, push])

  const toggleChat = useCallback(() => {
    setChatCollapsed((c) => !c)
  }, [])

  const toggleInspector = useCallback(() => {
    setInspectorCollapsed((c) => !c)
  }, [])

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden app-mobile-stack max-md:h-auto max-md:min-h-screen max-md:overflow-auto">
      <header className="h-11 flex-shrink-0 flex items-center px-4 gap-2 bg-white border-b border-[#e5e5e5]">
        <Link to="/" className="flex items-center gap-1.5 no-underline text-inherit">
          <span className="font-serif text-lg leading-none text-text-primary">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-text-primary flex-shrink-0" aria-hidden />
          <span className="font-sans text-lg leading-none text-text-primary">Studio</span>
        </Link>
        {showNewAdConfirm ? (
          <div className="flex items-center gap-2 py-0 px-1 text-[0.8rem]">
            <span className="font-sans text-[0.8rem] text-text-secondary">Unsaved changes</span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 py-1 px-2.5 text-[0.8rem] font-medium text-text-primary bg-transparent border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors duration-150"
              onClick={handleSaveAndNew}
            >
              Save Ad & New
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 py-1 px-2.5 text-[0.8rem] font-medium text-text-primary bg-transparent border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors duration-150"
              onClick={doNewAd}
            >
              Discard
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 py-1 px-2.5 text-[0.8rem] font-medium text-text-secondary bg-transparent border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors duration-150"
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
            className="inline-flex items-center gap-1.5 py-1.5 px-3 font-medium text-[13px] text-text-primary bg-transparent border border-[#e5e5e5] rounded cursor-pointer hover:bg-[#f5f5f5] transition-colors duration-150"
            onClick={handleNewAdClick}
            aria-label="New ad"
          >
            <span className="text-sm leading-none" aria-hidden>+</span>
            New Ad
          </button>
        )}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 p-0 text-[13px] text-text-primary bg-transparent border border-border rounded-sm cursor-pointer hover:bg-[#f5f5f5] hover:border-[#d5d5d5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Cmd+Z)"
        >
          <span className="text-sm leading-none" aria-hidden>↩</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 p-0 text-[13px] text-text-primary bg-transparent border border-border rounded-sm cursor-pointer hover:bg-[#f5f5f5] hover:border-[#d5d5d5] disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Cmd+Shift+Z)"
        >
          <span className="text-sm leading-none" aria-hidden>↪</span>
        </button>
        {adSpec && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] text-[#999] tabular-nums" aria-live="polite">
            {lastSavedStateRef.current != null &&
            JSON.stringify(adSpec) === JSON.stringify(lastSavedStateRef.current) ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" aria-hidden />
                Saved
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]" aria-hidden />
                Unsaved changes
              </>
            )}
          </span>
        )}
        <button
          type="button"
          className="relative flex items-center gap-1.5 h-8 px-3 font-medium text-[13px] text-text-primary bg-transparent border border-border rounded-sm cursor-pointer hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-colors duration-150"
          onClick={() => setBrandOpen((prev) => !prev)}
          aria-label={hasActiveBrand ? `${activeBrand?.name ?? 'Brand'} active — edit` : 'Open Brand Manager'}
          title={hasActiveBrand ? `◈ ${activeBrand?.name ?? 'Brand'} active` : 'Brand Manager'}
        >
          <span className="text-sm leading-none" aria-hidden>◈</span>
          Brand
          {hasActiveBrand && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#22c55e]" aria-hidden />}
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 h-8 px-3 font-medium text-[13px] text-text-primary bg-transparent border border-border rounded-sm cursor-pointer hover:bg-[#f5f5f5] hover:border-[#d5d5d5] transition-colors duration-150"
          onClick={() => setProjectsDrawerOpen((prev) => !prev)}
          aria-label="Open Projects"
        >
          <span className="text-sm leading-none" aria-hidden>⊞</span>
          Projects
          {ads.length > 0 && (
            <span className="min-w-[18px] h-[18px] py-0 px-1.5 text-[11px] font-medium leading-[18px] text-center text-white bg-text-primary rounded-[9px] tabular-nums" aria-label={`${ads.length} projects`}>
              {ads.length}
            </span>
          )}
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <span className="font-sans text-[13px] text-text-secondary tabular-nums" aria-label="Ad size">
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

      <div className="relative flex-1 min-h-0 flex flex-row overflow-hidden app-main-mobile max-md:flex-col">
        <div
          className={`flex-shrink-0 overflow-hidden transition-[width] duration-250 ease-out app-left-wrap-mobile max-md:border-t max-md:border-border ${
            chatCollapsed
              ? 'w-0 max-md:!w-0 max-md:!h-0 max-md:!min-h-0'
              : 'w-[300px] max-md:order-3 max-md:!w-full max-md:h-[300px]'
          }`}
        >
          <div
            className={`w-[300px] flex-shrink-0 h-full overflow-hidden p-0 m-0 border-r border-border flex flex-col bg-surface transition-transform duration-250 ease-out scrollbar-thin app-left-panel-mobile ${chatCollapsed ? '-translate-x-[300px]' : 'translate-x-0'} max-md:w-full max-md:border-r-0 max-md:[.app-left-wrap-mobile.w-0_&]:-translate-x-full`}
          >
            <ChatPanel
              promptInputRef={promptInputRef}
              currentSpec={adSpec}
              onSpecUpdate={push}
              onInitialGenerate={push}
              onAdGenerated={handleAdGenerated}
              onChatMessagesChange={setCurrentChatMessages}
              onGeneratingChange={setIsGenerating}
              restoredChatHistory={restoredChatHistory}
              onRestoredChatHistoryApplied={() => setRestoredChatHistory(null)}
              newAdTrigger={newAdTrigger}
              apiKey={apiKey}
              activeBrand={hasActiveBrand && activeBrand ? { name: activeBrand.name, tokens: activeBrand.tokens } : null}
              hasActiveBrand={hasActiveBrand}
              activeBrandName={activeBrand?.name ?? ''}
              onOpenBrandTokens={() => setBrandOpen(true)}
              isGenerating={isGeneratingVariants}
              onGenerateVariants={handleGenerateVariants}
              clearInputTrigger={clearInputTrigger}
            />
          </div>
        </div>

        <div className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-center bg-[#FAFAFA] overflow-hidden app-center-panel-mobile px-5 max-md:order-1 max-md:min-h-[40vh] max-md:py-8 max-md:px-6">
          <button
            type="button"
            className="absolute left-0 top-[60px] w-5 h-12 p-0 flex items-center justify-center text-sm text-text-primary bg-[#f5f5f5] border border-[#e5e5e5] border-l-0 rounded-r cursor-pointer hover:bg-[#ebebeb] hover:border-[#e0e0e0] focus:outline-none focus-visible:bg-[#ebebeb] focus-visible:border-border z-[1] transition-colors duration-200"
            onClick={toggleChat}
            aria-label={chatCollapsed ? 'Expand chat' : 'Collapse chat'}
            aria-expanded={!chatCollapsed}
          >
            {chatCollapsed ? '›' : '‹'}
          </button>
          {adSpec ? (
            <div className="relative w-fit max-w-full h-full flex flex-col items-center justify-center animate-fade-in [&_canvas]:!rounded-none app-canvas-wrapper-mobile max-md:h-auto">
              <AdCanvas
                spec={adSpec}
                width={728}
                height={90}
                isGenerating={isGenerating}
              />
              {historyToast && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 py-1.5 px-3 text-[0.75rem] font-sans text-white bg-ink rounded whitespace-nowrap animate-history-toast pointer-events-none" role="status">
                  {historyToast.message}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">Your ad will appear here</p>
          )}
          {adSpec && (
            <button
              type="button"
              className="absolute right-0 top-[60px] w-5 h-12 p-0 flex items-center justify-center text-sm text-text-primary bg-[#f5f5f5] border border-[#e5e5e5] border-r-0 rounded-l cursor-pointer hover:bg-[#ebebeb] hover:border-[#e0e0e0] focus:outline-none focus-visible:bg-[#ebebeb] focus-visible:border-border z-[1] transition-colors duration-200"
              onClick={toggleInspector}
              aria-label={inspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'}
              aria-expanded={!inspectorCollapsed}
            >
              {inspectorCollapsed ? '‹' : '›'}
            </button>
          )}
        </div>

        <AdsDrawer
          isOpen={projectsDrawerOpen}
          onClose={() => setProjectsDrawerOpen(false)}
          items={ads}
          onLoad={(item) => {
            const chatHistory = item.chatHistory ?? []
            setCurrentChatMessages(chatHistory)
            const spec = adToAdSpec(item)
            push(spec)
            setActiveAdId(item.id)
            lastSavedStateRef.current = spec
            setRestoredChatHistory(chatHistory)
            setProjectsDrawerOpen(false)
          }}
          onRemove={(id) => {
            if (id === activeAdId) {
              clearHistory()
              setActiveAdId(null)
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
        <VariantsModal
          isOpen={showVariantsModal}
          onClose={handleCloseVariantsModal}
          prompt={variantsPrompt}
          variants={variants}
          isGenerating={isGeneratingVariants}
          onSelectVariant={handleSelectVariant}
          onVariantSelected={handleVariantSelected}
          onRetryVariant={handleRetryVariant}
        />
        {adSpec && (
          <div
            className={`flex-shrink-0 overflow-hidden transition-[width] duration-250 ease-out app-right-wrap-mobile max-md:border-l-0 max-md:border-t max-md:border-border ${
              inspectorCollapsed
                ? 'w-0 max-md:!w-0 max-md:!h-0 max-md:!min-h-0'
                : 'w-[280px] max-md:order-2 max-md:!w-full max-md:min-h-[40vh]'
            }`}
          >
            <div
              className={`w-[280px] flex-shrink-0 h-full overflow-y-auto overflow-x-hidden py-8 px-5 border-l border-border bg-surface transition-transform duration-250 ease-out scrollbar-thin app-right-panel-mobile ${inspectorCollapsed ? 'translate-x-[280px]' : 'translate-x-0'} max-md:w-full max-md:[.app-right-wrap-mobile.w-0_&]:translate-x-full`}
            >
              <p className="font-sans text-[10px] font-medium tracking-widest uppercase text-text-secondary mb-5">INSPECTOR</p>
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
