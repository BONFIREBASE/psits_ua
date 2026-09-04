'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SocialDispatchCard from './SocialDispatchCard'
import type { SocialDispatch } from '@/data/announcements'

interface DispatchCarouselProps {
  dispatches: SocialDispatch[]
}

const AUTO_INTERVAL = 5000

export default function DispatchCarousel({ dispatches }: DispatchCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const count = dispatches.length
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((index: number) => {
    setActiveIndex(((index % count) + count) % count)
  }, [count])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count)
    }, AUTO_INTERVAL)
  }, [count])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const navigate = useCallback((index: number) => {
    goTo(index)
    resetTimer()
  }, [goTo, resetTimer])

  return (
    <div
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6"
      onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current) }}
      onMouseLeave={resetTimer}
    >
      <div className="relative flex items-center justify-center h-[420px] sm:h-[480px] md:h-[530px] lg:h-[560px] overflow-visible">
        {dispatches.map((dispatch, index) => {
          let offset = (index - activeIndex) % count
          if (offset < -Math.floor(count / 2)) offset += count
          if (offset > Math.floor(count / 2)) offset -= count

          const isCenter = offset === 0
          const isLeft = offset === -1
          const isRight = offset === 1

          const xPercent = isCenter ? 0 : isLeft ? -56 : isRight ? 56 : 0
          const scale = isCenter ? 1 : isLeft || isRight ? 0.83 : 0.6
          const opacity = isCenter ? 1 : isLeft || isRight ? 0.42 : 0
          const zIndex = isCenter ? 30 : isLeft || isRight ? 10 : 0
          const blur = isCenter ? 0 : 3.5

          return (
            <motion.div
              key={dispatch.id}
              initial={false}
              animate={{
                x: `${xPercent}%`,
                scale,
                opacity,
                zIndex,
                filter: `blur(${blur}px)`,
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => {
                if (isLeft) navigate((activeIndex - 1 + count) % count)
                if (isRight) navigate((activeIndex + 1) % count)
              }}
              className={`absolute w-[90%] sm:w-[64%] md:w-[54%] lg:w-[50%] max-w-[480px] select-none ${
                !isCenter ? 'cursor-pointer pointer-events-auto' : ''
              }`}
              style={{
                willChange: 'transform, opacity, filter',
              }}
            >
              <SocialDispatchCard dispatch={dispatch} isActive={isCenter} />
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-5 mt-6">
        <button
          onClick={() => navigate((activeIndex - 1 + count) % count)}
          className="md:hidden p-2.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Previous dispatch"
        >
          <ChevronLeft size={18} style={{ color: '#F5A623' }} />
        </button>

        <div className="flex items-center gap-2.5">
          {dispatches.map((_, i) => (
            <button
              key={i}
              onClick={() => navigate(i)}
              aria-label={`Go to dispatch ${i + 1}`}
              className="transition-all duration-300 p-1"
            >
              <div
                className="rounded-full transition-all duration-500 ease-out"
                style={{
                  width: i === activeIndex ? '28px' : '8px',
                  height: '8px',
                  backgroundColor: i === activeIndex ? '#F5A623' : 'rgba(255,255,255,0.2)',
                  boxShadow: i === activeIndex ? '0 0 12px rgba(245, 166, 35, 0.5)' : 'none',
                }}
              />
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate((activeIndex + 1) % count)}
          className="md:hidden p-2.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Next dispatch"
        >
          <ChevronRight size={18} style={{ color: '#F5A623' }} />
        </button>
      </div>
    </div>
  )
}
