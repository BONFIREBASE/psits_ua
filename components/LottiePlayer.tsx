'use client'

import { useEffect, useRef, useState } from 'react'
import type { AnimationItem } from 'lottie-web'

interface LottiePlayerProps {
  /** Path to the Lottie JSON file in /public (e.g. '/assets/timer.json') */
  src: string
  /** Whether to loop the animation (default: true) */
  loop?: boolean
  /** Whether to auto-play (default: true) */
  autoplay?: boolean
  /** Additional CSS classes for the outer wrapper */
  className?: string
  /** Additional CSS classes for the inner animation container */
  animationClassName?: string
  /** Placeholder content shown while the animation loads */
  placeholder?: React.ReactNode
  /** Callback fired when the animation has loaded and is playing */
  onLoaded?: () => void
}

export default function LottiePlayer({
  src,
  loop = true,
  autoplay = true,
  className = '',
  animationClassName = '',
  placeholder,
  onLoaded,
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let animInstance: AnimationItem | null = null
    let isCancelled = false

    async function initLottie() {
      try {
        // Dynamic import keeps lottie-web out of the initial JS bundle
        const lottieModule = await import('lottie-web')
        if (isCancelled || !containerRef.current) return

        // Fetch the JSON animation data
        const res = await fetch(src)
        if (!res.ok) return
        const animData = await res.json()

        if (isCancelled || !containerRef.current) return

        animInstance = lottieModule.default.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          animationData: animData,
        })

        // Signal loaded state after the first frame is rendered
        animInstance.addEventListener('DOMLoaded', () => {
          if (!isCancelled) {
            setLoaded(true)
            onLoaded?.()
          }
        })
      } catch (err) {
        console.warn(`LottiePlayer: Failed to load "${src}":`, err)
      }
    }

    initLottie()

    return () => {
      isCancelled = true
      if (animInstance) animInstance.destroy()
    }
    // src is the primary dependency; loop/autoplay are initial-only config
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return (
    <div className={`relative ${className}`}>
      {/* Animation container — fades in smoothly once loaded */}
      <div
        ref={containerRef}
        className={`w-full h-full pointer-events-none transition-opacity duration-500 ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${animationClassName}`}
      />

      {/* Optional placeholder — crossfades out when animation is ready */}
      {!loaded && placeholder && (
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {placeholder}
        </div>
      )}
    </div>
  )
}
