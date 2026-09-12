import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)
const OWNER_PIN = import.meta.env.VITE_OWNER_PIN || '1234'

export function AuthProvider({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('ams_owner_unlocked') === '1')

  function tryUnlock(pin) {
    if (pin === OWNER_PIN) {
      sessionStorage.setItem('ams_owner_unlocked', '1')
      setUnlocked(true)
      return true
    }
    return false
  }

  function lock() {
    sessionStorage.removeItem('ams_owner_unlocked')
    setUnlocked(false)
  }

  return <AuthContext.Provider value={{ unlocked, tryUnlock, lock }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
