import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

export type Theme = 'light' | 'dark' | 'mocha' | 'forest' | 'pink'

interface ThemeContextData {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextData | null>(null)

const themes: Theme[] = ['light', 'dark', 'mocha', 'forest', 'pink']

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('bible-theme')

    if (themes.includes(stored as Theme)) {
      return stored as Theme
    }
  } catch {
    // Use the default theme if storage is unavailable
  }

  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement

    root.classList.remove(...themes)
    root.classList.add(theme)

    try {
      localStorage.setItem('bible-theme', theme)
    } catch {
      // A aplicação continua funcionando sem persistência.
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme precisa estar dentro do ThemeProvider')
  }

  return context
}
