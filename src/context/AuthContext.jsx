import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { setUnauthorizedHandler, tokenStore } from '../api/client'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('kino_user') || 'null'))
  const [modal, setModal] = useState(null) // null | 'login' | 'register'
  const pending = useRef(null)

  const saveSession = ({ user, token }) => {
    tokenStore.set(token)
    localStorage.setItem('kino_user', JSON.stringify(user))
    setUser(user)
    setModal(null)
    // resume the protected action that triggered auth
    const action = pending.current
    pending.current = null
    action?.()
  }

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem('kino_user')
    setUser(null)
  }, [])

  const openModal = (name) => setModal(name)
  const closeModal = () => { setModal(null); pending.current = null }

  const requireAuth = (action) => {
    if (user) return action()
    pending.current = action
    setModal('login')
  }

  // 401 with an existing token = expired session
  useEffect(() => {
    setUnauthorizedHandler(() => { logout(); setModal('login') })
  }, [logout])

  const register = async (form) => saveSession((await authApi.register(form)).data)
  const login = async (email, pw) => saveSession((await authApi.login(email, pw)).data)

  return (
    <AuthContext.Provider value={{ user, modal, openModal, closeModal, requireAuth, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}