import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

// ─── localStorage helpers ───────────────────────────────────────────────────

const storage = {
  get: (key) => {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value) } catch { /* noop */ }
  },
  remove: (key) => {
    try { localStorage.removeItem(key) } catch { /* noop */ }
  }
}

// ─── Token helpers ───────────────────────────────────────────────────────────

const validateToken = (token) => {
  if (!token) return null
  try {
    const decoded = jwtDecode(token)
    const now = Date.now() / 1000
    if (decoded.exp && decoded.exp < now) {
      console.warn('Token expired')
      return null
    }
    return decoded
  } catch {
    return null
  }
}

// ─── Persisted user helpers ─────────────────────────────────────────────────
// The JWT only carries id/email/role, so prefer the full user profile saved at
// login (keeps name, profilePhoto, etc.) when it matches the token's role.

const getPersistedUser = (decoded) => {
  try {
    const raw = storage.get('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const user = parsed?.state?.user
    return user && user.id && user.role === decoded.role ? user : null
  } catch (error) {
    return null
  }
}

// ─── Read persisted session synchronously from localStorage ─────────────────
// This runs once at module load time, before any component mounts,
// so the initial store state is already correct on first render.

const loadPersistedSession = () => {
  const token = storage.get('token')
  const decoded = validateToken(token)
  if (decoded) {
    const user = getPersistedUser(decoded) || decoded
    return { token, user, role: user.role, isAuthenticated: true }
  }
  // Token missing or expired — clean up
  storage.remove('token')
  storage.remove('auth-storage')
  return { token: null, user: null, role: null, isAuthenticated: false }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => ({
  // Initialise synchronously — no async, no hydration delay
  ...loadPersistedSession(),

  // Always true because we load synchronously above.
  // ProtectedRoute checks this to stay compatible with any cached imports.
  hasHydrated: true,

  login: (token, user) => {
    storage.set('token', token)
    // Persist the full user profile (name, profilePhoto, phone) so a page
    // refresh restores it instead of falling back to the JWT-only payload
    storage.set('auth-storage', JSON.stringify({ state: { user } }))
    set({ token, user, role: user.role, isAuthenticated: true })
  },

  logout: () => {
    storage.remove('token')
    storage.remove('auth-storage')
    set({ token: null, user: null, role: null, isAuthenticated: false })
  },

  setUser: (user) => {
    if (user) {
      storage.set('auth-storage', JSON.stringify({ state: { user } }))
    } else {
      storage.remove('auth-storage')
    }
    set({ user, role: user?.role })
  },

  // Called on app mount — re-validates token expiry (catches expiry while tab was closed)
  restoreSession: () => {
    const { token } = get()
    const decoded = validateToken(token)
    if (decoded) {
      const user = getPersistedUser(decoded) || decoded
      set({ user, role: user.role, isAuthenticated: true })
    } else {
      storage.remove('token')
      storage.remove('auth-storage')
      set({ token: null, user: null, role: null, isAuthenticated: false })
    }
  }
}))

// ─── Language store ──────────────────────────────────────────────────────────

export const useLanguageStore = create((set) => ({
  language: storage.get('language') || 'en',
  setLanguage: (lang) => {
    storage.set('language', lang)
    set({ language: lang })
  }
}))
