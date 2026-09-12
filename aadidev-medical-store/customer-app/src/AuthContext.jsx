import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    if (!supabaseReady) return { error: 'Supabase not connected yet.' }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message }
  }

  async function signIn(email, password) {
    if (!supabaseReady) return { error: 'Supabase not connected yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  async function signOut() {
    if (!supabaseReady) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
