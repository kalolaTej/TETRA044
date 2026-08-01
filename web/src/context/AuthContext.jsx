import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const defaultOperator = { id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a', email: 'operator@intrusion.com', name: 'Farm Operator' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(defaultOperator)
  const [session, setSession] = useState({ user: defaultOperator, access_token: 'default-token' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Keep user logged in by default
    setUser(defaultOperator)
    setSession({ user: defaultOperator, access_token: 'default-token' })
    setLoading(false)
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
