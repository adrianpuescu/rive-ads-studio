/**
 * ChatPanel Component
 *
 * Conversational AI chat for iterative ad refinement.
 * Initial state: describe ad + Generate. After first generation: chat with refinement.
 */

import { useState, useRef, useEffect } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';
import type { ActiveBrandForPrompt } from '../ai/specGenerator';
import type { ChatMessage } from '../types/chat';
import { generateAdSpec } from '../ai/specGenerator';
import { refineAdSpec } from '../ai/chatRefinement';

export interface ChatPanelProps {
  currentSpec: AdSpec | null;
  onSpecUpdate: (spec: AdSpec) => void;
  onInitialGenerate: (spec: AdSpec) => void;
  /** Called when a new ad is generated (for Projects). Receives spec, prompt, and current chat history. */
  onAdGenerated?: (
    spec: AdSpec,
    prompt: string,
    chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) => void;
  /** Set to true immediately before Claude API fetch, false in finally. Used only for overlay; not tied to SpecInspector. */
  onGeneratingChange?: (value: boolean) => void;
  /** When set, replaces messages with this history and shows "Loaded from project" separator. Cleared via onRestoredChatHistoryApplied. */
  restoredChatHistory?: Array<{ role: 'user' | 'assistant'; content: string }> | null;
  /** Called after applying restoredChatHistory so parent can clear it. */
  onRestoredChatHistoryApplied?: () => void;
  /** When this value changes, chat messages are cleared (e.g. New Ad). */
  newAdTrigger?: number;
  /** Ref for the initial prompt textarea so parent can focus it (e.g. after New Ad). */
  promptInputRef?: React.RefObject<HTMLTextAreaElement | null>;
  apiKey: string;
  /** Active brand for AI prompt injection (name + tokens). */
  activeBrand?: ActiveBrandForPrompt | null;
  /** Whether an active brand is enabled (for showing chip). */
  hasActiveBrand?: boolean;
  /** Active brand name for chip label. */
  activeBrandName?: string;
  /** Callback when user clicks the brand chip to open panel. */
  onOpenBrandTokens?: () => void;
}

function nextId(): string {
  return crypto.randomUUID();
}

export function ChatPanel({
  currentSpec,
  onSpecUpdate,
  onInitialGenerate,
  onAdGenerated,
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
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoadedFromLibrarySeparator, setShowLoadedFromLibrarySeparator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newAdTrigger > 0) {
      setMessages([]);
      setShowLoadedFromLibrarySeparator(false);
    }
  }, [newAdTrigger]);

  useEffect(() => {
    if (restoredChatHistory && restoredChatHistory.length >= 0) {
      const asMessages: ChatMessage[] = restoredChatHistory.map((m) => ({
        id: crypto.randomUUID(),
        role: m.role,
        content: m.content,
        timestamp: new Date(),
      }));
      setMessages(asMessages);
      setShowLoadedFromLibrarySeparator(true);
      onRestoredChatHistoryApplied?.();
    }
  }, [restoredChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInitialGenerate = async () => {
    const prompt = inputValue.trim();
    if (!prompt) return;

    onGeneratingChange?.(true);
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAdSpec({ prompt, activeBrand });
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      };
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: result.spec.generation?.rationale ?? 'Ad generated.',
        specSnapshot: result.spec,
        timestamp: new Date(),
      };
      setMessages([userMsg, assistantMsg]);
      setInputValue('');
      onInitialGenerate(result.spec);
      onAdGenerated?.(result.spec, prompt, [
        { role: 'user', content: prompt },
        { role: 'assistant', content: result.spec.generation?.rationale ?? 'Ad generated.' },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ad');
    } finally {
      setIsLoading(false);
      onGeneratingChange?.(false);
    }
  };

  const handleRefine = async () => {
    const text = inputValue.trim();
    if (!text || !currentSpec) return;

    onGeneratingChange?.(true);
    setIsLoading(true);
    setError(null);

    try {
      const { updatedSpec, explanation } = await refineAdSpec(
        currentSpec,
        messages,
        text,
        apiKey,
        activeBrand
      );
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: explanation,
        specSnapshot: updatedSpec,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInputValue('');
      onSpecUpdate(updatedSpec);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refinement failed');
    } finally {
      setIsLoading(false);
      onGeneratingChange?.(false);
    }
  };

  const handleSubmit = () => {
    if (messages.length === 0) {
      handleInitialGenerate();
    } else {
      handleRefine();
    }
  };

  const isInitial = messages.length === 0;
  const canSubmit = isInitial
    ? inputValue.trim().length > 0 && !isLoading
    : inputValue.trim().length > 0 && !isLoading && currentSpec !== null;

  const brandChip = hasActiveBrand && (
    <button
      type="button"
      className="chat-brand-tokens-chip"
      onClick={onOpenBrandTokens}
      aria-label={`${activeBrandName} active — click to edit`}
    >
      ◈ {activeBrandName}
    </button>
  );

  if (isInitial) {
    return (
      <div className="chat-panel-root">
        {brandChip}
        <div className="prompt-input-container">
          <label className="prompt-input-label" htmlFor="chat-initial-textarea">
            DESCRIBE YOUR AD
          </label>
          <textarea
            ref={promptInputRef}
            id="chat-initial-textarea"
            className="prompt-input-textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. a dreamy banner for a luxury perfume launch"
            disabled={isLoading}
          />
          <button
            type="button"
            className={`prompt-input-button ${isLoading ? 'prompt-input-button-loading' : ''}`}
            onClick={handleInitialGenerate}
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? 'Generating' : 'Generate Ad'}
          </button>
          {error && <p className="prompt-input-error">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel-root">
      <div className="chat-panel">
        <div
          ref={messagesContainerRef}
          className="chat-messages"
          role="log"
          aria-live="polite"
        >
          {showLoadedFromLibrarySeparator && (
            <div className="chat-loaded-from-library-separator">
              — Loaded from project —
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message ${msg.role}`}
              data-role={msg.role}
            >
              <div className="chat-message-bubble">{msg.content}</div>
              {msg.specSnapshot != null && (
                <span className="chat-updated-tag">↻ Ad updated</span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {brandChip}
        <div className="chat-input-row">
          <textarea
            aria-label="Refine your ad"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Refine your ad..."
            disabled={isLoading}
            rows={1}
          />
          <button
            type="button"
            className="chat-send-button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Send"
          >
            →
          </button>
        </div>
        {error && <p className="prompt-input-error">{error}</p>}
      </div>
    </div>
  );
}
