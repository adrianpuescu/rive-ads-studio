import { ArrowUp } from 'lucide-react'

export interface ChatInputBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
  submitDisabled: boolean
  placeholder?: string
  ariaLabel?: string
}

export function ChatInputBar({
  value,
  onChange,
  onSubmit,
  disabled,
  submitDisabled,
  placeholder = 'Refine your ad...',
  ariaLabel = 'Refine your ad',
}: ChatInputBarProps) {
  return (
    <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 w-full m-0 py-3 px-4 pb-4">
        <textarea
          aria-label={ariaLabel}
          className="flex-1 min-h-[40px] border border-gray-200 rounded px-3 py-2 text-sm bg-white text-gray-900 resize-none transition-colors duration-150 focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
        />
        <button
          type="button"
          className="w-9 h-9 rounded bg-gray-900 text-white border-0 cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors duration-150 hover:enabled:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onSubmit}
          disabled={submitDisabled}
          aria-label="Send"
        >
          <ArrowUp className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
