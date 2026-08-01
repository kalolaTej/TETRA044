import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // default mock session for instant UI preview when env vars are missing
      const mockUser = { id: 'demo-user-1', email: 'operator@intrusion.com' }
      setUser(mockUser)
      setSession({ user: mockUser, access_token: 'demo-token' })
      setLoading(false)
      return
    }

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
      })
      .catch(() => {
        // fallback to empty state on network/auth error
        setUser(null)
        setSession(null)
      })
      .finally(() => {
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-user-1', email }
      setUser(mockUser)
      setSession({ user: mockUser, access_token: 'demo-token' })
      return { user: mockUser }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const register = async (name, email, password) => {
    if (!isSupabaseConfigured) {
      const mockUser = { id: 'demo-user-1', email, user_metadata: { name } }
      setUser(mockUser)
      setSession({ user: mockUser, access_token: 'demo-token' })
      return { user: mockUser }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) throw error
    return data
  }

  const logout = async () => {
    if (!isSupabaseConfigured) {
      setUser(null)
      setSession(null)
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
