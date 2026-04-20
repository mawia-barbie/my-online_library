import React, { createContext, useContext, useEffect, useState } from "react"
import { logAuthFlow, logUserState } from "../utils/authDebug"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    logAuthFlow("🚀 AuthProvider mounted - checking token")
    const token = localStorage.getItem("token")
    if (!token) {
      logAuthFlow("❌ No token found in localStorage")
      return
    }
    logAuthFlow("✅ Token found, validating with backend")
    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("not auth")
        return res.json()
      })
      .then((data) => {
        logAuthFlow("✅ User authenticated on mount", { user: data.id })
        logUserState(data, token)
        setUser(data)
      })
      .catch((err) => {
        logAuthFlow("❌ Token validation failed", { error: err.message })
        localStorage.removeItem("token")
        setUser(null)
      })
  }, [])

  const login = async (token) => {
    logAuthFlow("🔑 Login attempt", { token: token.substring(0, 10) + "..." })
    localStorage.setItem("token", token)
    try {
      const res = await fetch("http://127.0.0.1:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("fetch user failed")
      const data = await res.json()
      logAuthFlow("✅ Login successful", { user: data.id })
      logUserState(data, token)
      setUser(data)
      return data
    } catch (err) {
      logAuthFlow("❌ Login failed", { error: err.message })
      localStorage.removeItem("token")
      setUser(null)
      throw err
    }
  }

  const register = async ({ email, password, nickname }) => {
    logAuthFlow("📝 Registration attempt", { email })
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        logAuthFlow("❌ Registration failed", { error: data.detail || data.message })
        return { ok: false, error: data.detail || data.message || 'Registration failed' }
      }

      // attempt to log the user in automatically
      try {
        const loginRes = await fetch("http://127.0.0.1:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        if (loginRes.ok) {
          const loginData = await loginRes.json()
          const token = loginData.access_token || loginData.token || loginData.accessToken
          if (token) {
            logAuthFlow("✅ Auto-login after registration")
            await login(token)
            return { ok: true }
          }
        }
      } catch (err) {
        // ignore login failure, return success for registration
      }

      logAuthFlow("✅ Registration successful")
      return { ok: true }
    } catch (err) {
      logAuthFlow("❌ Registration error", { error: err.message })
      return { ok: false, error: err.message || 'Registration error' }
    }
  }

  const logout = () => {
    logAuthFlow("🚪 Logout")
    localStorage.removeItem("token")
    setUser(null)
  }

  const updateProfile = async (payload) => {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("not authenticated")
    const res = await fetch("http://127.0.0.1:8000/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("update failed")
    // refresh user
    const updated = await (await fetch("http://127.0.0.1:8000/users/me", { headers: { Authorization: `Bearer ${token}` } })).json()
    setUser(updated)
    return updated
  }

  const rateUser = async (targetId, stars, comment) => {
    // best-effort: backend may not implement rating yet — try POST /users/{id}/ratings
    const token = localStorage.getItem("token")
    try {
      await fetch(`http://127.0.0.1:8000/users/${targetId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : undefined },
        body: JSON.stringify({ stars, comment }),
      })
    } catch (err) {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile, rateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
