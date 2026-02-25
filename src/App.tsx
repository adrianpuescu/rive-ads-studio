import { useState } from 'react'
import './App.css'
import { PromptInput } from './components/PromptInput'
import { AdCanvas } from './components/AdCanvas'
import type { AdSpec } from './types/ad-spec.schema'

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
        
        <PromptInput onGenerate={setCurrentSpec} />
      </div>

      <div className="app-right-panel">
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
      </div>
    </div>
  )
}

export default App
