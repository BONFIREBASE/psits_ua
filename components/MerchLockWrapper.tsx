'use client'

import React, { useEffect, useRef, useSyncExternalStore } from 'react'
import Image from 'next/image'
import type { AnimationItem } from 'lottie-web'

function getIsBypassed() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return params.get('bypass') === 'true'
}

function subscribeBypass(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

export default function MerchLockWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const bypassed = useSyncExternalStore(
    subscribeBypass,
    getIsBypassed,
    () => false
  )

  const lottieContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bypassed) return

    let animInstance: AnimationItem | null = null
    let isCancelled = false

    async function initLottie() {
      try {
        const lottieModule = await import('lottie-web')
        if (isCancelled || !lottieContainerRef.current) return

        const res = await fetch('/assets/store.json')
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
        console.warn('Lottie merch gate notice:', err)
      }
    }

    initLottie()

    return () => {
      isCancelled = true
      if (animInstance) animInstance.destroy()
    }
  }, [bypassed])

  // If ?bypass=true is provided, reveal the store catalog preview
  if (bypassed) {
    return <>{children}</>
  }

  return (
    <div className="relative w-full min-h-[calc(100dvh-120px)] sm:min-h-[calc(100dvh-140px)] bg-canvas text-text flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 select-none overflow-hidden font-body">
      {/* Subtle Ambient Glow matching site aesthetic */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/[0.04] dark:bg-gold/[0.05] blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-navy/20 dark:bg-navy/30 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-2xl w-full my-auto space-y-4">
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

        {/* Centered Lottie Animation from store.json */}
        <div className="w-40 h-40 sm:w-52 sm:h-52 md:w-60 md:h-60 aspect-square flex items-center justify-center shrink-0 mx-auto">
          <div
            ref={lottieContainerRef}
            className="w-full h-full pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex items-center justify-center"
          />
        </div>

        {/* Minimalist Typography */}
        <div className="space-y-2 shrink-0">
          <p className="text-[11px] sm:text-xs text-gold font-mono tracking-[0.25em] uppercase font-semibold">
            Coming Soon
          </p>
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight uppercase text-slate-900 dark:text-white leading-tight">
            Official Merch <span className="text-gold">Store</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed pt-1">
            Department uniforms, official CCIS IT lanyards, and student developer merchandise are currently in
            preparation.
          </p>
        </div>
      </div>
    </div>
  )
}
