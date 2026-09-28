'use client'

import React, { useEffect, useRef, useState } from 'react'
import LottiePlayer from './LottiePlayer'

export default function NotFoundAnimation() {
  useEffect(() => {
    // Lock body scroll while 404 screen is active
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div className="relative w-full max-w-[320px] xs:max-w-[360px] sm:max-w-[420px] md:max-w-[460px] aspect-[373/162] mx-auto flex items-center justify-center">
      <LottiePlayer
        src={encodeURI('/assets/404 error.json')}
        className="w-full h-full"
        animationClassName="drop-shadow-[0_15px_35px_rgba(245,166,35,0.15)]"
        placeholder={
          <span className="font-display font-black text-6xl sm:text-7xl md:text-8xl text-foreground-theme tracking-tight opacity-20 animate-pulse">
            404
          </span>
        }
      />
    </div>
  )
}
