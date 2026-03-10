import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1>Dashboard</h1>
      <Link to="/editor">Open Studio</Link>
    </div>
  )
}
