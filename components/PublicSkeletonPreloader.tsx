'use client'

export function RootHomeSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-theme text-foreground-theme pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 select-none">
      {/* Hero Section Skeleton */}
      <div className="flex flex-col items-center text-center space-y-6 pt-8">
        <div className="w-48 h-8 rounded-full bg-slate-200 dark:bg-white/[0.04] border border-border-theme animate-pulse" />
        <div className="space-y-3 max-w-3xl w-full flex flex-col items-center">
          <div className="w-3/4 h-10 sm:h-14 bg-slate-200 dark:bg-white/[0.06] rounded-2xl animate-pulse" />
          <div className="w-1/2 h-10 sm:h-14 bg-slate-200 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
        </div>
        <div className="w-full max-w-xl h-4 bg-slate-200 dark:bg-white/[0.03] rounded-lg animate-pulse" />
        <div className="flex items-center gap-4 pt-4">
          <div className="w-36 h-12 rounded-xl bg-gold/30 animate-pulse" />
          <div className="w-36 h-12 rounded-xl bg-slate-200 dark:bg-white/[0.04] border border-border-theme animate-pulse" />
        </div>
      </div>

      {/* Stats Ribbon Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-border-theme rounded-2xl p-6 space-y-2 flex flex-col items-center text-center shadow-xs"
          >
            <div className="w-16 h-8 bg-slate-200 dark:bg-white/[0.08] rounded-lg animate-pulse" />
            <div className="w-24 h-3 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Highlights Grid Skeleton */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-48 h-6 bg-slate-200 dark:bg-white/[0.06] rounded animate-pulse" />
          <div className="w-24 h-4 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-theme border border-border-theme rounded-2xl overflow-hidden space-y-4 pb-6 shadow-xs"
            >
              <div className="w-full h-44 bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
              <div className="px-5 space-y-2.5">
                <div className="w-20 h-3 bg-gold/20 rounded animate-pulse" />
                <div className="w-3/4 h-5 bg-slate-200 dark:bg-white/[0.07] rounded animate-pulse" />
                <div className="w-full h-3 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EventsPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-theme text-foreground-theme pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 select-none">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-32 h-6 rounded-full bg-gold/20 animate-pulse" />
        <div className="w-64 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl animate-pulse" />
        <div className="w-96 h-4 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-border-theme pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-24 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.03] border border-border-theme animate-pulse"
          />
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-border-theme rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
                <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-white/[0.03] animate-pulse" />
              </div>
              <div className="w-5/6 h-5 bg-slate-200 dark:bg-white/[0.07] rounded animate-pulse" />
              <div className="w-full h-3 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
            </div>
            <div className="pt-3 border-t border-border-theme flex justify-between items-center">
              <div className="w-28 h-3 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-white/[0.05] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OfficersPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-theme text-foreground-theme pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 select-none">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-32 h-6 rounded-full bg-gold/20 mx-auto animate-pulse" />
        <div className="w-72 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl mx-auto animate-pulse" />
        <div className="w-full h-4 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
      </div>

      {/* Executive Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-gold/25 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xs"
          >
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-white/[0.05] border border-gold/30 animate-pulse" />
            <div className="space-y-1.5 w-full flex flex-col items-center">
              <div className="w-32 h-5 bg-slate-200 dark:bg-white/[0.08] rounded animate-pulse" />
              <div className="w-20 h-3 bg-gold/40 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* General Officers Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-border-theme rounded-xl p-4 flex flex-col items-center text-center space-y-3 shadow-xs"
          >
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
            <div className="space-y-1 w-full flex flex-col items-center">
              <div className="w-24 h-4 bg-slate-200 dark:bg-white/[0.06] rounded animate-pulse" />
              <div className="w-16 h-2.5 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProjectsPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-theme text-foreground-theme pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 select-none">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-32 h-6 rounded-full bg-gold/20 animate-pulse" />
        <div className="w-64 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl animate-pulse" />
        <div className="w-80 h-4 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border-theme pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-24 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.03] border border-border-theme animate-pulse"
          />
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-border-theme rounded-2xl overflow-hidden space-y-4 pb-6 shadow-xs"
          >
            <div className="w-full h-48 bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
            <div className="px-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="w-24 h-3 bg-gold/30 rounded animate-pulse" />
                <div className="w-12 h-4 rounded-full bg-slate-200 dark:bg-white/[0.03] animate-pulse" />
              </div>
              <div className="w-3/4 h-5 bg-slate-200 dark:bg-white/[0.08] rounded animate-pulse" />
              <div className="w-full h-3 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="w-14 h-5 rounded bg-slate-200 dark:bg-white/[0.03] animate-pulse" />
                <div className="w-14 h-5 rounded bg-slate-200 dark:bg-white/[0.03] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AboutPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-theme text-foreground-theme pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 select-none">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-28 h-6 rounded-full bg-gold/20 mx-auto animate-pulse" />
        <div className="w-64 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl mx-auto animate-pulse" />
        <div className="w-96 h-4 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto animate-pulse" />
      </div>

      {/* Preamble Box Skeleton */}
      <div className="bg-surface-theme border border-border-theme rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="w-36 h-5 bg-gold/30 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="w-full h-3.5 bg-slate-200 dark:bg-white/[0.04] rounded animate-pulse" />
          <div className="w-5/6 h-3.5 bg-slate-200 dark:bg-white/[0.04] rounded animate-pulse" />
          <div className="w-4/5 h-3.5 bg-slate-200 dark:bg-white/[0.04] rounded animate-pulse" />
        </div>
      </div>

      {/* Quick Facts Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-border-theme rounded-xl p-4 space-y-2 shadow-xs"
          >
            <div className="w-20 h-2.5 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
            <div className="w-28 h-4 bg-slate-200 dark:bg-white/[0.07] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Accordion List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-theme border border-border-theme rounded-xl p-4 flex justify-between items-center shadow-xs"
          >
            <div className="w-48 h-4 bg-slate-200 dark:bg-white/[0.05] rounded animate-pulse" />
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SubmissionAuthSkeleton() {
  return (
    <div className="py-8 space-y-6 animate-pulse">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-white/[0.06] border border-border-theme" />
        <div className="w-56 h-6 bg-slate-200 dark:bg-white/[0.07] rounded-lg" />
        <div className="w-80 max-w-full h-3.5 bg-slate-200 dark:bg-white/[0.04] rounded" />
      </div>
      <div className="max-w-md mx-auto space-y-3 pt-2">
        <div className="w-full h-12 rounded-xl bg-slate-200 dark:bg-white/[0.05] border border-border-theme" />
        <div className="w-full h-12 rounded-xl bg-gold/25" />
      </div>
      <div className="w-48 h-3 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto" />
    </div>
  )
}

export function SubmissionPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas-theme text-foreground-theme pt-32 pb-24 px-4 sm:px-6 max-w-3xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-36 h-6 rounded-full bg-gold/20 mx-auto animate-pulse" />
        <div className="w-72 sm:w-96 h-10 sm:h-12 bg-slate-200 dark:bg-white/[0.07] rounded-xl mx-auto animate-pulse" />
        <div className="w-64 h-4 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto animate-pulse" />
      </div>

      {/* Main Container Skeleton */}
      <div className="bg-surface-theme border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
        <SubmissionAuthSkeleton />
      </div>
    </div>
  )
}

