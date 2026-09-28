'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { ImageOff } from 'lucide-react'

export interface ProgressiveImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  containerClassName?: string
  showShimmer?: boolean
  ambientGlow?: boolean
}

export default function ProgressiveImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  showShimmer = true,
  ambientGlow = false,
  fill = true,
  ...rest
}: ProgressiveImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<unknown>(null)
  const [failedSrc, setFailedSrc] = useState<unknown>(null)

  if (!src) return null

  const isLoaded = loadedSrc === src
  const hasError = failedSrc === src

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#070A11] ${containerClassName}`}>
      {/* Skeleton & Shimmer Layer (Smoothly fades out once image finishes loading) */}
      {!hasError && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out z-10 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {ambientGlow && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold/[0.08] dark:bg-gold/[0.05] rounded-full blur-[60px]" />
          )}
          {showShimmer && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-banner-shimmer" />
            </div>
          )}
        </div>
      )}

      {/* The Next.js Image with progressive blur-up */}
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={`transition-all duration-700 ease-out ${
            isLoaded
              ? 'opacity-100 scale-100 blur-0'
              : 'opacity-0 scale-[1.03] blur-sm'
          } ${className}`}
          {...rest}
        />
      ) : (
        /* Graceful error fallback */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#0a0e17] text-white/40">
          <ImageOff size={22} className="text-white/40" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
            Unavailable
          </span>
        </div>
      )}
    </div>
  )
}
