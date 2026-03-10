import { Link } from 'react-router-dom'

export function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1>Login</h1>
      <Link to="/editor">Open Studio</Link>
    </div>
  )
}
