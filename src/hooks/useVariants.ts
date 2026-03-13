import { useState, useCallback } from 'react'
import { generateVariants, generateSingleVariant, VARIANT_STYLE_LABELS } from '../ai/specGenerator'
import { adSpecToAdPayload } from '../lib/adSpecPayload'
import type { AdSpec } from '../types/ad-spec.schema'
import type { BrandTokens } from './useBrandTokens'

interface UseVariantsOptions {
  activeBrand: { name: string; tokens: BrandTokens } | null
  hasActiveBrand: boolean
  currentFormatId: string
  push: (spec: AdSpec) => void
  saveAd: (payload: ReturnType<typeof adSpecToAdPayload>) => Promise<string>
  markAsSaved: (spec: AdSpec) => void
  captureAndUpdateThumbnail: (itemId: string, onDone?: () => void) => void
  showToast: (message: string) => void
  setActiveAdId: (id: string) => void
  setRestoredChatHistory: (history: Array<{ role: 'user' | 'assistant'; content: string }>) => void
}

export function useVariants({
  activeBrand,
  hasActiveBrand,
  currentFormatId,
  push,
  saveAd,
  markAsSaved,
  captureAndUpdateThumbnail,
  showToast,
  setActiveAdId,
  setRestoredChatHistory,
}: UseVariantsOptions) {
  const [variants, setVariants] = useState<(AdSpec | null)[]>([])
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [variantsPrompt, setVariantsPrompt] = useState('')
  const [clearInputTrigger, setClearInputTrigger] = useState(0)

  const handleGenerateVariants = useCallback(
    async (prompt: string) => {
      setIsGeneratingVariants(true)
      setShowVariantsModal(true)
      setVariantsPrompt(prompt)
      setVariants([])
      try {
        const results = await generateVariants(
          prompt,
          hasActiveBrand && activeBrand ? { name: activeBrand.name, tokens: activeBrand.tokens } : undefined
        )
        setVariants(results)
      } finally {
        setIsGeneratingVariants(false)
      }
    },
    [activeBrand, hasActiveBrand]
  )

  const handleSelectVariant = useCallback(
    async (spec: AdSpec) => {
      const specWithFormat = { ...spec, formatId: currentFormatId }
      push(specWithFormat)
      const styleLabel = VARIANT_STYLE_LABELS[spec.generation?.variantIndex ?? 0] ?? 'variant'
      const headline = spec.text?.headline?.value ?? '—'
      const bg = spec.colors?.background ?? '—'
      const headlineColor = spec.colors?.headlineColor ?? '—'
      const assistantMessage = `I generated this ${styleLabel} variant for you. Headline: ${headline}. Colors: ${bg} background, ${headlineColor} text. Feel free to ask me to refine anything.`
      const chatHistory = [
        { role: 'user' as const, content: variantsPrompt },
        { role: 'assistant' as const, content: assistantMessage },
      ]
      const payload = adSpecToAdPayload(specWithFormat)
      payload.prompt = variantsPrompt
      payload.chatHistory = chatHistory
      try {
        const id = await saveAd(payload)
        setActiveAdId(id)
        markAsSaved(specWithFormat)
        captureAndUpdateThumbnail(id)
        setShowVariantsModal(false)
        setVariants([])
        setVariantsPrompt('')
        setClearInputTrigger((t) => t + 1)
        showToast('Variant loaded in editor')
      } catch (err) {
        console.error('[handleSelectVariant] Save failed:', err)
      }
    },
    [push, saveAd, captureAndUpdateThumbnail, variantsPrompt, markAsSaved, currentFormatId, showToast, setActiveAdId]
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
    [setRestoredChatHistory]
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

  return {
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
  }
}
