'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { preload } from 'react-dom'
import { getTimeGreeting } from '@/lib/kasubayGreetings'
import { startProgressiveMascotPreload } from '@/lib/kasubayPreload'

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getReducedMotionServerSnapshot() {
  return false
}

interface KasubayHeroNestProps {
  stage?: 'hero' | 'leaping' | 'patrol'
  onStartLeap?: () => void
  onLeapComplete?: () => void
}

export default function KasubayHeroNest({
  stage = 'hero',
  onStartLeap,
  onLeapComplete,
}: KasubayHeroNestProps) {
  // Speculative preload hints for the HTML scanner
  preload('/assets/kasubay/kasubay-cheer.png', { as: 'image' })
  preload('/assets/kasubay/kasubay-sit.png', { as: 'image' })

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  const [bubble, setBubble] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [leanFrame, setLeanFrame] = useState<0 | 1>(0)

  // Progressive background preloader: Tier 1 rasterized immediately, Tier 2 sequential on idle
  useEffect(() => {
    startProgressiveMascotPreload()
  }, [])

  // Gentle idle leaning shift between lean-0 and lean-1
  useEffect(() => {
    if (reducedMotion || stage !== 'hero') return
    const interval = setInterval(() => {
      setLeanFrame((prev) => (prev === 0 ? 1 : 0))
    }, 3400)
    return () => clearInterval(interval)
  }, [reducedMotion, stage])

  // Listen for initial scroll to trigger wake & jump down
  useEffect(() => {
    if (reducedMotion || stage !== 'hero') return

    let triggered = false
    const handleScroll = () => {
      if (triggered) return
      if (window.scrollY > 25) {
        triggered = true
        onStartLeap?.()
        setBubble(null)

        // After jump dive completes (500ms), hand off to stats card patrol
        setTimeout(() => {
          onLeapComplete?.()
        }, 500)
      }
    }

    // Trigger immediately if page loads already scrolled past hero
    if (window.scrollY > 25) {
      handleScroll()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [stage, reducedMotion, onStartLeap, onLeapComplete])

  // Dynamically rotate greetings every 4.2s while speech bubble is visible
  useEffect(() => {
    if (!bubble && !isHovered) return
    const timer = setInterval(() => {
      setBubble((prev) => getTimeGreeting(prev))
    }, 4200)
    return () => clearInterval(timer)
  }, [bubble, isHovered])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setBubble((prev) => getTimeGreeting(prev))
  }, [])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    setBubble((prev) => prev ?? getTimeGreeting())
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  if (stage === 'patrol' || reducedMotion) return null

  const isLeaping = stage === 'leaping'

  return (
    <div
      className="absolute bottom-[20%] xs:bottom-[22%] sm:bottom-[24%] left-1/2 -translate-x-[46%] pointer-events-auto cursor-pointer z-20 select-none"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-[34px] h-[38px] xs:w-[42px] xs:h-[48px] sm:w-[54px] sm:h-[62px] md:w-[66px] md:h-[75px] origin-bottom"
        animate={
          isLeaping
            ? {
                y: [-6, -32, 140],
                opacity: [1, 1, 0],
                scale: [1, 1.15, 0.7],
              }
            : {
                y: [0, -3, 0],
              }
        }
        transition={
          isLeaping
            ? {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }
            : {
                duration: 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <Image
          src={
            isLeaping
              ? '/assets/kasubay/kasubay-cheer.png'
              : leanFrame === 0
                ? '/assets/kasubay/lay/lean-0.png'
                : '/assets/kasubay/lay/lean-1.png'
          }
          alt="KasUbAy lounging on UA"
          fill
          sizes="(max-width: 640px) 46px, 72px"
          className="object-contain object-bottom drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]"
          priority
          unoptimized
        />
      </motion.div>

      {/* Dynamic Speech Bubble: Centered above mascot with clear headroom below top badge */}
      <AnimatePresence>
        {(bubble || (!isLeaping && isHovered)) && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: -2, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none"
          >
            <div className="relative px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-md border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-100 shadow-md text-[10px] sm:text-xs font-medium tracking-tight">
              {bubble || getTimeGreeting()}
              {/* Pointer arrow on the bottom pointing down at KasUbAy */}
              <div
                aria-hidden="true"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white/95 dark:bg-[#0D1117]/95 border-r border-b border-black/10 dark:border-white/15"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
