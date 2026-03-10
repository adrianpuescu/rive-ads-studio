import { Link } from 'react-router-dom'

export function RegisterPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
      <h1>Register</h1>
      <Link to="/editor">Open Studio</Link>
    </div>
  )
}
