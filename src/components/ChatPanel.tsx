/**
 * ChatPanel Component
 *
 * Conversational AI chat for iterative ad refinement.
 * Initial state: describe ad + Generate. After first generation: chat with refinement.
 */

import { useState, useRef, useEffect } from 'react'
import type { AdSpec } from '../types/ad-spec.schema'
import type { ActiveBrandForPrompt } from '../ai/specGenerator'
import type { ChatMessage } from '../types/chat'
import { generateAdSpec } from '../ai/specGenerator'
import { refineAdSpec } from '../ai/chatRefinement'
import { ChatInitialView } from './ChatInitialView'
import { ChatConversationView } from './ChatConversationView'

export interface ChatPanelProps {
  currentSpec: AdSpec | null
  onSpecUpdate: (spec: AdSpec) => void
  onInitialGenerate: (spec: AdSpec) => void
  /** Called when a new ad is generated (for Projects). Receives spec, prompt, and current chat history. */
  onAdGenerated?: (
    spec: AdSpec,
    prompt: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => void
  /** Called whenever messages change so parent can persist them on save. */
  onChatMessagesChange?: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void
  /** Set to true immediately before Claude API fetch, false in finally. Used only for overlay; not tied to SpecInspector. */
  onGeneratingChange?: (value: boolean) => void
  /** When set, replaces messages with this history and shows "Loaded from project" separator. Cleared via onRestoredChatHistoryApplied. */
  restoredChatHistory?: Array<{ role: 'user' | 'assistant'; content: string }> | null
  /** Called after applying restoredChatHistory so parent can clear it. */
  onRestoredChatHistoryApplied?: () => void
  /** When this value changes, chat messages are cleared (e.g. New Ad). */
  newAdTrigger?: number
  /** Ref for the initial prompt textarea so parent can focus it (e.g. after New Ad). */
  promptInputRef?: React.RefObject<HTMLTextAreaElement | null>
  apiKey: string
  /** Active brand for AI prompt injection (name + tokens). */
  activeBrand?: ActiveBrandForPrompt | null
  /** Whether an active brand is enabled (for showing chip). */
  hasActiveBrand?: boolean
  /** Active brand name for chip label. */
  activeBrandName?: string
  /** Callback when user clicks the brand button to open panel. */
  onOpenBrandTokens?: () => void
  /** When true, disable Generate Variants (e.g. while generating variants). */
  isGenerating?: boolean
  /** Called when user clicks Generate Variants with the current prompt. */
  onGenerateVariants?: (prompt: string) => void
  /** When this value increments, the input is cleared (e.g. after variant selected). */
  clearInputTrigger?: number
}

function nextId(): string {
  return crypto.randomUUID()
}

export function ChatPanel({
  currentSpec,
  onSpecUpdate,
  onInitialGenerate,
  onAdGenerated,
  onChatMessagesChange,
  onGeneratingChange,
  restoredChatHistory = null,
  onRestoredChatHistoryApplied,
  newAdTrigger = 0,
  promptInputRef,
  apiKey,
  activeBrand = null,
  hasActiveBrand = false,
  activeBrandName = '',
  onOpenBrandTokens,
  isGenerating = false,
  onGenerateVariants,
  clearInputTrigger = 0,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (newAdTrigger > 0) {
      setMessages([])
    }
  }, [newAdTrigger])

  useEffect(() => {
    if (restoredChatHistory && restoredChatHistory.length >= 0) {
      const asMessages: ChatMessage[] = restoredChatHistory.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
        timestamp: new Date(),
      }))
      setMessages(asMessages)
      onChatMessagesChange?.(restoredChatHistory)
      onRestoredChatHistoryApplied?.()
    }
  }, [restoredChatHistory])

  useEffect(() => {
    if (clearInputTrigger > 0) {
      setInputValue('')
    }
  }, [clearInputTrigger])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleInitialGenerate = async () => {
    const prompt = inputValue.trim()
    if (!prompt) return

    onGeneratingChange?.(true)
    setIsLoading(true)
    setError(null)

    try {
      const result = await generateAdSpec({ prompt, activeBrand })
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      }
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: result.spec.generation?.rationale ?? 'Ad generated.',
        specSnapshot: result.spec,
        timestamp: new Date(),
      }
      const history = [
        { role: 'user' as const, content: prompt },
        { role: 'assistant' as const, content: result.spec.generation?.rationale ?? 'Ad generated.' },
      ]
      setMessages([userMsg, assistantMsg])
      onChatMessagesChange?.(history)
      setInputValue('')
      onInitialGenerate(result.spec)
      onAdGenerated?.(result.spec, prompt, history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate')
    } finally {
      setIsLoading(false)
      onGeneratingChange?.(false)
    }
  }

  const handleRefine = async () => {
    const text = inputValue.trim()
    if (!text || !currentSpec) return

    onGeneratingChange?.(true)
    setIsLoading(true)
    setError(null)

    try {
      const { updatedSpec, explanation } = await refineAdSpec(
        currentSpec,
        messages,
        text,
        apiKey,
        activeBrand
      )
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      }
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: explanation,
        specSnapshot: updatedSpec,
        timestamp: new Date(),
      }
      const newHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: explanation },
      ]
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      onChatMessagesChange?.(newHistory)
      setInputValue('')
      onSpecUpdate(updatedSpec)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refinement failed')
    } finally {
      setIsLoading(false)
      onGeneratingChange?.(false)
    }
  }

  const handleSubmit = () => {
    if (messages.length === 0) {
      handleInitialGenerate()
    } else {
      handleRefine()
    }
  }

  const isInitial = currentSpec === null && messages.length === 0
  const canSubmit =
    isInitial
      ? inputValue.trim().length > 0 && !isLoading
      : inputValue.trim().length > 0 && !isLoading && currentSpec !== null

  const isCreationMode = currentSpec === null

  if (isInitial) {
    return (
      <ChatInitialView
        inputValue={inputValue}
        onInputChange={setInputValue}
        promptInputRef={promptInputRef}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        showBrandButton={isCreationMode && !!onOpenBrandTokens}
        hasActiveBrand={hasActiveBrand}
        activeBrandName={activeBrandName}
        activeBrand={activeBrand}
        onOpenBrandTokens={onOpenBrandTokens}
        isGeneratingVariants={isGenerating}
        onGenerateVariants={onGenerateVariants}
        error={error}
      />
    )
  }

  return (
    <ChatConversationView
      messages={messages}
      messagesContainerRef={messagesContainerRef}
      messagesEndRef={messagesEndRef}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      canSubmit={canSubmit}
      error={error}
    />
  )
}
