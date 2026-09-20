'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { AnimationItem } from 'lottie-web'

export default function NotFoundAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Lock body scroll while 404 screen is active
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    let animInstance: AnimationItem | null = null
    let isCancelled = false

    async function initLottie() {
      try {
        const lottieModule = await import('lottie-web')
        if (isCancelled || !containerRef.current) return

        const res = await fetch(encodeURI('/assets/404 error.json'))
        if (!res.ok) return
        const animData = await res.json()

        if (isCancelled || !containerRef.current) return

        animInstance = lottieModule.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: animData,
        })
        setLoaded(true)
      } catch (err) {
        console.warn('404 Lottie animation notice:', err)
      }
    }

    initLottie()

    return () => {
      isCancelled = true
      document.body.style.overflow = originalOverflow
      if (animInstance) animInstance.destroy()
    }
  }, [])

  return (
    <div className="relative w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[420px] md:max-w-[460px] aspect-[373/162] mx-auto flex items-center justify-center">
      <div
        ref={containerRef}
        className={`w-full h-full pointer-events-none drop-shadow-[0_15px_35px_rgba(245,166,35,0.15)] transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-display font-black text-6xl sm:text-7xl md:text-8xl text-foreground-theme tracking-tight opacity-20 animate-pulse">
            404
          </span>
        </div>
      )}
    </div>
  )
}
