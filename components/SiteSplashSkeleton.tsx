'use client'

import { useState, useEffect } from 'react'

/**
 * Full-site branded splash skeleton that covers the entire viewport
 * on first load (before React hydration completes).
 *
 * Shows a skeleton navbar + content placeholders that match the real layout,
 * then smoothly fades out once the page has hydrated and painted.
 *
 * Mount this once inside LayoutShell (outside route-specific content).
 */
export default function SiteSplashSkeleton() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Wait for one animation frame after hydration to trigger the fade-out
    const raf = requestAnimationFrame(() => {
      setFading(true)
    })

    return () => cancelAnimationFrame(raf)
  }, [])

  // After the fade-out transition completes, unmount entirely
  const handleTransitionEnd = () => {
    if (fading) setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={handleTransitionEnd}
      className={`fixed inset-0 z-[9999] bg-white dark:bg-[#0D1117] transition-opacity duration-500 ease-out ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ─── Skeleton Navbar ─── */}
      <div className="flex justify-center px-4 pt-3 sm:pt-4">
        <div className="flex items-center justify-between w-full max-w-3xl h-12 sm:h-14 px-3 sm:px-4 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-[#0D1117]/60">
          {/* Logo + Brand */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-white/[0.06]" />
            <div className="w-16 h-4 rounded bg-slate-200 dark:bg-white/[0.08]" />
          </div>

          {/* Nav Links (desktop) */}
          <div className="hidden md:flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-14 h-4 rounded-full bg-slate-100 dark:bg-white/[0.04]"
              />
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 pr-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.04]" />
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.04] md:hidden" />
          </div>
        </div>
      </div>

      {/* ─── Skeleton Content Area ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 space-y-10">
        {/* Hero-like heading */}
        <div className="flex flex-col items-center text-center space-y-5 pt-6">
          <div className="w-44 h-7 rounded-full bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
          <div className="space-y-3 max-w-2xl w-full flex flex-col items-center">
            <div className="w-3/4 h-10 sm:h-12 bg-slate-100 dark:bg-white/[0.05] rounded-2xl animate-pulse" />
            <div className="w-1/2 h-10 sm:h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
          </div>
          <div className="w-full max-w-lg h-4 bg-slate-100 dark:bg-white/[0.03] rounded-lg animate-pulse" />
        </div>

        {/* Stats ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 dark:border-white/[0.06] p-5 space-y-2 flex flex-col items-center"
            >
              <div className="w-14 h-7 bg-slate-100 dark:bg-white/[0.06] rounded-lg animate-pulse" />
              <div className="w-20 h-3 bg-slate-100 dark:bg-white/[0.03] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-hidden"
            >
              <div className="w-full h-40 bg-slate-100 dark:bg-white/[0.04] animate-pulse" />
              <div className="p-5 space-y-2.5">
                <div className="w-20 h-3 bg-slate-100 dark:bg-white/[0.03] rounded animate-pulse" />
                <div className="w-3/4 h-4 bg-slate-100 dark:bg-white/[0.06] rounded animate-pulse" />
                <div className="w-full h-3 bg-slate-100 dark:bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
