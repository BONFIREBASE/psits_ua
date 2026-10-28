'use client'

import React, { useEffect } from 'react'
import LottiePlayer from './LottiePlayer'

export default function MaintenanceAnimation() {
  useEffect(() => {
    // Lock body scroll while maintenance screen is active
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div className="relative w-full max-w-[190px] xs:max-w-[220px] sm:max-w-[280px] md:max-w-[340px] max-h-[22vh] aspect-[4/3] mx-auto flex items-center justify-center">
      <LottiePlayer
        src={encodeURI('/assets/Maintenance web.json')}
        className="w-full h-full"
        animationClassName="drop-shadow-[0_15px_35px_rgba(245,166,35,0.2)]"
        placeholder={
          <div className="w-full h-full rounded-2xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 animate-pulse flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-gold/10 animate-pulse" />
          </div>
        }
      />
    </div>
  )
}
