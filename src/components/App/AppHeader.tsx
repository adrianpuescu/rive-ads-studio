import { Link } from 'react-router-dom'
import { Plus, Undo2, Redo2, LayoutGrid, ChevronDown, Share2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { ExportButton } from '../ExportButton'
import { UserNavDropdown } from '../UserNavDropdown'
import { AD_FORMATS } from '../../constants/adFormats'
import type { AdSpec } from '../../types/ad-spec.schema'
import type { AdFormat } from '../../constants/adFormats'

export interface AppHeaderProps {
  showNewAdConfirm: boolean
  onSaveAndNew: () => void
  onDiscard: () => void
  onCancelConfirm: () => void
  onNewAdClick: () => void
  onUndo: () => void
  canUndo: boolean
  onRedo: () => void
  canRedo: boolean
  adSpec: AdSpec | null
  saveStatus: 'saved' | 'unsaved' | null
  projectsDrawerOpen: boolean
  onCloseProjects: () => void
  onOpenProjects: () => void
  adsCount: number
  currentFormat: AdFormat
  formatDropdownOpen: boolean
  formatDropdownRef: React.RefObject<HTMLDivElement | null>
  onToggleFormatDropdown: () => void
  onSelectFormat: (format: AdFormat) => void
  replacePresent: (spec: AdSpec) => void
  activeAdId: string | null
  onShare: () => void
  isGeneratingShareLink: boolean
  user: User | null
  displayName: string | null
  onSignOut: () => void
}

export function AppHeader({
  showNewAdConfirm,
  onSaveAndNew,
  onDiscard,
  onCancelConfirm,
  onNewAdClick,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  adSpec,
  saveStatus,
  projectsDrawerOpen,
  onCloseProjects,
  onOpenProjects,
  adsCount,
  currentFormat,
  formatDropdownOpen,
  formatDropdownRef,
  onToggleFormatDropdown,
  onSelectFormat,
  replacePresent,
  activeAdId,
  onShare,
  isGeneratingShareLink,
  user,
  displayName,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="h-11 flex-shrink-0 flex items-center px-5 gap-2 bg-white border-b border-gray-200">
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 no-underline text-inherit"
      >
        <span className="font-serif text-sm font-semibold leading-none text-gray-900">RiveAds</span>
        <span className="w-1 h-1 rounded-full bg-gray-900 flex-shrink-0" aria-hidden />
        <span className="font-sans text-sm font-semibold leading-none text-gray-900">Studio</span>
      </Link>

      <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

      {showNewAdConfirm ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Unsaved changes</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
            onClick={onSaveAndNew}
          >
            Save & New
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-900 px-2 py-1 cursor-pointer bg-transparent border-0 transition-colors duration-150"
            onClick={onCancelConfirm}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
          onClick={onNewAdClick}
          aria-label="New ad"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          New Ad
        </button>
      )}

      <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

      <button
        type="button"
        className="flex items-center justify-center w-8 h-8 p-0 border border-gray-200 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Cmd+Z)"
      >
        <Undo2 className="w-3.5 h-3.5" aria-hidden />
      </button>
      <button
        type="button"
        className="flex items-center justify-center w-8 h-8 p-0 border border-gray-200 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors duration-150"
        onClick={onRedo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Cmd+Shift+Z)"
      >
        <Redo2 className="w-3.5 h-3.5" aria-hidden />
      </button>
      {adSpec && (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 tabular-nums" aria-live="polite">
          {saveStatus === 'saved' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" aria-hidden />
              Saved
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" aria-hidden />
              Unsaved
            </>
          )}
        </span>
      )}

      <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

      <button
        type="button"
        className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px]"
        onClick={() => (projectsDrawerOpen ? onCloseProjects() : onOpenProjects())}
        aria-label="Open Projects"
      >
        <LayoutGrid className="w-3.5 h-3.5" aria-hidden />
        Projects
        {adsCount > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 text-[11px] font-medium leading-[18px] text-center text-white bg-gray-900 rounded-full tabular-nums" aria-label={`${adsCount} projects`}>
            {adsCount}
          </span>
        )}
      </button>

      <div className="flex-1" />

      <div className="relative" ref={formatDropdownRef}>
        <button
          type="button"
          className="relative text-sm py-1.5 pl-3 pr-7 border border-gray-200 rounded bg-white text-gray-700 cursor-pointer inline-flex items-center gap-2 hover:bg-gray-50 focus:outline-none transition-colors duration-150 min-h-[32px] tabular-nums"
          onClick={onToggleFormatDropdown}
          aria-haspopup="listbox"
          aria-expanded={formatDropdownOpen}
          aria-label="Ad size"
        >
          {currentFormat.label}
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" aria-hidden />
        </button>
        {formatDropdownOpen && (
          <ul
            className="absolute top-[calc(100%+4px)] right-0 min-w-full m-0 p-1 list-none bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[240px] overflow-y-auto"
            role="listbox"
            aria-label="Ad size"
          >
            {AD_FORMATS.map((format) => (
              <li key={format.id} role="option" aria-selected={currentFormat.id === format.id}>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full py-1.5 px-3 text-sm text-gray-700 bg-transparent border-0 rounded cursor-pointer text-left hover:bg-gray-50 transition-colors duration-150 tabular-nums whitespace-nowrap"
                  onClick={() => {
                    onSelectFormat(format)
                    if (adSpec) {
                      replacePresent({
                        ...adSpec,
                        formatId: format.id,
                        template: {
                          ...adSpec.template,
                          id: format.id,
                          artboard: format.artboard,
                        },
                      })
                    }
                  }}
                >
                  {currentFormat.id === format.id && (
                    <span className="w-4 text-xs font-semibold text-gray-900 flex-shrink-0" aria-hidden>✓</span>
                  )}
                  {currentFormat.id !== format.id && <span className="w-4 flex-shrink-0" />}
                  {format.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />

      {adSpec && activeAdId && (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 border border-gray-200 text-sm px-3 py-1.5 rounded hover:bg-gray-50 text-gray-700 cursor-pointer bg-white transition-colors duration-150 min-h-[32px] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onShare}
          disabled={isGeneratingShareLink}
          aria-label="Share preview link"
        >
          <Share2 className="w-3.5 h-3.5" aria-hidden />
          {isGeneratingShareLink ? 'Sharing...' : 'Share'}
        </button>
      )}

      {adSpec && (
        <ExportButton
          spec={adSpec}
          rivFileName={currentFormat.riveFile}
        />
      )}

      {user && (
        <>
          <span className="w-px h-4 bg-gray-200 flex-shrink-0" aria-hidden />
          <UserNavDropdown
            user={user}
            displayName={displayName}
            onSignOut={onSignOut}
          />
        </>
      )}
    </header>
  )
}
