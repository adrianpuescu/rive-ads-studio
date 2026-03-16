import type { ChatMessage } from '../types/chat'

export interface ChatMessageBubbleProps {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <div
      className={`flex flex-col ${isUser ? 'self-end max-w-[85%]' : 'self-start'}`}
      data-role={message.role}
    >
      <div
        className={`text-sm leading-normal break-words ${
          isUser ? 'bg-gray-100 text-gray-900 rounded-2xl rounded-br-sm px-3 py-2' : 'text-gray-600'
        }`}
      >
        {message.content}
      </div>
      {message.specSnapshot != null && (
        <span className="text-xs text-gray-400 mt-1 pl-0.5">↻ Ad updated</span>
      )}
    </div>
  )
}
