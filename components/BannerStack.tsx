'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BannerCard from './BannerCard'
import type { BannerRow } from '@/lib/supabase'

interface BannerStackProps {
  banners: BannerRow[]
  isLoading?: boolean
}

const AUTO_INTERVAL = 6000

export function BannerStackSkeleton() {
  return (
    <section className="relative max-w-6xl xl:max-w-7xl mx-auto px-6 pb-20 lg:pb-24">
      <div className="relative pt-10 sm:pt-14">
        <div className="relative w-full h-[400px] sm:h-[420px] md:h-[440px] lg:h-[450px]">
          {/* Back Card 2 Skeleton */}
          <div className="absolute inset-0 w-full h-full -top-[52px] scale-[0.92] opacity-40 blur-[1px] rounded-3xl border border-white/5 bg-[#0a0e17] z-10 pointer-events-none hidden md:block" />

          {/* Back Card 1 Skeleton */}
          <div className="absolute inset-0 w-full h-full -top-[28px] scale-[0.96] opacity-70 rounded-3xl border border-white/10 bg-[#0a0e17] z-20 pointer-events-none hidden sm:block" />

          {/* Front Active Card Skeleton */}
          <div className="relative w-full h-full min-h-[390px] sm:min-h-[420px] md:min-h-[450px] rounded-3xl overflow-hidden border border-black/15 dark:border-white/15 bg-[#070A11] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95)] z-30">
            {/* Luminous Top Rim Highlight */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-85" />

            {/* Shimmer sweep */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-banner-shimmer" />
            </div>

            {/* Central ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-60 bg-gold/[0.06] rounded-full blur-[90px] pointer-events-none" />

            {/* Center modern loading badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
                <div className="relative w-4 h-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-gold/40 border-t-gold animate-spin" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_rgba(245,166,35,0.8)]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-white/70 font-semibold">
                  Loading Banner...
                </span>
              </div>
            </div>

            {/* Bottom dock skeleton */}
            <div className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-8 md:px-10 pb-5 pt-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2.5 flex-1 max-w-xl">
                <div className="h-7 sm:h-9 w-3/4 bg-white/[0.08] rounded-xl animate-pulse" />
                <div className="h-4 w-1/2 bg-white/[0.05] rounded-lg animate-pulse" />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-32 bg-gold/20 rounded-xl animate-pulse" />
                <div className="h-10 w-28 bg-white/[0.06] rounded-xl animate-pulse hidden sm:block" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function BannerStack({ banners, isLoading = false }: BannerStackProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const count = banners.length
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /* ── Navigation helpers (functional updaters to avoid stale closures) ── */
  const clearAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoPlay = useCallback(() => {
    clearAutoPlay()
    if (count > 1) {
      timerRef.current = setInterval(() => {
        setActiveIndex((c) => (c + 1) % count)
      }, AUTO_INTERVAL)
    }
  }, [count, clearAutoPlay])

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % count) + count) % count)
      startAutoPlay()
    },
    [count, startAutoPlay]
  )

  const next = useCallback(() => {
    setActiveIndex((c) => (c + 1) % count)
    startAutoPlay()
  }, [count, startAutoPlay])

  const prev = useCallback(() => {
    setActiveIndex((c) => (c - 1 + count) % count)
    startAutoPlay()
  }, [count, startAutoPlay])

  /* ── Auto-play lifecycle ── */
  useEffect(() => {
    startAutoPlay()
    return clearAutoPlay
  }, [startAutoPlay, clearAutoPlay])

  if (isLoading) {
    return <BannerStackSkeleton />
  }

  if (count === 0) return null

  /* ── Single banner ── */
  if (count === 1) {
    return (
      <section className="relative max-w-6xl xl:max-w-7xl mx-auto px-6 pb-20 lg:pb-24">
        <BannerCard banner={banners[0]} isActive={true} />
      </section>
    )
  }

  /* ── Multi-banner stacked carousel ── */
  return (
    <section
      className="relative max-w-6xl xl:max-w-7xl mx-auto px-6 pb-20 lg:pb-24"
      onMouseEnter={() => {
        setIsHovered(true)
        clearAutoPlay()
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        startAutoPlay()
      }}
    >
      <div className="relative pt-10 sm:pt-14">
        <div className="relative w-full h-[400px] sm:h-[420px] md:h-[440px] lg:h-[450px]">
          <AnimatePresence initial={false}>
            {banners.map((banner, index) => {
              let offset = (index - activeIndex) % count
              if (offset < 0) offset += count

              const isTop = offset === 0
              const isBehind1 = offset === 1
              const isBehind2 = offset === 2 && count > 2
              const isVisible = isTop || isBehind1 || isBehind2

              /* Cards beyond the 3rd position stay mounted but fully hidden —
                 AnimatePresence handles the smooth opacity fade. */
              const hoverLift = isHovered && !isTop ? -4 : 0
              const y = isTop
                ? 0
                : isBehind1
                ? -28 + hoverLift
                : isBehind2
                ? -52 + hoverLift
                : -65
              const scale = isTop ? 1 : isBehind1 ? 0.96 : isBehind2 ? 0.92 : 0.88
              const targetOpacity = isTop ? 1 : isBehind1 ? 0.92 : isBehind2 ? 0.65 : 0
              const filterBlur = isTop ? 0 : isBehind1 ? 0.2 : isBehind2 ? 1.2 : 2.5

              /* zIndex is set via style (instant) — NOT animated —
                 to prevent framer-motion from interpolating integer z layers
                 and causing mid-transition overlap flicker. */
              const zIndex = isTop ? 30 : isBehind1 ? 20 : isBehind2 ? 10 : 0

              return (
                <motion.div
                  key={banner.id}
                  initial={false}
                  animate={{
                    y,
                    scale,
                    opacity: targetOpacity,
                    filter: `blur(${filterBlur}px)`,
                  }}
                  transition={{
                    y: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                    scale: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                    opacity: { duration: 0.5, ease: 'easeInOut' },
                    filter: { duration: 0.6, ease: 'easeInOut' },
                  }}
                  drag={isTop ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) next()
                    else if (info.offset.x > 50) prev()
                  }}
                  className={`absolute inset-0 w-full h-full select-none ${
                    !isVisible ? 'pointer-events-none' : ''
                  }`}
                  style={{
                    zIndex,
                    willChange: 'transform, opacity, filter',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    perspective: 1000,
                  }}
                >
                  <BannerCard
                    banner={banner}
                    isActive={isTop}
                    onClick={() => {
                      if (!isTop) goTo(index)
                    }}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

