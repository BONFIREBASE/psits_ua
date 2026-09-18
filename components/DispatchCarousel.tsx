'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SocialDispatchCard from './SocialDispatchCard'
import type { SocialDispatch } from '@/data/announcements'

interface DispatchCarouselProps {
  dispatches: SocialDispatch[]
}

const AUTO_INTERVAL = 5000
const TRANSITION_CONFIG = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1],
} as const

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
      className="relative w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-10 overflow-hidden select-none"
      onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current) }}
      onMouseLeave={resetTimer}
    >
      {/* 6-Card Panoramic Carousel Stage - Buttery smooth, zero-bug 3D transitions */}
      <div className="relative flex items-center justify-center h-[430px] sm:h-[490px] md:h-[540px] lg:h-[570px] overflow-visible">
        {dispatches.map((dispatch, index) => {
          let offset = (index - activeIndex) % count
          if (offset < -Math.floor(count / 2)) offset += count
          if (offset > Math.floor(count / 2)) offset -= count

          const isCenter = offset === 0
          const isLeft1 = offset === -1
          const isRight1 = offset === 1
          const isLeft2 = offset === -2
          const isRight2 = offset === 2
          const isOffstage = Math.abs(offset) >= 3

          let xPercent = 0
          let scale = 0.6
          let opacity = 0
          let zIndex = 0

          if (isCenter) {
            xPercent = 0
            scale = 1
            opacity = 1
            zIndex = 40
          } else if (isLeft1) {
            xPercent = -44
            scale = 0.88
            opacity = 0.72
            zIndex = 30
          } else if (isRight1) {
            xPercent = 44
            scale = 0.88
            opacity = 0.72
            zIndex = 30
          } else if (isLeft2) {
            xPercent = -85
            scale = 0.76
            opacity = 0.42
            zIndex = 20
          } else if (isRight2) {
            xPercent = 85
            scale = 0.76
            opacity = 0.42
            zIndex = 20
          } else if (offset < 0) {
            xPercent = -125
            scale = 0.62
            opacity = 0
            zIndex = 10
          } else {
            xPercent = 125
            scale = 0.62
            opacity = 0
            zIndex = 10
          }

          const isClickable = !isCenter && opacity > 0

          return (
            <motion.div
              key={dispatch.id}
              initial={false}
              animate={{
                x: `${xPercent}%`,
                scale,
                opacity,
                zIndex,
              }}
              transition={
                isOffstage
                  ? { duration: 0 }
                  : {
                      duration: 0.7,
                      ease: [0.25, 1, 0.35, 1],
                    }
              }
              onClick={() => {
                if (isClickable) navigate((activeIndex + offset + count) % count)
              }}
              className={`absolute w-[90%] sm:w-[62%] md:w-[48%] lg:w-[38%] xl:w-[33%] max-w-[480px] ${
                isClickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
              } ${isOffstage ? 'pointer-events-none' : ''}`}
              style={{
                willChange: 'transform, opacity',
              }}
            >
              <SocialDispatchCard dispatch={dispatch} isActive={isCenter} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
