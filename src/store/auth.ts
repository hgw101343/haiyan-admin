import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  adminInfo: { id: number; username: string; name: string } | null
  setAuth: (token: string, adminInfo: AuthState['adminInfo']) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      adminInfo: null,
      setAuth: (token, adminInfo) => set({ token, adminInfo }),
      logout: () => set({ token: null, adminInfo: null }),
    }),
    { name: 'food-admin-auth' }
  )
)
