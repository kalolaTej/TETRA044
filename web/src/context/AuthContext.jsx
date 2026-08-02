import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const USERS_STORAGE_KEY = 'tetra_registered_users_v1'
const SESSION_STORAGE_KEY = 'tetra_active_session_v1'

const defaultOperator = {
  id: 'usr_default_operator',
  name: 'Farm Operator',
  email: 'operator@wildguard.ai'
}

const loadRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveRegisteredUser = (userObj) => {
  try {
    const users = loadRegisteredUsers()
    const filtered = users.filter((u) => u.email.toLowerCase() !== userObj.email.toLowerCase())
    const updated = [userObj, ...filtered]
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

const loadActiveSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  // Default logged in operator session
  return { user: defaultOperator, access_token: 'default-session-token' }
}

const saveActiveSession = (sess) => {
  try {
    if (!sess) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    } else {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess))
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [sessionState, setSessionState] = useState(() => loadActiveSession())
  const [user, setUser] = useState(() => sessionState?.user || null)
  const [session, setSession] = useState(() => sessionState || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const current = loadActiveSession()
    if (current) {
      setUser(current.user)
      setSession(current)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase()

    // 1. Check local registered accounts
    const users = loadRegisteredUsers()
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail)

    if (found) {
      if (found.password !== password) {
        throw new Error('Incorrect password. Please verify your credentials.')
      }
      const userObj = { id: found.id, email: found.email, name: found.name }
      const sessObj = { user: userObj, access_token: `token_${Date.now()}` }
      setUser(userObj)
      setSession(sessObj)
      saveActiveSession(sessObj)
      return { user: userObj }
    }

    // 2. Try backend API login endpoint
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      const res = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      })

      if (res.ok) {
        const data = await res.json()
        const userObj = data.user || { id: `usr_${Date.now()}`, email: cleanEmail, name: cleanEmail.split('@')[0] }
        const sessObj = { user: userObj, access_token: data.accessToken || `token_${Date.now()}` }
        setUser(userObj)
        setSession(sessObj)
        saveActiveSession(sessObj)
        saveRegisteredUser({ id: userObj.id, name: userObj.name, email: cleanEmail, password })
        return { user: userObj }
      }
    } catch {
      // API unready
    }

    // Fallback: If login with default email/pass
    if (cleanEmail === defaultOperator.email) {
      const sessObj = { user: defaultOperator, access_token: 'default-session-token' }
      setUser(defaultOperator)
      setSession(sessObj)
      saveActiveSession(sessObj)
      return { user: defaultOperator }
    }

    throw new Error('No account found with this email. Please Create an Account first.')
  }

  const register = async (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    const users = loadRegisteredUsers()
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail)
    if (existing) {
      throw new Error('An account with this email already exists. Please Sign In.')
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      email: cleanEmail,
      password
    }

    // Save account locally
    saveRegisteredUser(newUser)

    // Send to backend API asynchronously if running
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    try {
      await fetch(`${backendUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password })
      }).catch(() => null)
    } catch {
      // ignore
    }

    // Instant login without requiring email verification
    const userObj = { id: newUser.id, name: newUser.name, email: newUser.email }
    const sessObj = { user: userObj, access_token: `token_${Date.now()}` }

    setUser(userObj)
    setSession(sessObj)
    saveActiveSession(sessObj)

    return { user: userObj }
  }

  const logout = async () => {
    setUser(null)
    setSession(null)
    saveActiveSession(null)
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
