'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

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
        /* Skeleton preloader fallback */
        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0a0e17] overflow-hidden">
          {/* Animated skeleton gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200/50 via-slate-300/50 to-slate-200/50 dark:from-white/[0.03] dark:via-white/[0.08] dark:to-white/[0.03]" />
          
          {/* Shimmer animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/[0.15] to-transparent animate-banner-shimmer" />
          </div>
          
          {/* Subtle ambient glow */}
          {ambientGlow && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold/[0.04] dark:bg-gold/[0.02] rounded-full blur-[80px]" />
          )}
        </div>
      )}
    </div>
  )
}
