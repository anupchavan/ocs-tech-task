import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../stores/AuthContext'
import { useTheme } from '../hooks/useTheme'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) navigate('/') }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Brand name — no logo icon */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            OCS · IIT Hyderabad
          </div>
          <div className="auth-heading" style={{ marginBottom: 0 }}>Room Booking</div>
        </div>

        <div className="auth-heading" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-muted)', marginBottom: '1.25rem', marginTop: '-0.75rem' }}>Welcome back</div>
        <div className="auth-sub">Sign in with your OCS credentials to continue.</div>

        {error && (
          <div className="auth-error">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input
                type="email" className="input has-icon"
                placeholder="you@ocs.iith.ac.in"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type="password" className="input has-icon"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
            Access granted by OCS Admin only.
          </p>
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme (D)">
            {theme === 'dark' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </div>
  )
}
