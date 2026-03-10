import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1>Landing Page</h1>
      <Link to="/editor">Open Editor</Link>
      <Link to="/projects">Projects</Link>
    </div>
  )
}
