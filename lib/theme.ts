// Theme management utilities
export type Theme = 'light' | 'dark' | 'auto'

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  
  // Remove existing theme classes
  root.classList.remove('dark', 'light')
  
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.add('light')
  } else if (theme === 'auto') {
    // Auto theme based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.add('light')
    }
  }
  
  console.log('Theme applied:', theme, 'Classes:', root.classList.toString())
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function initializeTheme(theme: Theme) {
  if (typeof window !== 'undefined') {
    applyTheme(theme)
    
    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        applyTheme('auto')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      
      // Return cleanup function
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }
}
