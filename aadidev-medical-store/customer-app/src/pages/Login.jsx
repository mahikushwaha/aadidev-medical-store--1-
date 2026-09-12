import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { supabaseReady } from '../supabaseClient'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const redirectTo = location.state?.from || '/'

  async function submit() {
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password of at least 6 characters.')
      return
    }
    setBusy(true)
    setError('')
    setInfo('')
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password)
      setBusy(false)
      if (error) {
        setError(error)
      } else {
        navigate(redirectTo, { replace: true })
      }
    } else {
      const { error } = await signUp(email.trim(), password)
      setBusy(false)
      if (error) {
        setError(error)
      } else {
        setInfo('Account created! If email confirmation is on, check your inbox — otherwise you can log in now.')
        setMode('login')
      }
    }
  }

  return (
    <div>
      <div className="section-title">{mode === 'login' ? 'Log in' : 'Create your account'}</div>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -6, marginBottom: 16 }}>
        Log in to place orders, chat with the owner, and track your deliveries.
      </p>

      {!supabaseReady && (
        <div className="setup-banner">Login needs Supabase connected — see README.</div>
      )}

      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      <div className="field">
        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
      {info && <div style={{ color: 'var(--green-dark)', fontSize: 13, marginBottom: 10 }}>{info}</div>}

      <button className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
        {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
      </button>

      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13 }}>
        {mode === 'login' ? (
          <>
            New here?{' '}
            <button onClick={() => { setMode('signup'); setError(''); setInfo('') }} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600 }}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button onClick={() => { setMode('login'); setError(''); setInfo('') }} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 600 }}>
              Log in
            </button>
          </>
        )}
      </div>
    </div>
  )
}
