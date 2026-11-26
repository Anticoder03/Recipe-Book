import { useCallback, useEffect, useMemo, useState } from 'react'
import client from '../api/client'
import { AuthContext } from './authContext'

function readStoredUser() {
  try {
    const value = localStorage.getItem('rb_user')
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('rb_token'))
  const [user, setUser] = useState(readStoredUser)
  // Only a stored token without a cached user needs a network check on mount.
  const [checking, setChecking] = useState(() => Boolean(token && !user))

  const persist = useCallback((nextToken, nextUser) => {
    localStorage.setItem('rb_token', nextToken)
    localStorage.setItem('rb_user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
    setChecking(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('rb_token')
    localStorage.removeItem('rb_user')
    setToken(null)
    setUser(null)
    setChecking(false)
  }, [])

  useEffect(() => {
    if (!token || user) return undefined

    let active = true

    client
      .get('/auth/me')
      .then(({ data }) => {
        if (active) {
          persist(token, data.user)
        }
      })
      .catch(() => {
        if (active) {
          logout()
        }
      })

    return () => {
      active = false
    }
  }, [token, user, persist, logout])

  const login = useCallback(
    async (credentials) => {
      const { data } = await client.post('/auth/login', credentials)
      persist(data.token, data.user)
      return data
    },
    [persist]
  )

  const signup = useCallback(
    async (details) => {
      const { data } = await client.post('/auth/signup', details)
      persist(data.token, data.user)
      return data
    },
    [persist]
  )

  const value = useMemo(
    () => ({ token, user, checking, login, signup, logout }),
    [token, user, checking, login, signup, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
