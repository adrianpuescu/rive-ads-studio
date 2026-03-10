import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1>Landing Page</h1>
      <Link to="/editor">Open Editor</Link>
      <Link to="/projects">Projects</Link>
    </div>
  )
}
