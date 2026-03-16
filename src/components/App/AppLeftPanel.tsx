import type { ReactNode } from 'react'

export interface AppLeftPanelProps {
  chatCollapsed: boolean
  children: ReactNode
}

export function AppLeftPanel({ chatCollapsed, children }: AppLeftPanelProps) {
  return (
    <div
      className={`flex-shrink-0 overflow-hidden transition-[width] duration-250 ease-out app-left-wrap-mobile max-md:border-t max-md:border-border ${
        chatCollapsed
          ? 'w-0 max-md:!w-0 max-md:!h-0 max-md:!min-h-0'
          : 'w-[300px] max-md:order-3 max-md:!w-full max-md:h-[300px]'
      }`}
    >
      <div
        className={`w-[300px] flex-shrink-0 h-full overflow-hidden p-0 m-0 border-r border-border flex flex-col bg-surface transition-transform duration-250 ease-out scrollbar-thin app-left-panel-mobile ${chatCollapsed ? '-translate-x-[300px]' : 'translate-x-0'} max-md:w-full max-md:border-r-0 max-md:[.app-left-wrap-mobile.w-0_&]:-translate-x-full`}
      >
        {children}
      </div>
    </div>
  )
}
