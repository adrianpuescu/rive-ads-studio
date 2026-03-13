import { useState, useCallback, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Undo2, Redo2, LayoutGrid, ChevronDown } from 'lucide-react'
import { ChatPanel } from './components/ChatPanel'
import { AdCanvas } from './components/AdCanvas'
import { ExportButton } from './components/ExportButton'
import { SpecInspector } from './components/SpecInspector'
import { AdsDrawer } from './components/AdsDrawer'
import { BrandTokensPanel } from './components/BrandTokensPanel'
import { VariantsModal } from './components/VariantsModal'
import { useAds, type Ad } from './hooks/useAds'
import { useBrandTokens } from './hooks/useBrandTokens'
import { useAdHistory } from './hooks/useAdHistory'
import { useSaveIndicator } from './hooks/useSaveIndicator'
import { useUnsavedChanges } from './hooks/useUnsavedChanges'
import { useHistoryToast } from './hooks/useHistoryToast'
import { usePanelCollapse } from './hooks/usePanelCollapse'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useFormatSelector } from './hooks/useFormatSelector'
import { useVariants } from './hooks/useVariants'
import { adToAdSpec, adSpecToAdPayload } from './lib/adSpecPayload'
import type { AdSpec } from './types/ad-spec.schema'
import { STORAGE_KEYS } from './constants/storageKeys'
import { AD_FORMATS } from './constants/adFormats'

const INSPECTOR_PUSH_DEBOUNCE_MS = 600

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
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

  const { historyToast, showToast } = useHistoryToast()
  const {
    chatCollapsed,
    setChatCollapsed,
    inspectorCollapsed,
    toggleChat,
    toggleInspector,
  } = usePanelCollapse()
  const {
    currentFormat,
    formatDropdownOpen,
    formatDropdownRef,
    restoreFormatFromSpec,
    selectFormat,
    toggleDropdown,
  } = useFormatSelector()

  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false)
  const [activeAdId, setActiveAdId] = useState<string | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)

  const handleOpenProjects = useCallback(() => {
    setBrandOpen(false)
    setProjectsDrawerOpen(true)
  }, [])

  const handleOpenBrands = useCallback(() => {
    setProjectsDrawerOpen(false)
    setBrandOpen(true)
  }, [])

  useEffect(() => {
    if (searchParams.get('openBrands') === 'true') {
      setTimeout(() => handleOpenBrands(), 100)
    }
  }, [])

  const [newAdTrigger, setNewAdTrigger] = useState(0)
  const [restoredChatHistory, setRestoredChatHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }> | null
  >(null)
  const [currentChatMessages, setCurrentChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const [isGenerating, setIsGenerating] = useState(false)
  const inspectorPushDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null)
  const { items: ads, saveAd, updateItemThumbnail, updateItem, removeItem } = useAds()
  const {
    brands,
    activeBrandId,
    activeBrand,
    hasActiveBrand,
    loading: brandsLoading,
    addBrand,
    updateBrand,
    deleteBrand,
    setActiveBrand,
  } = useBrandTokens()

  const { saveStatus, markAsSaved, clearSavedState } = useSaveIndicator(adSpec)

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

  const {
    variants,
    isGeneratingVariants,
    showVariantsModal,
    variantsPrompt,
    clearInputTrigger,
    handleGenerateVariants,
    handleSelectVariant,
    handleVariantSelected,
    handleCloseVariantsModal,
    handleRetryVariant,
  } = useVariants({
    activeBrand: hasActiveBrand && activeBrand ? { name: activeBrand.name, tokens: activeBrand.tokens } : null,
    hasActiveBrand,
    currentFormatId: currentFormat.id,
    push,
    saveAd,
    markAsSaved,
    captureAndUpdateThumbnail,
    showToast,
    setActiveAdId,
    setRestoredChatHistory,
  })

  const doNewAd = useCallback(() => {
    if (inspectorPushDebounceRef.current) {
      clearTimeout(inspectorPushDebounceRef.current)
      inspectorPushDebounceRef.current = null
    }
    setChatCollapsed(false)
    setProjectsDrawerOpen(false)
    setActiveAdId(null)
    setCurrentChatMessages([])
    clearSavedState()
    clearHistory()
    setNewAdTrigger((t) => t + 1)
    setTimeout(() => promptInputRef.current?.focus(), 100)
  }, [clearHistory, clearSavedState])

  const handleUndo = useCallback(() => {
    if (!canUndo) return
    if (inspectorPushDebounceRef.current) {
      clearTimeout(inspectorPushDebounceRef.current)
      inspectorPushDebounceRef.current = null
    }
    undo()
    showToast('↩ Reverted to previous version')
  }, [canUndo, undo, showToast])

  const handleRedo = useCallback(() => {
    if (!canRedo) return
    if (inspectorPushDebounceRef.current) {
      clearTimeout(inspectorPushDebounceRef.current)
      inspectorPushDebounceRef.current = null
    }
    redo()
    showToast('↪ Restored next version')
  }, [canRedo, redo, showToast])

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

  const handleSaveToProjects = useCallback(
    async (onAfterSave?: () => void) => {
      if (!adSpec) return
      const specWithFormat = { ...adSpec, formatId: currentFormat.id }
      const payload = adSpecToAdPayload(specWithFormat)
      payload.chatHistory = currentChatMessages ?? []
      let itemId: string
      try {
        if (activeAdId) {
          await updateItem(activeAdId, payload)
          itemId = activeAdId
        } else {
          itemId = await saveAd(payload)
          setActiveAdId(itemId)
        }
        markAsSaved(specWithFormat)
        captureAndUpdateThumbnail(itemId, onAfterSave)
      } catch (err) {
        console.error('[handleSaveToProjects] Save failed:', err)
      }
    },
    [adSpec, activeAdId, currentChatMessages, saveAd, updateItem, captureAndUpdateThumbnail, markAsSaved, currentFormat.id]
  )

  const {
    showNewAdConfirm,
    handleNewAdClick,
    handleSaveAndNew,
    handleDiscard,
    cancelConfirm,
  } = useUnsavedChanges({
    adSpec,
    saveStatus,
    onNewAd: doNewAd,
    onSaveAndNew: () => handleSaveToProjects(doNewAd),
  })

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSaveToProjects,
  })

  const handleAdGenerated = useCallback(
    async (
      spec: AdSpec,
      prompt: string,
      chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    ) => {
      setCurrentChatMessages(chatHistory)
      const specWithFormat = { ...spec, formatId: currentFormat.id }
      const baseItem = {
        adSpec: specWithFormat,
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
      try {
        const id = await saveAd(baseItem)
        setActiveAdId(id)
        markAsSaved(specWithFormat)
        captureAndUpdateThumbnail(id)
      } catch (err) {
        console.error('[handleAdGenerated] Save failed:', err)
      }
    },
    [saveAd, captureAndUpdateThumbnail, markAsSaved, currentFormat.id]
  )

  // Instant load when navigating from Projects page with state (no wait for ads)
  useEffect(() => {
    const item = (location.state as { pendingLoadItem?: Ad } | null)?.pendingLoadItem
    if (!item) return
    try {
      localStorage.removeItem(STORAGE_KEYS.PENDING_LOAD)
    } catch {
      // ignore
    }
    const spec = item.adSpec ?? adToAdSpec(item)
    push(spec)
    setActiveAdId(item.id)
    markAsSaved(spec)
    restoreFormatFromSpec(spec)
    setRestoredChatHistory(item.chatHistory ?? [])
    showToast('Loaded from project')
    navigate(location.pathname, { replace: true })
  }, [location.state, location.pathname, push, navigate, markAsSaved, restoreFormatFromSpec, showToast])

  // Fallback: load by id from localStorage when ads list is ready (e.g. after refresh)
  useEffect(() => {
    try {
      const pendingId = localStorage.getItem(STORAGE_KEYS.PENDING_LOAD)
      if (!pendingId) return
      const item = ads.find((i) => i.id === pendingId)
      if (!item) return
      localStorage.removeItem(STORAGE_KEYS.PENDING_LOAD)
      const spec = item.adSpec ?? adToAdSpec(item)
      push(spec)
      setActiveAdId(item.id)
      markAsSaved(spec)
      restoreFormatFromSpec(spec)
      setRestoredChatHistory(item.chatHistory ?? [])
      showToast('Loaded from project')
    } catch {
      // ignore
    }
  }, [ads, push, markAsSaved, restoreFormatFromSpec, showToast])

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden app-mobile-stack max-md:h-auto max-md:min-h-screen max-md:overflow-auto">
      <header className="h-11 flex-shrink-0 flex items-center px-4 gap-2 bg-white border-b border-gray-200">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 no-underline text-inherit mr-1"
        >
          <span className="font-serif text-sm font-semibold leading-none text-gray-900">RiveAds</span>
          <span className="w-1 h-1 rounded-full bg-gray-900 flex-shrink-0" aria-hidden />
          <span className="font-sans text-sm font-semibold leading-none text-gray-900">Studio</span>
        </Link>

        <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

        {showNewAdConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Unsaved changes</span>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
              onClick={handleSaveAndNew}
            >
              Save & New
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
              onClick={handleDiscard}
            >
              Discard
            </button>
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1 cursor-pointer bg-transparent border-0 transition-colors duration-150"
              onClick={cancelConfirm}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
            onClick={handleNewAdClick}
            aria-label="New ad"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden />
            New Ad
          </button>
        )}

        <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 p-0 border border-gray-200 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150"
          onClick={handleUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 p-0 border border-gray-200 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150"
          onClick={handleRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" aria-hidden />
        </button>
        {adSpec && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 tabular-nums" aria-live="polite">
            {saveStatus === 'saved' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" aria-hidden />
                Saved
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" aria-hidden />
                Unsaved
              </>
            )}
          </span>
        )}

        <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
          onClick={() => (projectsDrawerOpen ? setProjectsDrawerOpen(false) : handleOpenProjects())}
          aria-label="Open Projects"
        >
          <LayoutGrid className="w-3.5 h-3.5" aria-hidden />
          Projects
          {ads.length > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 text-[11px] font-medium leading-[18px] text-center text-white bg-gray-900 rounded-full tabular-nums" aria-label={`${ads.length} projects`}>
              {ads.length}
            </span>
          )}
        </button>

        <div className="flex-1" />

        <div className="relative" ref={formatDropdownRef}>
          <button
            type="button"
            className="relative text-sm py-1.5 pl-3 pr-7 border border-gray-200 rounded bg-white text-gray-700 cursor-pointer inline-flex items-center gap-2 hover:bg-gray-50 focus:outline-none transition-colors duration-150 min-h-[32px] tabular-nums"
            onClick={toggleDropdown}
            aria-haspopup="listbox"
            aria-expanded={formatDropdownOpen}
            aria-label="Ad size"
          >
            {currentFormat.label}
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" aria-hidden />
          </button>
          {formatDropdownOpen && (
            <ul
              className="absolute top-[calc(100%+4px)] right-0 min-w-full m-0 p-1 list-none bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto"
              role="listbox"
              aria-label="Ad size"
            >
              {AD_FORMATS.map((format) => (
                <li key={format.id} role="option" aria-selected={currentFormat.id === format.id}>
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full py-1.5 px-3 text-sm text-gray-700 bg-transparent border-0 rounded cursor-pointer text-left hover:bg-gray-50 transition-colors duration-150 tabular-nums whitespace-nowrap"
                    onClick={() => {
                      selectFormat(format)
                      if (adSpec) {
                        const updatedSpec = {
                          ...adSpec,
                          formatId: format.id,
                          template: {
                            ...adSpec.template,
                            id: format.id,
                            artboard: format.artboard,
                          },
                        }
                        replacePresent(updatedSpec)
                      }
                    }}
                  >
                    {currentFormat.id === format.id && (
                      <span className="w-4 text-xs font-semibold text-gray-900 flex-shrink-0" aria-hidden>✓</span>
                    )}
                    {currentFormat.id !== format.id && <span className="w-4 flex-shrink-0" />}
                    {format.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

        {adSpec && (
          <ExportButton
            spec={adSpec}
            rivFileName={currentFormat.riveFile}
          />
        )}
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
              onOpenBrandTokens={handleOpenBrands}
              isGenerating={isGeneratingVariants}
              onGenerateVariants={handleGenerateVariants}
              clearInputTrigger={clearInputTrigger}
            />
          </div>
        </div>

        <div className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-center bg-[#FAFAFA] overflow-hidden app-center-panel-mobile px-5 max-md:order-1 max-md:min-h-[40vh] max-md:py-8 max-md:px-6">
          <button
            type="button"
            className={`absolute left-0 top-[60px] w-5 h-12 p-0 flex items-center justify-center text-sm text-text-primary bg-[#f5f5f5] border border-[#e5e5e5] border-l-0 rounded-r cursor-pointer hover:bg-[#ebebeb] hover:border-[#e0e0e0] focus:outline-none focus-visible:bg-[#ebebeb] focus-visible:border-border z-[1] transition-colors duration-200 transition-opacity duration-150 ease-out ${projectsDrawerOpen || brandOpen ? 'opacity-0 pointer-events-none' : ''}`}
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
                width={currentFormat.width}
                height={currentFormat.height}
                riveFile={currentFormat.riveFile}
                artboard={currentFormat.artboard}
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
              className="absolute right-0 top-[60px] w-5 h-12 p-0 flex items-center justify-center text-sm text-text-primary bg-[#f5f5f5] border border-[#e5e5e5] border-r-0 rounded-l cursor-pointer hover:bg-[#ebebeb] hover:border-[#e0e0e0] focus:outline-none focus-visible:bg-[#ebebeb] focus-visible:border-border z-[1] transition-colors duration-200 transition-opacity duration-150 ease-out"
              onClick={toggleInspector}
              aria-label={inspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'}
              aria-expanded={!inspectorCollapsed}
            >
              {inspectorCollapsed ? '‹' : '›'}
            </button>
          )}
        </div>

        {projectsDrawerOpen && (
          <button
            type="button"
            className="absolute inset-0 z-[19] cursor-default border-0 p-0 m-0 bg-transparent"
            onClick={() => setProjectsDrawerOpen(false)}
            aria-label="Close Projects"
          />
        )}
        <AdsDrawer
          isOpen={projectsDrawerOpen}
          onClose={() => setProjectsDrawerOpen(false)}
          items={ads}
          onLoad={(item) => {
            const chatHistory = item.chatHistory ?? []
            setCurrentChatMessages(chatHistory)
            const spec = item.adSpec ?? adToAdSpec(item)
            push(spec)
            setActiveAdId(item.id)
            markAsSaved(spec)
            restoreFormatFromSpec(spec)
            setRestoredChatHistory(chatHistory)
            setProjectsDrawerOpen(false)
          }}
          onRemove={(id) => {
            if (id === activeAdId) {
              clearHistory()
              setActiveAdId(null)
              clearSavedState()
              setRestoredChatHistory(null)
              setNewAdTrigger((t) => t + 1)
            }
            removeItem(id)
          }}
        />
        {brandOpen && (
          <button
            type="button"
            className="absolute inset-0 z-[24] cursor-default border-0 p-0 m-0 bg-transparent"
            onClick={() => setBrandOpen(false)}
            aria-label="Close Brands"
          />
        )}
        <BrandTokensPanel
          isOpen={brandOpen}
          onClose={() => setBrandOpen(false)}
          brands={brands}
          isLoading={brandsLoading}
          activeBrandId={activeBrandId}
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
              className={`w-[280px] flex-shrink-0 h-full overflow-y-auto overflow-x-hidden py-6 px-5 border-l border-border bg-surface transition-transform duration-250 ease-out scrollbar-thin app-right-panel-mobile ${inspectorCollapsed ? 'translate-x-[280px]' : 'translate-x-0'} max-md:w-full max-md:[.app-right-wrap-mobile.w-0_&]:translate-x-full`}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5 mt-0">Inspector</p>
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
