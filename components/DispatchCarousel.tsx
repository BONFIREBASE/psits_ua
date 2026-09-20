'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
      className="relative w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-10 overflow-hidden select-none"
      onMouseEnter={() => { if (timerRef.current) clearInterval(timerRef.current) }}
      onMouseLeave={resetTimer}
    >
      {/* 6-Card Panoramic Carousel Stage - Buttery smooth, zero-bug 3D transitions */}
      <div className="relative flex items-center justify-center h-[390px] sm:h-[440px] md:h-[480px] lg:h-[500px] overflow-visible">
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
          let blur = 'blur(0px)'
          let zIndex = 0

          if (isCenter) {
            xPercent = 0
            scale = 1
            opacity = 1
            blur = 'blur(0px)'
            zIndex = 40
          } else if (isLeft1) {
            xPercent = -48
            scale = 0.88
            opacity = 0.68
            blur = 'blur(3.5px)'
            zIndex = 30
          } else if (isRight1) {
            xPercent = 48
            scale = 0.88
            opacity = 0.68
            blur = 'blur(3.5px)'
            zIndex = 30
          } else if (isLeft2) {
            xPercent = -90
            scale = 0.76
            opacity = 0.38
            blur = 'blur(6px)'
            zIndex = 20
          } else if (isRight2) {
            xPercent = 90
            scale = 0.76
            opacity = 0.38
            blur = 'blur(6px)'
            zIndex = 20
          } else if (offset < 0) {
            xPercent = -130
            scale = 0.62
            opacity = 0
            blur = 'blur(8px)'
            zIndex = 10
          } else {
            xPercent = 130
            scale = 0.62
            opacity = 0
            blur = 'blur(8px)'
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
                filter: blur,
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
              className={`absolute w-[92%] sm:w-[72%] md:w-[58%] lg:w-[48%] xl:w-[42%] max-w-[580px] ${
                isClickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
              } ${isOffstage ? 'pointer-events-none' : ''}`}
              style={{
                willChange: 'transform, opacity, filter',
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
