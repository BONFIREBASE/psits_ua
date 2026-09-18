'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import type { ArchivePhoto } from '@/data/archive'

interface ArchiveStackProps {
  photos: ArchivePhoto[]
}

const AUTO_INTERVAL = 4500 // Automatically changes photos every 4.5 seconds

// Organic, delightfully messy stack configuration — natural casual scattering with varied lateral shifts and rotations
const STACK_LAYERS = [
  { x: 0, y: 20, rotate: -0.8, scale: 1, opacity: 1, zIndex: 50 },
  { x: 26, y: -10, rotate: 6.8, scale: 0.97, opacity: 0.95, zIndex: 40 },
  { x: -32, y: -36, rotate: -7.6, scale: 0.94, opacity: 0.88, zIndex: 30 },
  { x: 20, y: -64, rotate: 5.2, scale: 0.91, opacity: 0.75, zIndex: 20 },
  { x: -22, y: -88, rotate: -5.8, scale: 0.88, opacity: 0.60, zIndex: 10 },
  { x: 14, y: -108, rotate: 3.6, scale: 0.85, opacity: 0.40, zIndex: 5 },
]

export default function ArchiveStack({ photos }: ArchiveStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('right')
  const [isHovered, setIsHovered] = useState(false)
  const count = photos.length
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
        setExitDirection((prev) => (prev === 'right' ? 'left' : 'right'))
        setCurrentIndex((c) => (c + 1) % count)
      }, AUTO_INTERVAL)
    }
  }, [count, clearAutoPlay])

  // Autoplay lifecycle: runs when not hovered, pauses on hover
  useEffect(() => {
    if (!isHovered) {
      startAutoPlay()
    } else {
      clearAutoPlay()
    }
    return clearAutoPlay
  }, [isHovered, startAutoPlay, clearAutoPlay])

  const nextPhoto = useCallback(
    (dir: 'left' | 'right' = 'right') => {
      if (count <= 1) return
      setExitDirection(dir)
      setCurrentIndex((prev) => (prev + 1) % count)
      if (!isHovered) {
        startAutoPlay() // Reset timer on manual interaction
      }
    },
    [count, isHovered, startAutoPlay]
  )

  if (!photos || count === 0) return null

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 50
    const velocityThreshold = 250

    if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      nextPhoto('left')
    } else if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      nextPhoto('right')
    } else if (Math.abs(info.offset.y) > threshold) {
      nextPhoto(info.offset.x < 0 ? 'left' : 'right')
    }
  }

  // Display top photo + up to 5 layers visibly scattered underneath
  const visibleCount = Math.min(count, STACK_LAYERS.length)
  const stackItems = []
  for (let depth = 0; depth < visibleCount; depth++) {
    const photoIndex = (currentIndex + depth) % count
    stackItems.push({
      photo: photos[photoIndex],
      depth,
      config: STACK_LAYERS[depth],
    })
  }

  return (
    <div
      className="relative w-full flex items-center justify-center select-none pt-20 pb-28 sm:pt-24 sm:pb-36 lg:pt-28 lg:pb-44"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Viewport for the messy stacked photos */}
      <div className="relative w-full max-w-[560px] sm:max-w-[680px] md:max-w-[800px] lg:max-w-[900px] xl:max-w-[960px] h-[370px] sm:h-[470px] md:h-[560px] lg:h-[640px] xl:h-[680px] flex items-center justify-center">
        {/* Render bottom layers first so top card stays in front */}
        {stackItems.slice().reverse().map(({ photo, depth, config }) => {
          const isTop = depth === 0

          if (isTop) {
            return (
              <AnimatePresence key={photo.id} mode="popLayout">
                <motion.div
                  key={photo.id}
                  className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                  style={{ zIndex: config.zIndex }}
                  initial={{
                    x: config.x,
                    y: config.y + 20,
                    rotate: exitDirection === 'left' ? 4 : -4,
                    scale: 0.97,
                    opacity: 0.8,
                  }}
                  animate={{
                    x: config.x,
                    y: config.y,
                    rotate: config.rotate,
                    scale: config.scale,
                    opacity: config.opacity,
                  }}
                  exit={{
                    x: exitDirection === 'left' ? -680 : 680,
                    y: 40,
                    rotate: exitDirection === 'left' ? -26 : 26,
                    opacity: 0,
                    transition: { duration: 0.48, ease: [0.32, 0.72, 0, 1] },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 24,
                  }}
                  drag={true}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.65}
                  onDragEnd={handleDragEnd}
                  onClick={() => nextPhoto('right')}
                >
                  <PhotoPrint photo={photo} isTop={true} />
                </motion.div>
              </AnimatePresence>
            )
          }

          // Messy stacked layers underneath with irregular scatter
          return (
            <motion.div
              key={photo.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: config.zIndex }}
              initial={false}
              animate={{
                x: config.x,
                y: config.y,
                rotate: config.rotate,
                scale: config.scale,
                opacity: config.opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 24,
              }}
            >
              <PhotoPrint photo={photo} isTop={false} />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Authentic physical photo print with white archival paper border,
 * slight bottom weighted margin, and soft ambient paper shadow.
 */
function PhotoPrint({ photo, isTop }: { photo: ArchivePhoto; isTop: boolean }) {
  return (
    <div
      className={`relative w-[94%] sm:w-[90%] max-w-[530px] sm:max-w-[640px] md:max-w-[760px] lg:max-w-[860px] xl:max-w-[920px] bg-[#FAF8F5] p-2.5 sm:p-3.5 md:p-4 lg:p-5 pb-5 sm:pb-6 md:pb-8 lg:pb-10 rounded-[4px] md:rounded-[6px] transition-shadow duration-300 ${
        isTop
          ? 'shadow-[0_32px_75px_-15px_rgba(0,0,0,0.9),0_14px_30px_rgba(0,0,0,0.55),0_0_1px_rgba(255,255,255,0.4)] ring-1 ring-black/15'
          : 'shadow-[0_18px_42px_rgba(0,0,0,0.72),0_5px_15px_rgba(0,0,0,0.45)] ring-1 ring-black/10'
      }`}
    >
      {/* Photo frame */}
      <div className="relative w-full aspect-[3/2] overflow-hidden bg-[#151515] rounded-[2px] md:rounded-[3px]">
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="(max-width: 768px) 94vw, (max-width: 1024px) 760px, (max-width: 1280px) 860px, 920px"
          priority={isTop}
          className="object-cover pointer-events-none select-none"
        />
        {/* Subtle photo print glossy gradient & paper border seam */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10" />
      </div>

      {/* Discreet photo print paper watermark */}
      <div className="mt-1.5 sm:mt-2 md:mt-2.5 flex items-center justify-between px-1">
        <span className="text-[10px] sm:text-[11px] md:text-xs font-mono tracking-widest text-black/35 uppercase select-none">
          PSITS-UA Archive
        </span>
      </div>
    </div>
  )
}
