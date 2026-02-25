import { useState } from 'react'
import './App.css'
import { PromptInput } from './components/PromptInput'
import { AdCanvas } from './components/AdCanvas'
import type { AdSpec } from './types/ad-spec.schema'

function App() {
  const [currentSpec, setCurrentSpec] = useState<AdSpec | null>(null)

  return (
    <main className="app">
      <h1>RiveAds Studio</h1>
      
      <PromptInput onGenerate={setCurrentSpec} />

      {currentSpec && (
        <AdCanvas 
          spec={currentSpec} 
          width={728} 
          height={90} 
        />
      )}
    </main>
  )
}

export default App
