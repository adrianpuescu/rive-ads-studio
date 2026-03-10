import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { ChatPanel } from './components/ChatPanel'
import { AdCanvas } from './components/AdCanvas'
import { ExportButton } from './components/ExportButton'
import { SpecInspector } from './components/SpecInspector'
import type { AdSpec } from './types/ad-spec.schema'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

const CHAT_COLLAPSED_KEY = 'riveads_chat_collapsed'
const INSPECTOR_COLLAPSED_KEY = 'riveads_inspector_collapsed'

function readStored(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return fallback
    return v === 'true'
  } catch {
    return fallback
  }
}

function App() {
  const [currentSpec, setCurrentSpec] = useState<AdSpec | null>(null)
  const [chatCollapsed, setChatCollapsed] = useState(() =>
    readStored(CHAT_COLLAPSED_KEY, false)
  )
  const [inspectorCollapsed, setInspectorCollapsed] = useState(() =>
    readStored(INSPECTOR_COLLAPSED_KEY, false)
  )

  useEffect(() => {
    localStorage.setItem(CHAT_COLLAPSED_KEY, String(chatCollapsed))
  }, [chatCollapsed])

  useEffect(() => {
    localStorage.setItem(INSPECTOR_COLLAPSED_KEY, String(inspectorCollapsed))
  }, [inspectorCollapsed])

  const toggleChat = useCallback(() => {
    setChatCollapsed((c) => !c)
  }, [])

  const toggleInspector = useCallback(() => {
    setInspectorCollapsed((c) => !c)
  }, [])

  return (
    <div className="app">
      <header className="app-toolbar">
        <div className="app-toolbar-wordmark">
          <span className="app-toolbar-wordmark-riveads">RiveAds</span>
          <span className="app-toolbar-wordmark-dot" aria-hidden />
          <span className="app-toolbar-wordmark-studio">Studio</span>
        </div>
        <div className="app-toolbar-spacer" />
        <div className="app-toolbar-actions">
          <span className="app-toolbar-badge" aria-label="Ad size">
            728 × 90
          </span>
          <span className="app-toolbar-separator" aria-hidden />
          {currentSpec && (
            <ExportButton
              spec={currentSpec}
              rivFileName="test-template.riv"
            />
          )}
        </div>
      </header>

      <div className="app-main">
        <div
          className={`app-left-wrap ${chatCollapsed ? 'app-sidebar-collapsed' : ''}`}
        >
          <div
            className={`app-left-panel ${chatCollapsed ? 'app-sidebar-content-collapsed' : ''}`}
          >
            <ChatPanel
              currentSpec={currentSpec}
              onSpecUpdate={setCurrentSpec}
              onInitialGenerate={setCurrentSpec}
              apiKey={apiKey}
            />
          </div>
        </div>

        <div className="app-center-panel">
          <button
            type="button"
            className="app-sidebar-toggle app-sidebar-toggle-left"
            onClick={toggleChat}
            aria-label={chatCollapsed ? 'Expand chat' : 'Collapse chat'}
            aria-expanded={!chatCollapsed}
          >
            {chatCollapsed ? '›' : '‹'}
          </button>
          {currentSpec ? (
            <div className="app-canvas-wrapper">
              <AdCanvas
                spec={currentSpec}
                width={728}
                height={90}
              />
            </div>
          ) : (
            <p className="app-placeholder">Your ad will appear here</p>
          )}
          {currentSpec && (
            <button
              type="button"
              className="app-sidebar-toggle app-sidebar-toggle-right"
              onClick={toggleInspector}
              aria-label={
                inspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'
              }
              aria-expanded={!inspectorCollapsed}
            >
              {inspectorCollapsed ? '‹' : '›'}
            </button>
          )}
        </div>

        {currentSpec && (
          <div
            className={`app-right-wrap ${inspectorCollapsed ? 'app-sidebar-collapsed' : ''}`}
          >
            <div
              className={`app-right-panel ${inspectorCollapsed ? 'app-sidebar-content-collapsed' : ''}`}
            >
              <p className="panel-label">INSPECTOR</p>
              <SpecInspector
                spec={currentSpec}
                onChange={setCurrentSpec}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
