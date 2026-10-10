'use client'

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore, useRef } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface SolarDetails {
  theme: ResolvedTheme
  isDaylight: boolean
  sunriseHour: number
  sunsetHour: number
}

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'psits-theme'

// Coordinates for Sibalom, Antique, Philippines
const ANTIQUE_LAT = 10.78
const ANTIQUE_LNG = 122.01

/**
 * Computes astronomical solar sunrise and sunset for Sibalom, Antique, Philippines (UTC+8).
 * Uses standard NOAA solar positioning equations.
 */
export function getPhilippineSolarDetails(date = new Date()): SolarDetails {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI

  // Anchor to Philippine Standard Time (UTC+8)
  const pht = new Date(date.getTime() + 8 * 3600000)
  const y = pht.getUTCFullYear()
  const startOfYear = new Date(Date.UTC(y, 0, 1))
  const dayOfYear = Math.floor((pht.getTime() - startOfYear.getTime()) / 86400000) + 1
  const lngHour = ANTIQUE_LNG / 15

  function calcSolarHour(isRise: boolean): number {
    const t = dayOfYear + ((isRise ? 6 : 18) - lngHour) / 24
    const M = 0.9856 * t - 3.289
    let L = M + 1.916 * Math.sin(toRad(M)) + 0.02 * Math.sin(toRad(2 * M)) + 282.634
    L = ((L % 360) + 360) % 360

    let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))))
    RA = ((RA % 360) + 360) % 360
    const Lquadrant = Math.floor(L / 90) * 90
    const RAquadrant = Math.floor(RA / 90) * 90
    RA = (RA + (Lquadrant - RAquadrant)) / 15

    const sinDec = 0.39782 * Math.sin(toRad(L))
    const cosDec = Math.cos(Math.asin(sinDec))
    const cosH = (Math.cos(toRad(90.8333)) - sinDec * Math.sin(toRad(ANTIQUE_LAT))) / (cosDec * Math.cos(toRad(ANTIQUE_LAT)))

    if (cosH > 1 || cosH < -1) return isRise ? 5.75 : 18.0

    let H = isRise ? 360 - toDeg(Math.acos(cosH)) : toDeg(Math.acos(cosH))
    H = H / 15

    const T = H + RA - 0.06571 * t - 6.622
    let UT = T - lngHour
    UT = ((UT % 24) + 24) % 24
    return (UT + 8) % 24
  }

  const sunriseHour = calcSolarHour(true)
  const sunsetHour = calcSolarHour(false)
  const currentPHT = pht.getUTCHours() + pht.getUTCMinutes() / 60 + pht.getUTCSeconds() / 3600

  const isDaylight = currentPHT >= sunriseHour && currentPHT < sunsetHour
  return {
    theme: isDaylight ? 'light' : 'dark',
    isDaylight,
    sunriseHour,
    sunsetHour,
  }
}

export function getPhilippineSolarTheme(date = new Date()): ResolvedTheme {
  return getPhilippineSolarDetails(date).theme
}

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
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'system'
}

function getStoredThemeServerSnapshot(): Theme {
  return 'system'
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
  if (typeof window === 'undefined') return () => {}

  let lastTheme = getPhilippineSolarTheme()

  const checkSolar = () => {
    const currentTheme = getPhilippineSolarTheme()
    if (currentTheme !== lastTheme) {
      lastTheme = currentTheme
      callback()
    }
  }

  // Poll solar calculation every 60 seconds for smooth sunrise/sunset transitions
  const intervalId = window.setInterval(checkSolar, 60000)

  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      checkSolar()
    }
  }

  window.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('focus', checkSolar)

  return () => {
    window.clearInterval(intervalId)
    window.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('focus', checkSolar)
  }
}

function getSystemSnapshot(): ResolvedTheme {
  return getPhilippineSolarTheme()
}

function getSystemServerSnapshot(): ResolvedTheme {
  return getPhilippineSolarTheme()
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
        ? getPhilippineSolarTheme()
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

export const themeScript = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}'),r;if(s==='light'||s==='dark'){r=s;}else{var d=new Date(),p=new Date(d.getTime()+28800000),y=p.getUTCFullYear(),doy=Math.floor((p.getTime()-Date.UTC(y,0,1))/86400000)+1,lh=122.01/15;function c(rise){var t=doy+((rise?6:18)-lh)/24,M=0.9856*t-3.289,rad=Math.PI/180,L=((M+1.916*Math.sin(M*rad)+0.02*Math.sin(2*M*rad)+282.634)%360+360)%360,RA=((Math.atan(0.91764*Math.tan(L*rad))*180/Math.PI)%360+360)%360,adj=(RA+(Math.floor(L/90)*90-Math.floor(RA/90)*90))/15,sD=0.39782*Math.sin(L*rad),cD=Math.cos(Math.asin(sD)),cH=(Math.cos(90.8333*rad)-sD*Math.sin(10.78*rad))/(cD*Math.cos(10.78*rad));if(cH>1||cH<-1)return rise?5.75:18.0;var H=(rise?360-Math.acos(cH)*180/Math.PI:Math.acos(cH)*180/Math.PI)/15,UT=((H+adj-0.06571*t-6.622-lh)%24+24)%24;return(UT+8)%24;}var cur=p.getUTCHours()+p.getUTCMinutes()/60+p.getUTCSeconds()/3600;r=(cur>=c(true)&&cur<c(false))?'light':'dark';}var root=document.documentElement;root.setAttribute('data-theme',r);if(r==='dark'){root.classList.add('dark');root.classList.remove('light');}else{root.classList.add('light');root.classList.remove('dark');}root.style.colorScheme=r;}catch(e){}})();`
