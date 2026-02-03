/**
 * Store Zustand pour la gestion de l'authentification admin
 * Utilise le localStorage pour persister l'état d'authentification
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/lib/api'
import { getToken, removeToken, setToken } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      login: (user: User, token: string) => {
        setToken(token)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        removeToken()
        set({ user: null, token: null, isAuthenticated: false })
      },
      setUser: (user: User) => {
        set({ user })
      },
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state })
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

