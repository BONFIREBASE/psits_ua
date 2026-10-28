'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Home, Clock } from 'lucide-react'
import MaintenanceAnimation from '@/components/MaintenanceAnimation'
import type { MaintenanceConfigData } from '@/lib/maintenance'

export default function MaintenancePage() {
  const [config, setConfig] = useState<MaintenanceConfigData | null>(null)

  useEffect(() => {
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
  }, [])

  const title = config?.title || 'System Under Scheduled Maintenance'
  const message =
    config?.message ||
    'We are currently performing scheduled maintenance to improve our services.'
  const estimatedReturn = config?.estimated_return
    ? new Date(config.estimated_return).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="fixed inset-0 z-[9999] bg-canvas text-text flex items-center justify-center px-6 overflow-hidden select-none">
      {/* Subtle radial ambient glow matching 404 screen */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.06] rounded-full blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-lg w-full text-center space-y-4">
        {/* PSITS Official Logo */}
        <Link
          href="/"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
          aria-label="Return to PSITS-UA Home"
        >
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 mx-auto drop-shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:scale-105 transition-transform shrink-0">
            <Image
              src="/assets/logo/PSITS logo.png"
              alt="PSITS-UA Logo"
              fill
              sizes="(max-width: 640px) 48px, 56px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Animated Construction Site Lottie Graphic */}
        <MaintenanceAnimation />

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-gold/10 text-gold border border-gold/25 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
          </span>
          <span>Maintenance In Progress</span>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text tracking-tight">
            {title}
          </h1>
          <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-md mx-auto font-normal">
            {message}
          </p>
        </div>

        {/* Estimated Return Box if configured */}
        {estimatedReturn && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface border border-card-border text-xs text-muted">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span>
              Estimated Return: <strong className="text-text font-medium">{estimatedReturn}</strong>
            </span>
          </div>
        )}

        {/* Return Home Action */}
        <div className="pt-2 flex items-center justify-center">
          <Link
            href="/"
            aria-label="Return Home"
            title="Return to Home"
            className="p-3.5 rounded-full border border-card-border bg-surface text-gold hover:text-[#0D1117] hover:bg-gold hover:border-gold hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] transition-all duration-300 active:scale-95 group cursor-pointer shadow-sm"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
