'use client'

import React, { useEffect, useState } from 'react'

export interface LordIconProps {
  src: string
  trigger?: 'hover' | 'click' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang'
  colors?: {
    primary?: string
    secondary?: string
  }
  size?: number
  className?: string
}

/**
 * SSR-safe client wrapper for Lordicon animated icons.
 * Dynamically registers the custom element in the browser.
 */
export default function LordIcon({
  src,
  trigger = 'hover',
  colors = { primary: '#F5A623', secondary: '#1B2A6B' },
  size = 28,
  className = '',
}: LordIconProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    import('@lordicon/element')
      .then(({ defineElement }) => {
        try {
          defineElement()
        } catch {
          // Already defined
        }
        setIsMounted(true)
      })
      .catch(() => {
        // Fallback or ignore if SSR
      })
  }, [])

  if (!isMounted) {
    return (
      <span
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`inline-block ${className}`}
        aria-hidden="true"
      />
    )
  }

  const colorsParam = `primary:${colors.primary || '#F5A623'},secondary:${colors.secondary || '#1B2A6B'}`

  return React.createElement('lord-icon', {
    src,
    trigger,
    colors: colorsParam,
    style: { width: `${size}px`, height: `${size}px` },
    class: className,
  })
}
