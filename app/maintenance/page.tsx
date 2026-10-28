'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, Clock } from 'lucide-react'
import MaintenanceAnimation from '@/components/MaintenanceAnimation'
import type { MaintenanceConfigData } from '@/lib/maintenance'

interface MaintenancePageProps {
  initialConfig?: MaintenanceConfigData | null
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function calculateRemaining(isoTarget: string | null | undefined): TimeRemaining | null {
  if (!isoTarget) return null
  const target = new Date(isoTarget).getTime()
  if (isNaN(target)) return null
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, total: diff }
}

export default function MaintenancePage({ initialConfig }: MaintenancePageProps = {}) {
  const [config, setConfig] = useState<MaintenanceConfigData | null>(initialConfig || null)
  const [remaining, setRemaining] = useState<TimeRemaining | null>(() =>
    calculateRemaining(initialConfig?.estimated_return)
  )

  useEffect(() => {
    // Lock body scroll to prevent background scroll bleed on mobile/desktop
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    if (!initialConfig) {
      async function fetchStatus() {
        try {
          const res = await fetch('/api/maintenance/status', { cache: 'no-store' })
          if (res.ok) {
            const data = await res.json()
            setConfig(data.config)
          }
        } catch {
          // Fallback
        }
      }
      fetchStatus()
    }

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [initialConfig])

  // Live ticking countdown timer
  useEffect(() => {
    const target = config?.estimated_return
    setRemaining(calculateRemaining(target))
    if (!target) return

    const timer = setInterval(() => {
      setRemaining(calculateRemaining(target))
    }, 1000)

    return () => clearInterval(timer)
  }, [config?.estimated_return])

  const title = config?.title || 'System Under Scheduled Maintenance'
  const message =
    config?.message ||
    'We are currently performing scheduled maintenance to improve our services.'

  return (
    <div className="fixed inset-0 z-[9999] bg-canvas text-text flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Subtle radial ambient glow matching 404 screen */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gold/[0.06] rounded-full blur-[120px] sm:blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-sm sm:max-w-md w-full text-center space-y-2.5 sm:space-y-3.5 my-auto flex flex-col items-center justify-center">
        {/* PSITS Official Logo */}
        <Link
          href="/"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full shrink-0"
          aria-label="Return to PSITS-UA Home"
        >
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 mx-auto drop-shadow-[0_0_15px_rgba(245,166,35,0.25)] hover:scale-105 transition-transform shrink-0">
            <Image
              src="/assets/logo/PSITS logo.png"
              alt="PSITS-UA Logo"
              fill
              sizes="(max-width: 640px) 40px, 48px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Animated Construction Site Lottie Graphic */}
        <MaintenanceAnimation />

        {/* Live Countdown Timer Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium bg-gold/10 text-gold border border-gold/25 shadow-sm shrink-0">
          {remaining ? (
            <>
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
              <span>Available in:</span>
              <div className="flex items-center gap-1 font-mono font-bold">
                {remaining.days > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-card-border">
                    {remaining.days}d
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded bg-surface border border-card-border">
                  {String(remaining.hours).padStart(2, '0')}h
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-card-border">
                  {String(remaining.minutes).padStart(2, '0')}m
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface border border-card-border">
                  {String(remaining.seconds).padStart(2, '0')}s
                </span>
              </div>
            </>
          ) : (
            <>
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-gold"></span>
              </span>
              <span>Returning shortly</span>
            </>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-1 sm:space-y-1.5">
          <h1 className="font-display font-bold text-lg xs:text-xl sm:text-2xl md:text-3xl text-text tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-muted text-[11px] xs:text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-sm mx-auto font-normal">
            {message}
          </p>
        </div>

        {/* Return Home Action */}
        <div className="pt-1 sm:pt-2 flex items-center justify-center shrink-0">
          <Link
            href="/"
            aria-label="Return Home"
            title="Return to Home"
            className="p-2.5 sm:p-3 rounded-full border border-card-border bg-surface text-gold hover:text-[#0D1117] hover:bg-gold hover:border-gold hover:shadow-[0_0_25px_rgba(245,166,35,0.4)] transition-all duration-300 active:scale-95 group cursor-pointer shadow-sm"
          >
            <Home size={18} className="group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
