import { useState } from 'react'
import { useAuth } from '../AuthContext'

export default function PinLogin() {
  const { tryUnlock } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function press(d) {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      setTimeout(() => {
        if (!tryUnlock(next)) {
          setError(true)
          setPin('')
        }
      }, 120)
    }
  }

  function backspace() {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  return (
    <div className="pin-screen">
      <div className="lock">🔒</div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>Aadidev Medical Store</div>
      <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 2 }}>Staff / owner access only</div>

      <div className="pin-dots">
        {[0, 1, 2, 3].map(i => (
          <span key={i} className={i < pin.length ? 'filled' : ''} />
        ))}
      </div>
      {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>Incorrect PIN, try again.</div>}

      <div className="pin-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} onClick={() => press(String(n))}>
            {n}
          </button>
        ))}
        <span />
        <button onClick={() => press('0')}>0</button>
        <button onClick={backspace}>⌫</button>
      </div>
    </div>
  )
}
