import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true while we verify a stored token on boot (avoids a guest-navbar flash)
  const [loading, setLoading] = useState(() => !!tokenStore.get())
  const [modal, setModal] = useState(null) // null | 'login' | 'register'
  const pending = useRef(null)

  const clearSession = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  const saveSession = ({ user, token }) => {
    tokenStore.set(token)
    setUser(user)
    setModal(null)
    // resume the protected action that triggered auth
    const action = pending.current
    pending.current = null
    action?.()
  }

  // Restore session on boot
  useEffect(() => {
    if (!tokenStore.get()) return
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {}) // 401 already handled: client calls onUnauthorized, which clears the token
      .finally(() => setLoading(false))
  }, [])

  // 401 on a protected request = stale/expired token
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setModal('login')
    })
  }, [clearSession])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore: the API says to clear the token regardless of the response
    } finally {
      clearSession()
    }
  }, [clearSession])

  // Re-fetch the profile (call after saving the profile form)
  const refreshUser = useCallback(async () => {
    const res = await authApi.me()
    setUser(res.data)
    return res.data
  }, [])

  const openModal = (name) => setModal(name)
  const closeModal = useCallback(() => {
    setModal(null)
    pending.current = null
  }, [])

  const requireAuth = (action) => {
    if (user) return action()
    pending.current = action
    setModal('login')
  }

  const register = async (form) => saveSession((await authApi.register(form)).data)
  const login = async (email, pw) => saveSession((await authApi.login(email, pw)).data)

  return (
    <AuthContext.Provider
      value={{ user, loading, modal, openModal, closeModal, requireAuth, register, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}