import { AdCanvas } from '../AdCanvas'
import type { AdSpec } from '../../types/ad-spec.schema'
import type { AdFormat } from '../../constants/adFormats'

export interface AppCenterPanelProps {
  chatCollapsed: boolean
  onToggleChat: () => void
  projectsDrawerOpen: boolean
  brandOpen: boolean
  adSpec: AdSpec | null
  currentFormat: AdFormat
  isGenerating: boolean
  historyToast: { message: string } | null
  inspectorCollapsed: boolean
  onToggleInspector: () => void
}

export function AppCenterPanel({
  chatCollapsed,
  onToggleChat,
  projectsDrawerOpen,
  brandOpen,
  adSpec,
  currentFormat,
  isGenerating,
  historyToast,
  inspectorCollapsed,
  onToggleInspector,
}: AppCenterPanelProps) {
  const hideToggles = projectsDrawerOpen || brandOpen

  return (
    <div className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-center bg-[#FAFAFA] overflow-hidden app-center-panel-mobile px-5 max-md:order-1 max-md:min-h-[40vh] max-md:py-8 max-md:px-6">
      <button
        type="button"
        className={`absolute left-0 top-[60px] w-5 h-12 p-0 flex items-center justify-center text-sm text-text-primary bg-[#f5f5f5] border border-[#e5e5e5] border-l-0 rounded-r cursor-pointer hover:bg-[#ebebeb] hover:border-[#e0e0e0] focus:outline-none focus-visible:bg-[#ebebeb] focus-visible:border-border z-[1] transition-colors duration-200 transition-opacity duration-150 ease-out ${hideToggles ? 'opacity-0 pointer-events-none' : ''}`}
        onClick={onToggleChat}
        aria-label={chatCollapsed ? 'Expand chat' : 'Collapse chat'}
        aria-expanded={!chatCollapsed}
      >
        {chatCollapsed ? '›' : '‹'}
      </button>
      {adSpec ? (
        <div className="relative w-fit max-w-full h-full flex flex-col items-center justify-center animate-fade-in [&_canvas]:!rounded-none app-canvas-wrapper-mobile max-md:h-auto">
          <AdCanvas
            spec={adSpec}
            width={currentFormat.width}
            height={currentFormat.height}
            riveFile={currentFormat.riveFile}
            artboard={currentFormat.artboard}
            isGenerating={isGenerating}
          />
          {historyToast && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 py-1.5 px-3 text-[0.75rem] font-sans text-white bg-ink rounded whitespace-nowrap animate-history-toast pointer-events-none" role="status">
              {historyToast.message}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">Your ad will appear here</p>
      )}
      {adSpec && (
        <button
          type="button"
          className={`absolute right-0 top-[60px] w-5 h-12 p-0 flex items-center justify-center text-sm text-text-primary bg-[#f5f5f5] border border-[#e5e5e5] border-r-0 rounded-l cursor-pointer hover:bg-[#ebebeb] hover:border-[#e0e0e0] focus:outline-none focus-visible:bg-[#ebebeb] focus-visible:border-border z-[1] transition-colors duration-200 transition-opacity duration-150 ease-out ${hideToggles ? 'opacity-0 pointer-events-none' : ''}`}
          onClick={onToggleInspector}
          aria-label={inspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'}
          aria-expanded={!inspectorCollapsed}
        >
          {inspectorCollapsed ? '‹' : '›'}
        </button>
      )}
    </div>
  )
}
