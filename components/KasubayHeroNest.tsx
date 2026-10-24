'use client'

import { useState, useEffect, useCallback, useSyncExternalStore, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { preload } from 'react-dom'
import { getTimeGreeting, getDefaultTimeGreeting } from '@/lib/kasubayGreetings'
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

export type KasubayHeroVariant = 'sit-u' | 'lay-psits'

interface KasubayHeroNestProps {
  stage?: 'hero' | 'leaping' | 'patrol'
  onStartLeap?: () => void
  onLeapComplete?: () => void
  variant?: KasubayHeroVariant
}

export default function KasubayHeroNest({
  stage = 'hero',
  onStartLeap,
  onLeapComplete,
  variant = 'sit-u',
}: KasubayHeroNestProps) {
  // Speculative preload hints for the HTML scanner
  preload('/assets/kasubay/kasubay-cheer.png', { as: 'image' })
  preload('/assets/kasubay/kasubay-sit.png', { as: 'image' })
  preload('/assets/kasubay/lay/lay-top.png', { as: 'image' })
  preload('/assets/kasubay/lay/lay-0.png', { as: 'image' })

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  )

  const [bubble, setBubble] = useState<string | null>(getDefaultTimeGreeting)
  const [frameIndex, setFrameIndex] = useState<0 | 1>(0)
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isHoveredRef = useRef(false)

  // Progressive background preloader: Tier 1 rasterized immediately, Tier 2 sequential on idle
  useEffect(() => {
    startProgressiveMascotPreload()
  }, [])

  // Gentle idle shift between frame 0 and frame 1
  useEffect(() => {
    if (reducedMotion || stage !== 'hero') return
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev === 0 ? 1 : 0))
    }, 3400)
    return () => clearInterval(interval)
  }, [reducedMotion, stage])

  // Auto-dismiss the initial greeting after 5.5s if no interaction occurs
  useEffect(() => {
    if (reducedMotion || stage !== 'hero') return

    dismissTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setBubble(null)
      }
    }, 5500)

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [reducedMotion, stage])

  // Listen for initial scroll to trigger wake & jump down
  useEffect(() => {
    if (reducedMotion || stage !== 'hero') return

    let triggered = false
    const handleScroll = () => {
      if (triggered) return
      if (window.scrollY > 25) {
        triggered = true
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
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

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setBubble((prev) => getTimeGreeting(prev))

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = setTimeout(() => {
      if (!isHoveredRef.current) {
        setBubble(null)
      }
    }, 5000)
  }, [])

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    setBubble((prev) => prev ?? getTimeGreeting())
  }, [])

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = setTimeout(() => {
      setBubble(null)
    }, 3500)
  }, [])

  if (stage === 'patrol' || reducedMotion) return null

  const isLeaping = stage === 'leaping'
  const isLayPsits = variant === 'lay-psits'

  // Variant sprites:
  // Daytime 'sit-u': sitting upright inside the bowl of 'U'
  // Nighttime 'lay-psits': laying horizontally across the flat roof of 'PSITS'
  const activeSprite = isLeaping
    ? '/assets/kasubay/kasubay-cheer.png'
    : isLayPsits
      ? frameIndex === 0
        ? '/assets/kasubay/lay/lay-top.png'
        : '/assets/kasubay/lay/lay-0.png'
      : frameIndex === 0
        ? '/assets/kasubay/lay/lean-0.png'
        : '/assets/kasubay/lay/lean-1.png'

  return (
    <div
      className={
        isLayPsits
          ? 'absolute bottom-[68%] xs:bottom-[70%] sm:bottom-[72%] md:bottom-[74%] left-[15%] -translate-x-1/2 pointer-events-auto cursor-pointer z-20 select-none'
          : 'absolute bottom-[20%] xs:bottom-[22%] sm:bottom-[24%] left-1/2 -translate-x-[46%] pointer-events-auto cursor-pointer z-20 select-none'
      }
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className={
          isLayPsits
            ? 'relative w-[48px] h-[30px] xs:w-[58px] xs:h-[36px] sm:w-[74px] sm:h-[46px] md:w-[92px] md:h-[58px] lg:w-[108px] lg:h-[68px] origin-bottom'
            : 'relative w-[34px] h-[38px] xs:w-[42px] xs:h-[48px] sm:w-[54px] sm:h-[62px] md:w-[66px] md:h-[75px] origin-bottom'
        }
        animate={
          isLeaping
            ? {
                y: isLayPsits ? [-8, -40, 180] : [-6, -32, 140],
                opacity: [1, 1, 0],
                scale: [1, 1.15, 0.7],
              }
            : {
                y: isLayPsits ? [0, -2, 0] : [0, -3, 0],
              }
        }
        transition={
          isLeaping
            ? {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }
            : {
                duration: isLayPsits ? 3.2 : 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
      >
        <Image
          src={activeSprite}
          alt={isLayPsits ? 'KasUbAy laying on top of PSITS' : 'KasUbAy lounging on UA'}
          fill
          sizes={isLayPsits ? '(max-width: 640px) 74px, 110px' : '(max-width: 640px) 46px, 72px'}
          className="object-contain object-bottom drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
          priority
          unoptimized
        />
      </motion.div>

      {/* Dynamic Real-Time Speech Bubble: Auto-shown on hero, cycles every 4.8s */}
      <AnimatePresence>
        {bubble && !isLeaping && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: -2, scale: 1 }}
            exit={{ opacity: 0, y: 2, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none"
          >
            <div className="relative px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-md border border-black/10 dark:border-white/15 text-neutral-800 dark:text-neutral-100 shadow-md text-[10px] sm:text-xs font-medium tracking-tight">
              <motion.span
                key={bubble}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-block"
              >
                {bubble}
              </motion.span>
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
