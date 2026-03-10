import { useState } from 'react'
import './App.css'
import { ChatPanel } from './components/ChatPanel'
import { AdCanvas } from './components/AdCanvas'
import { ExportButton } from './components/ExportButton'
import { SpecInspector } from './components/SpecInspector'
import type { AdSpec } from './types/ad-spec.schema'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY ?? ''

function App() {
  const [currentSpec, setCurrentSpec] = useState<AdSpec | null>(null)

  return (
    <div className="app">
      <div className="app-left-panel">
        <div className="app-logo">
          <h1 className="app-logo-text">
            <span className="app-logo-riveads">RiveAds</span>
            <span className="app-logo-dot"></span>
            <span className="app-logo-studio">Studio</span>
          </h1>
        </div>
        <p className="app-tagline">Artistic ads, AI-made.</p>
        <div className="app-divider"></div>
        <p className="panel-label">STUDIO</p>
        <ChatPanel
          currentSpec={currentSpec}
          onSpecUpdate={setCurrentSpec}
          onInitialGenerate={setCurrentSpec}
          apiKey={apiKey}
        />
      </div>

      <div className="app-center-panel">
        {currentSpec ? (
          <div className="app-canvas-wrapper">
            <div className="app-canvas-toolbar">
              <ExportButton
                spec={currentSpec}
                rivFileName="test-template.riv"
              />
            </div>
            <AdCanvas
              spec={currentSpec}
              width={728}
              height={90}
            />
          </div>
        ) : (
          <p className="app-placeholder">Your ad will appear here</p>
        )}
      </div>

      {currentSpec && (
        <div className="app-right-panel">
          <p className="panel-label">INSPECTOR</p>
          <SpecInspector
            spec={currentSpec}
            onChange={setCurrentSpec}
          />
        </div>
      )}
    </div>
  )
}

export default App
