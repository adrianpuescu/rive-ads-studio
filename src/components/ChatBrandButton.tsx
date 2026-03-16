import { Palette } from 'lucide-react'
import type { ActiveBrandForPrompt } from '../ai/specGenerator'

export interface ChatBrandButtonProps {
  hasActiveBrand: boolean
  activeBrandName: string
  activeBrand: ActiveBrandForPrompt | null
  onOpenBrandTokens: () => void
}

export function ChatBrandButton({
  hasActiveBrand,
  activeBrandName,
  activeBrand,
  onOpenBrandTokens,
}: ChatBrandButtonProps) {
  return (
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
  )
}
