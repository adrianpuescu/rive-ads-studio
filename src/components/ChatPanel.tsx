/**
 * ChatPanel Component
 *
 * Conversational AI chat for iterative ad refinement.
 * Initial state: describe ad + Generate. After first generation: chat with refinement.
 */

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, Palette } from 'lucide-react';
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
  /** Called whenever messages change so parent can persist them on save. */
  onChatMessagesChange?: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
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
  /** Callback when user clicks the brand button to open panel. */
  onOpenBrandTokens?: () => void;
  /** When true, disable Generate Variants (e.g. while generating variants). */
  isGenerating?: boolean;
  /** Called when user clicks Generate Variants with the current prompt. */
  onGenerateVariants?: (prompt: string) => void;
  /** When this value increments, the input is cleared (e.g. after variant selected). */
  clearInputTrigger?: number;
}

function nextId(): string {
  return crypto.randomUUID();
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newAdTrigger > 0) {
      setMessages([]);

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
      onChatMessagesChange?.(restoredChatHistory);
      onRestoredChatHistoryApplied?.();
    }
  }, [restoredChatHistory]);

  useEffect(() => {
    if (clearInputTrigger > 0) {
      setInputValue('');
    }
  }, [clearInputTrigger]);

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
      const history = [
        { role: 'user' as const, content: prompt },
        { role: 'assistant' as const, content: result.spec.generation?.rationale ?? 'Ad generated.' },
      ];
      setMessages([userMsg, assistantMsg]);
      onChatMessagesChange?.(history);
      setInputValue('');
      onInitialGenerate(result.spec);
      onAdGenerated?.(result.spec, prompt, history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
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
      const newHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
        { role: 'assistant' as const, content: explanation },
      ];
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      onChatMessagesChange?.(newHistory);
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

  const isInitial = currentSpec === null && messages.length === 0;
  const canSubmit = isInitial
    ? inputValue.trim().length > 0 && !isLoading
    : inputValue.trim().length > 0 && !isLoading && currentSpec !== null;

  const isCreationMode = currentSpec === null;
  const brandButton =
    isCreationMode && onOpenBrandTokens ? (
      <button
        type="button"
        className={`inline-flex items-center gap-2 px-3 py-2 border rounded text-sm cursor-pointer transition-colors duration-150 min-h-[36px] ${
          hasActiveBrand
            ? 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
            : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
        }`}
        onClick={onOpenBrandTokens}
        aria-label={hasActiveBrand ? `${activeBrandName} — edit brand` : 'Add brand'}
      >
        {hasActiveBrand && activeBrand?.tokens ? (
          <span className="flex items-center gap-1 flex-shrink-0" aria-hidden>
            <span
              className="w-3 h-3 rounded-full ring-1 ring-black/10 flex-shrink-0"
              style={{ backgroundColor: activeBrand.tokens.primaryColor }}
            />
            <span
              className="w-3 h-3 rounded-full ring-1 ring-black/10 flex-shrink-0"
              style={{ backgroundColor: activeBrand.tokens.secondaryColor }}
            />
            <span
              className="w-3 h-3 rounded-full ring-1 ring-black/10 flex-shrink-0"
              style={{ backgroundColor: activeBrand.tokens.backgroundColor }}
            />
          </span>
        ) : (
          <Palette className="w-4 h-4 flex-shrink-0" aria-hidden />
        )}
        <span>{hasActiveBrand ? activeBrandName : 'Add brand'}</span>
      </button>
    ) : null;

  if (isInitial) {
    return (
      <div className="w-full h-full min-h-0 flex flex-col p-0 m-0 flex-1">
        <div className="flex flex-col gap-4 py-6 px-4 w-full box-border">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider m-0" htmlFor="chat-initial-textarea">
            Describe your ad
          </label>
          <textarea
            ref={promptInputRef}
            id="chat-initial-textarea"
            className="w-full min-h-[120px] border border-gray-200 rounded px-3 py-2 text-sm leading-normal text-gray-900 bg-white resize-y transition-colors duration-150 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-gray-900"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="e.g. a dreamy banner for a luxury perfume launch"
            disabled={isLoading}
          />
          {brandButton}
          <button
            type="button"
            className={`w-full h-11 px-6 font-medium text-sm text-white bg-gray-900 border-0 rounded cursor-pointer transition-colors duration-150 hover:enabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed ${isGenerating ? 'animate-dots-loading' : ''}`}
            onClick={() => {
              const prompt = inputValue.trim();
              if (prompt) {
                onGenerateVariants?.(prompt);
                setInputValue('');
              }
            }}
            disabled={!inputValue.trim() || isGenerating}
          >
            {isGenerating ? 'Generating' : 'Generate'}
          </button>
          {error && <p className="text-sm text-red-500 m-0">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex flex-col p-0 m-0 flex-1">
      <div className="flex flex-col flex-1 min-h-0 p-0 m-0">
        <div
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-start gap-3 py-4 px-4 pb-2 scrollbar-thin"
          role="log"
          aria-live="polite"
        >

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'self-end max-w-[85%]' : 'self-start'}`}
              data-role={msg.role}
            >
              <div className={`text-sm leading-normal break-words ${msg.role === 'user' ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-br-sm px-3 py-2' : 'text-gray-600'}`}>
                {msg.content}
              </div>
              {msg.specSnapshot != null && (
                <span className="text-xs text-gray-400 mt-1 pl-0.5">↻ Ad updated</span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 w-full m-0 py-3 px-4 pb-4">
          <textarea
            aria-label="Refine your ad"
            className="flex-1 min-h-[40px] border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 resize-none transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-gray-900 placeholder:text-gray-400"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Refine your ad..."
            disabled={isLoading}
            rows={1}
          />
          <button
            type="button"
            className="w-9 h-9 rounded bg-gray-900 text-white border-0 cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors duration-150 hover:enabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Send"
          >
            <ArrowUp className="w-4 h-4" aria-hidden />
          </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 m-0 px-4 pb-2">{error}</p>}
      </div>
    </div>
  );
}
