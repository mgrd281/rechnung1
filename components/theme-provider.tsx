'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { applyTheme, initializeTheme, type Theme } from '@/lib/theme'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  const setTheme = (newTheme: Theme) => {
    console.log('ThemeProvider: Setting theme to', newTheme)
    setThemeState(newTheme)
    applyTheme(newTheme)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  useEffect(() => {
    // Load theme from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        console.log('ThemeProvider: Loading saved theme', savedTheme)
        setThemeState(savedTheme)
        applyTheme(savedTheme)
      } else {
        // Apply default theme
        console.log('ThemeProvider: Applying default theme', defaultTheme)
        applyTheme(defaultTheme)
      }
    }
  }, [defaultTheme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
