'use client'

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore, useRef } from 'react'

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
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

function getStoredThemeServerSnapshot(): Theme {
  return 'dark'
}

interface LegacyMediaQueryList {
  addListener?: (listener: () => void) => void
  removeListener?: (listener: () => void) => void
}

interface ViewTransitionInstance {
  ready?: Promise<void>
  finished?: Promise<void>
  updateCallbackDone?: Promise<void>
  skipTransition?: () => void
}

interface DocumentWithViewTransition {
  startViewTransition?: (callback: () => void | Promise<void>) => ViewTransitionInstance
}

function subscribeSystem(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }
  const legacyMql = mql as unknown as LegacyMediaQueryList
  if (typeof legacyMql.addListener === 'function') {
    legacyMql.addListener(callback)
    return () => legacyMql.removeListener?.(callback)
  }
  return () => {}
}

function getSystemSnapshot(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
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

function executeWithThemeTransition(callback: () => void) {
  if (typeof document === 'undefined') {
    callback()
    return
  }

  const isReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (isReducedMotion) {
    callback()
    return
  }

  // Modern browsers (Brave, Chrome, Edge, Safari 18+) supporting native View Transitions API
  const doc = document as unknown as DocumentWithViewTransition
  if (typeof doc.startViewTransition === 'function') {
    try {
      const transition = doc.startViewTransition(() => {
        callback()
      })

      if (transition && typeof transition === 'object') {
        // Silently catch AbortError if a new transition supersedes this one
        transition.ready?.catch(() => {})
        transition.finished?.catch(() => {})
      }
      return
    } catch {
      // Fall through to CSS fallback
    }
  }

  // Fallback for browsers without View Transitions API
  const root = document.documentElement
  root.classList.add('theme-transitioning')
  callback()
  setTimeout(() => {
    root.classList.remove('theme-transitioning')
  }, 350)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getStoredThemeSnapshot, getStoredThemeServerSnapshot)
  const systemTheme = useSyncExternalStore(subscribeSystem, getSystemSnapshot, getSystemServerSnapshot)
  const isManualChangeRef = useRef(false)

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : (theme as ResolvedTheme)
  const currentResolvedThemeRef = useRef<ResolvedTheme>(resolvedTheme)

  useEffect(() => {
    currentResolvedThemeRef.current = resolvedTheme

    if (isManualChangeRef.current) {
      isManualChangeRef.current = false
      return
    }

    // Quietly synchronize DOM attribute on mount or cross-tab storage sync without triggering animation
    applyThemeDom(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    isManualChangeRef.current = true
    const nextResolvedTheme: ResolvedTheme =
      newTheme === 'system'
        ? (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : (newTheme as ResolvedTheme)

    // Synchronously track the new resolved theme so subsequent rapid clicks alternate correctly
    currentResolvedThemeRef.current = nextResolvedTheme

    // Update storage and listeners immediately to ensure React components receive the flip
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // Ignore storage write errors
    }
    themeListeners.forEach((fn) => fn())

    // Run smooth visual transition
    executeWithThemeTransition(() => {
      applyThemeDom(nextResolvedTheme)
    })
  }, [])

  const toggleTheme = useCallback(() => {
    // Strictly 2-state toggle: Dark <-> Light
    // Check synchronous tracker / DOM state to guarantee 1 click = 1 flip, 2 clicks = full rotation
    const current: ResolvedTheme =
      typeof document !== 'undefined'
        ? ((document.documentElement.getAttribute('data-theme') as ResolvedTheme) || currentResolvedThemeRef.current)
        : resolvedTheme

    const nextTheme: ResolvedTheme = current === 'dark' ? 'light' : 'dark'
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
    var resolved = (stored === 'light' || stored === 'dark') ? stored : 'dark';
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
