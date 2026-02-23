import './App.css'
import { RiveCanvas } from './components/RiveCanvas'

function App() {
  return (
    <main className="app">
      <h1>Rive + React</h1>
      <p>Place your .riv file in public and update the path if needed.</p>
      <div className="canvas-container">
        <RiveCanvas src="/animation.riv" />
      </div>
    </main>
  )
}

export default App
