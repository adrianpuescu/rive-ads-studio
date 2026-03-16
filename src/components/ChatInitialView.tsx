import { ChatBrandButton } from './ChatBrandButton'
import type { ActiveBrandForPrompt } from '../ai/specGenerator'

export interface ChatInitialViewProps {
  inputValue: string
  onInputChange: (value: string) => void
  promptInputRef?: React.RefObject<HTMLTextAreaElement | null>
  isLoading: boolean
  onSubmit: () => void
  showBrandButton: boolean
  hasActiveBrand: boolean
  activeBrandName: string
  activeBrand: ActiveBrandForPrompt | null
  onOpenBrandTokens?: () => void
  isGeneratingVariants: boolean
  onGenerateVariants?: (prompt: string) => void
  error: string | null
}

export function ChatInitialView({
  inputValue,
  onInputChange,
  promptInputRef,
  isLoading,
  onSubmit,
  showBrandButton,
  hasActiveBrand,
  activeBrandName,
  activeBrand,
  onOpenBrandTokens,
  isGeneratingVariants,
  onGenerateVariants,
  error,
}: ChatInitialViewProps) {
  return (
    <div className="w-full h-full min-h-0 flex flex-col p-0 m-0 flex-1">
      <div className="flex flex-col gap-4 py-6 px-4 w-full box-border">
        <label
          className="text-xs font-semibold text-gray-400 uppercase tracking-wider m-0"
          htmlFor="chat-initial-textarea"
        >
          Describe your ad
        </label>
        <textarea
          ref={promptInputRef}
          id="chat-initial-textarea"
          className="w-full min-h-[120px] border border-gray-200 rounded px-3 py-2 text-sm leading-normal text-gray-900 bg-white resize-y transition-colors duration-150 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:border-gray-400"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit()
            }
          }}
          placeholder="e.g. a dreamy banner for a luxury perfume launch"
          disabled={isLoading}
        />
        {showBrandButton && onOpenBrandTokens && (
          <ChatBrandButton
            hasActiveBrand={hasActiveBrand}
            activeBrandName={activeBrandName}
            activeBrand={activeBrand}
            onOpenBrandTokens={onOpenBrandTokens}
          />
        )}
        <button
          type="button"
          className={`w-full h-11 px-6 font-medium text-sm text-white bg-gray-900 border-0 rounded cursor-pointer transition-colors duration-150 hover:enabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed ${isGeneratingVariants ? 'animate-dots-loading' : ''}`}
          onClick={() => {
            const prompt = inputValue.trim()
            if (prompt) {
              onGenerateVariants?.(prompt)
              onInputChange('')
            }
          }}
          disabled={!inputValue.trim() || isGeneratingVariants}
        >
          {isGeneratingVariants ? 'Generating' : 'Generate'}
        </button>
        {error && <p className="text-sm text-red-500 m-0">{error}</p>}
      </div>
    </div>
  )
}
