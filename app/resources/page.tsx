'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LottiePlayer from '@/components/LottiePlayer'

export default function ResourcesPage() {
  useEffect(() => {
    // Lock body scroll while Resources page is active
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-10 bg-canvas text-text flex items-center justify-center px-6 pt-16 sm:pt-20 overflow-hidden select-none">
      {/* Subtle ambient radial glow identical to 404 */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.06] rounded-full blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-4">
        {/* PSITS Official Logo */}
        <Link
          href="/"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
          aria-label="PSITS-UA Home"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto drop-shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:scale-105 transition-transform shrink-0">
            <Image
              src="/assets/logo/PSITS logo.png"
              alt="PSITS-UA Logo"
              fill
              sizes="(max-width: 640px) 56px, 64px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Maintenance Lottie Graphic */}
        <div className="relative w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] aspect-[16/10] mx-auto flex items-center justify-center">
          <LottiePlayer
            src="/assets/Maintenance%20web.json"
            className="w-full h-full"
            animationClassName="drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Under Construction Typography & Clear Description Only */}
        <div className="space-y-2">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-text tracking-tight uppercase">
            Under <span className="text-gold">Construction</span>
          </h1>
          <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-sm sm:max-w-md mx-auto font-normal pt-1">
            We&apos;re currently putting together this Resources page for BSINFO students, where you can easily find lecture materials, official department forms, and project guides in one place. We&apos;re still organizing the files, but it will be ready for everyone soon.
          </p>
        </div>
      </div>
    </div>
  )
}
