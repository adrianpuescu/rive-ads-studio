import type { ReactNode } from 'react'

export interface AppRightPanelProps {
  inspectorCollapsed: boolean
  children: ReactNode
}

export function AppRightPanel({ inspectorCollapsed, children }: AppRightPanelProps) {
  return (
    <div
      className={`flex-shrink-0 overflow-hidden transition-[width] duration-250 ease-out app-right-wrap-mobile max-md:border-l-0 max-md:border-t max-md:border-border ${
        inspectorCollapsed
          ? 'w-0 max-md:!w-0 max-md:!h-0 max-md:!min-h-0'
          : 'w-[280px] max-md:order-2 max-md:!w-full max-md:min-h-[40vh]'
      }`}
    >
      <div
        className={`w-[280px] flex-shrink-0 h-full overflow-y-auto overflow-x-hidden py-6 px-5 border-l border-border bg-surface transition-transform duration-250 ease-out scrollbar-thin app-right-panel-mobile ${inspectorCollapsed ? 'translate-x-[280px]' : 'translate-x-0'} max-md:w-full max-md:[.app-right-wrap-mobile.w-0_&]:translate-x-full`}
      >
        {children}
      </div>
    </div>
  )
}
