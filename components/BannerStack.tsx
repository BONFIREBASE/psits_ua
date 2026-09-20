'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BannerCard from './BannerCard'
import type { BannerRow } from '@/lib/supabase'

interface BannerStackProps {
  banners: BannerRow[]
}

const AUTO_INTERVAL = 6000

export default function BannerStack({ banners }: BannerStackProps) {
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

