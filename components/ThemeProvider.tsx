'use client'

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'psits-theme'

const themeListeners = new Set<() => void>()

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    themeListeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}

function getStoredThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {}
  return 'dark'
}

function getStoredThemeServerSnapshot(): Theme {
  return 'dark'
}

function subscribeSystem(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSystemSnapshot(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getSystemServerSnapshot(): ResolvedTheme {
  return 'dark'
}

function applyThemeDom(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  if (resolved === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getStoredThemeSnapshot, getStoredThemeServerSnapshot)
  const systemTheme = useSyncExternalStore(subscribeSystem, getSystemSnapshot, getSystemServerSnapshot)

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : (theme as ResolvedTheme)

  useEffect(() => {
    applyThemeDom(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Ignore storage write errors
    }
    themeListeners.forEach((fn) => fn())
  }, [])

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var resolved = 'dark';
    if (stored === 'light' || stored === 'dark') {
      resolved = stored;
    } else if (stored === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = 'dark';
    }
    var root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    root.style.colorScheme = resolved;
  } catch (e) {}
})();
`.trim()
