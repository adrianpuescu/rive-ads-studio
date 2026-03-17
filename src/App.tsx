import { useState, useCallback, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ChatPanel } from './components/ChatPanel'
import { SpecInspector } from './components/SpecInspector'
import { AppHeader, AppCenterPanel, AppLeftPanel, AppRightPanel, AppOverlays } from './components/App'
import { useAds, generateShareToken, type Ad } from './hooks/useAds'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
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
import { DEFAULT_FORMAT } from './constants/adFormats'

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
    setCurrentFormat,
    formatDropdownOpen,
    formatDropdownRef,
    restoreFormatFromSpec,
    selectFormat,
    toggleDropdown,
  } = useFormatSelector()

  const [projectsDrawerOpen, setProjectsDrawerOpen] = useState(false)
  const [activeAdId, setActiveAdId] = useState<string | null>(null)
  const [brandOpen, setBrandOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false)
  const { user, signOut } = useAuth()
  const { profile } = useProfile(user?.id)

  const handleSignOut = useCallback(async () => {
    await signOut()
    navigate('/login')
  }, [signOut, navigate])

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
  const { items: ads, saveAd, updateItemThumbnail, updateItem, removeItem, renameItem, duplicateItem } = useAds()
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

  const currentProjectName = activeAdId
    ? (ads.find((a) => a.id === activeAdId)?.headline || 'Untitled')
    : null

  const handleProjectNameChange = useCallback(
    async (newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed || !activeAdId) return
      await renameItem(activeAdId, trimmed)
      if (adSpec) {
        replacePresent({ ...adSpec, name: trimmed })
      }
    },
    [activeAdId, renameItem, adSpec, replacePresent]
  )

  const handleShare = useCallback(async () => {
    if (!activeAdId || !user) return
    setIsGeneratingShareLink(true)
    try {
      const token = await generateShareToken(activeAdId, user.id)
      if (token) {
        const url = `https://riveads.webz.ro/preview/${token}`
        setShareUrl(url)
        setShareModalOpen(true)
      }
    } catch (err) {
      console.error('[handleShare] error:', err)
    } finally {
      setIsGeneratingShareLink(false)
    }
  }, [activeAdId, user])

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
    setActiveBrand(null)
    setCurrentFormat(DEFAULT_FORMAT)
    setNewAdTrigger((t) => t + 1)
    setTimeout(() => promptInputRef.current?.focus(), 100)
  }, [clearHistory, clearSavedState, setActiveBrand, setCurrentFormat])

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
      // Preserve the project name if it was renamed independently of the adSpec headline
      if (activeAdId) {
        const currentAd = ads.find((a) => a.id === activeAdId)
        if (currentAd?.headline) payload.headline = currentAd.headline
      }
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
      <AppHeader
        showNewAdConfirm={showNewAdConfirm}
        onSaveAndNew={handleSaveAndNew}
        onDiscard={handleDiscard}
        onCancelConfirm={cancelConfirm}
        onNewAdClick={handleNewAdClick}
        onUndo={handleUndo}
        canUndo={canUndo}
        onRedo={handleRedo}
        canRedo={canRedo}
        adSpec={adSpec}
        saveStatus={saveStatus}
        projectsDrawerOpen={projectsDrawerOpen}
        onCloseProjects={() => setProjectsDrawerOpen(false)}
        onOpenProjects={handleOpenProjects}
        adsCount={ads.length}
        currentFormat={currentFormat}
        formatDropdownOpen={formatDropdownOpen}
        formatDropdownRef={formatDropdownRef}
        onToggleFormatDropdown={toggleDropdown}
        onSelectFormat={selectFormat}
        replacePresent={replacePresent}
        activeAdId={activeAdId}
        onShare={handleShare}
        isGeneratingShareLink={isGeneratingShareLink}
        user={user}
        displayName={profile?.displayName ?? null}
        onSignOut={handleSignOut}
      />

      <div className="relative flex-1 min-h-0 flex flex-row overflow-hidden app-main-mobile max-md:flex-col">
        <AppLeftPanel chatCollapsed={chatCollapsed}>
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
        </AppLeftPanel>

        <AppCenterPanel
          chatCollapsed={chatCollapsed}
          onToggleChat={toggleChat}
          projectsDrawerOpen={projectsDrawerOpen}
          brandOpen={brandOpen}
          adSpec={adSpec}
          currentFormat={currentFormat}
          isGenerating={isGenerating}
          historyToast={historyToast}
          inspectorCollapsed={inspectorCollapsed}
          onToggleInspector={toggleInspector}
        />

        <AppOverlays
          projectsDrawerOpen={projectsDrawerOpen}
          onCloseProjects={() => setProjectsDrawerOpen(false)}
          ads={ads}
          onLoadAd={(item) => {
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
          onRemoveAd={(id) => {
            if (id === activeAdId) {
              clearHistory()
              setActiveAdId(null)
              clearSavedState()
              setRestoredChatHistory(null)
              setNewAdTrigger((t) => t + 1)
            }
            removeItem(id)
          }}
          onRenameAd={renameItem}
          onDuplicateAd={duplicateItem}
          brandOpen={brandOpen}
          onCloseBrands={() => setBrandOpen(false)}
          brands={brands}
          brandsLoading={brandsLoading}
          activeBrandId={activeBrandId}
          onAddBrand={addBrand}
          onUpdateBrand={updateBrand}
          onDeleteBrand={deleteBrand}
          onSetActiveBrand={setActiveBrand}
          showVariantsModal={showVariantsModal}
          onCloseVariantsModal={handleCloseVariantsModal}
          variantsPrompt={variantsPrompt}
          variants={variants}
          isGeneratingVariants={isGeneratingVariants}
          onSelectVariant={handleSelectVariant}
          onVariantSelected={handleVariantSelected}
          onRetryVariant={handleRetryVariant}
          shareModalOpen={shareModalOpen}
          onCloseShareModal={() => setShareModalOpen(false)}
          shareUrl={shareUrl}
          projectName={currentProjectName || 'Untitled'}
        />

        {adSpec && (
          <AppRightPanel inspectorCollapsed={inspectorCollapsed}>
            <SpecInspector
              spec={adSpec}
              onChange={handleInspectorChange}
              projectName={currentProjectName}
              onProjectNameChange={handleProjectNameChange}
            />
          </AppRightPanel>
        )}
      </div>
    </div>
  )
}

export default App
