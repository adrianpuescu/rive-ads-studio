/**
 * ChatPanel Component
 *
 * Conversational AI chat for iterative ad refinement.
 * Initial state: describe ad + Generate. After first generation: chat with refinement.
 */

import { useState, useRef, useEffect } from 'react';
import type { AdSpec } from '../types/ad-spec.schema';
import type { ChatMessage } from '../types/chat';
import { generateAdSpec } from '../ai/specGenerator';
import { refineAdSpec } from '../ai/chatRefinement';

export interface ChatPanelProps {
  currentSpec: AdSpec | null;
  onSpecUpdate: (spec: AdSpec) => void;
  onInitialGenerate: (spec: AdSpec) => void;
  /** Called when a new ad is generated (for Creative Library). Receives spec and the prompt used. */
  onAdGenerated?: (spec: AdSpec, prompt: string) => void;
  apiKey: string;
}

function nextId(): string {
  return crypto.randomUUID();
}

export function ChatPanel({
  currentSpec,
  onSpecUpdate,
  onInitialGenerate,
  onAdGenerated,
  apiKey,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInitialGenerate = async () => {
    const prompt = inputValue.trim();
    if (!prompt) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateAdSpec({ prompt });
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
      onAdGenerated?.(result.spec, prompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate ad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    const text = inputValue.trim();
    if (!text || !currentSpec) return;

    setIsLoading(true);
    setError(null);

    try {
      const { updatedSpec, explanation } = await refineAdSpec(
        currentSpec,
        messages,
        text,
        apiKey
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

  if (isInitial) {
    return (
      <div className="chat-panel-root">
        <div className="prompt-input-container">
          <label className="prompt-input-label" htmlFor="chat-initial-textarea">
            DESCRIBE YOUR AD
          </label>
          <textarea
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
