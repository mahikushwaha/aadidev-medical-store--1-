import { useState } from 'react'
import { useAuth } from '../AuthContext'
import { supabaseReady } from '../supabaseClient'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    setError('')
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(error)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, maxWidth: 340, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Aadidev Medical Store</div>
        <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 2 }}>Owner login</div>
      </div>

      {!supabaseReady && <div className="setup-banner">Connect Supabase to log in — see README.</div>}

      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Your password"
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
        {busy ? 'Logging in…' : 'Log in'}
      </button>
    </div>
  )
}