import { createContext, useContext, useEffect, useState } from 'react'

const SiteThemeContext = createContext(null)

function getInitialTheme() {
  try {
    return localStorage.getItem('portfolio-theme') === 'dark'
  } catch {
    return false
  }
}

export function SiteThemeProvider({ children }) {
  const [dark, setDark] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', dark)
    try {
      localStorage.setItem('portfolio-theme', dark ? 'dark' : 'light')
    } catch {
      // Storage may be unavailable; the in-memory theme still works.
    }
  }, [dark])

  return (
    <SiteThemeContext.Provider value={{ dark, setDark }}>
      {children}
    </SiteThemeContext.Provider>
  )
}

export function useSiteTheme() {
  const theme = useContext(SiteThemeContext)
  if (!theme) {
    throw new Error('useSiteTheme must be used inside SiteThemeProvider')
  }
  return theme
}
