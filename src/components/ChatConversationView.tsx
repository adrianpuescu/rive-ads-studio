import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatInputBar } from './ChatInputBar'
import type { ChatMessage } from '../types/chat'

export interface ChatConversationViewProps {
  messages: ChatMessage[]
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  inputValue: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  canSubmit: boolean
  error: string | null
}

export function ChatConversationView({
  messages,
  messagesContainerRef,
  messagesEndRef,
  inputValue,
  onInputChange,
  onSubmit,
  isLoading,
  canSubmit,
  error,
}: ChatConversationViewProps) {
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
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInputBar
          value={inputValue}
          onChange={onInputChange}
          onSubmit={onSubmit}
          disabled={isLoading}
          submitDisabled={!canSubmit}
          placeholder="Refine your ad..."
          ariaLabel="Refine your ad"
        />
        {error && <p className="text-sm text-red-500 m-0 px-4 pb-2">{error}</p>}
      </div>
    </div>
  )
}
