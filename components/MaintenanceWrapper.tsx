'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import Image from 'next/image'
import type { AnimationItem } from 'lottie-web'

// Target lift-off timestamp: Monday, September 21, 2026 at 00:00:00 PHT (UTC+8)
const LIFT_OFF_DATE_STRING = '2026-09-21T00:00:00+08:00'
const LIFT_OFF_TIMESTAMP = new Date(LIFT_OFF_DATE_STRING).getTime()

function getTimeSnapshot() {
  const now = Date.now()
  const diff = LIFT_OFF_TIMESTAMP - now
  if (diff <= 0) {
    return '0:0:0:0:1'
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  return `${days}:${hours}:${minutes}:${seconds}:0`
}

function subscribeSecondTimer(callback: () => void) {
  const interval = setInterval(callback, 1000)
  return () => clearInterval(interval)
}

function getIsBypassed() {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'development') return true
  const params = new URLSearchParams(window.location.search)
  if (params.get('bypass') === 'true') return true


  const host = window.location.hostname
  const isLocalOrPreview =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('-git-') ||
    host.includes('preview') ||
    (host.endsWith('.vercel.app') &&
      !host.startsWith('psitsua.vercel.app') &&
      !host.startsWith('psits-ua.vercel.app'))

  return isLocalOrPreview
}

function subscribeBypass(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

export default function MaintenanceWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const timeSnapshot = useSyncExternalStore(
    subscribeSecondTimer,
    getTimeSnapshot,
    () => '0:0:0:0:0'
  )

  const [days, hours, minutes, seconds, passedFlag] = timeSnapshot.split(':')
  const isPassed = passedFlag === '1'

  const bypassed = useSyncExternalStore(
    subscribeBypass,
    getIsBypassed,
    () => process.env.NODE_ENV === 'development'
  )

  const lottieContainerRef = useRef<HTMLDivElement>(null)

  // Load Minimalist Lottie Animation
  useEffect(() => {
    if (isPassed || bypassed) return

    let animInstance: AnimationItem | null = null
    let isCancelled = false

    async function initLottie() {
      try {
        const lottieModule = await import('lottie-web')
        if (isCancelled || !lottieContainerRef.current) return

        const res = await fetch('/assets/Maintenance%20web.json')
        if (!res.ok) return
        const animData = await res.json()

        if (isCancelled || !lottieContainerRef.current) return

        animInstance = lottieModule.default.loadAnimation({
          container: lottieContainerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animData,
        })
      } catch (err) {
        console.warn('Lottie maintenance load note:', err)
      }
    }

    initLottie()

    return () => {
      isCancelled = true
      if (animInstance) animInstance.destroy()
    }
  }, [isPassed, bypassed])

  // Once Monday September 21, 2026 arrives (or in dev/preview/with ?bypass=true), reveal the application
  if (isPassed || bypassed) {
    return <>{children}</>
  }

  // Pure Minimalist Maintenance View: PSITS Logo, Centered Lottie, and Clean Plain-text Timer
  return (
    <div className="min-h-dvh w-full bg-[#070a12] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-body">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/[0.04] blur-[160px] pointer-events-none rounded-full" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-3xl w-full my-auto space-y-4">
        {/* PSITS Logo */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_0_20px_rgba(245,166,35,0.25)] shrink-0">
          <Image
            src="/assets/logo/PSITS logo.png"
            alt="PSITS-UA Logo"
            fill
            sizes="(max-width: 640px) 56px, 64px"
            className="object-contain"
            priority
          />
        </div>

        {/* Perfectly Centered Responsive Lottie Animation */}
        <div className="w-full max-w-[520px] sm:max-w-[620px] md:max-w-[680px] aspect-[16/9] flex items-center justify-center shrink-0 mx-auto">
          <div
            ref={lottieContainerRef}
            className="w-full h-full pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex items-center justify-center"
          />
        </div>

        {/* Pure Minimalist Typography & Time Only */}
        <div className="space-y-1.5 shrink-0">
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight uppercase text-white leading-tight">
            Under <span className="text-gold">Maintenance</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-white/40 font-mono tracking-[0.25em] uppercase">
            PSITS — University of Antique
          </p>
          <p className="text-xs sm:text-sm text-gold font-mono tracking-[0.25em] pt-2">
            {days}d : {hours}h : {minutes}m : {seconds}s
          </p>
        </div>
      </div>
    </div>
  )
}
