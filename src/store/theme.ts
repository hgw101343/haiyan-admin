import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeConfig } from '../api'

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#ff6b35',
  primaryLight: '#ff9a5c',
  primaryDark: '#e55a2b',
  backgroundColor: '#f5f5f5',
  cardColor: '#ffffff',
  textColor: '#333333',
  textSecondary: '#999999',
  navBarBgColor: '#ff6b35',
  navBarTextStyle: 'white',
  tabBarSelectedColor: '#ff6b35',
  tabBarColor: '#999999',
  tabBarBgColor: '#ffffff',
  borderColor: '#e8e8e8',
  successColor: '#52c41a',
  warningColor: '#faad14',
  errorColor: '#ff4d4f',
}

interface ThemeState {
  theme: ThemeConfig
  setTheme: (theme: ThemeConfig) => void
  resetTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      setTheme: (theme) => set({ theme }),
      resetTheme: () => set({ theme: DEFAULT_THEME }),
    }),
    {
      name: 'food-admin-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
