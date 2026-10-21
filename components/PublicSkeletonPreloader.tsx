'use client'

export function RootHomeSkeleton() {
  return (
    <div className="min-h-screen bg-canvas text-text pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 select-none">
      {/* Hero Section Skeleton */}
      <div className="flex flex-col items-center text-center space-y-6 pt-8">
        <div className="w-48 h-8 rounded-full bg-slate-200 dark:bg-white/[0.04] border border-card-border animate-pulse" />
        <div className="space-y-3 max-w-3xl w-full flex flex-col items-center">
          <div className="w-3/4 h-10 sm:h-14 bg-slate-200 dark:bg-white/[0.06] rounded-2xl animate-pulse" />
          <div className="w-1/2 h-10 sm:h-14 bg-slate-200 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
        </div>
        <div className="w-full max-w-xl h-4 bg-slate-200 dark:bg-white/[0.03] rounded-lg animate-pulse" />
        <div className="flex items-center gap-4 pt-4">
          <div className="w-36 h-12 rounded-xl bg-gold/30 animate-pulse" />
          <div className="w-36 h-12 rounded-xl bg-slate-200 dark:bg-white/[0.04] border border-card-border animate-pulse" />
        </div>
      </div>

      {/* Stats Ribbon Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-card-border rounded-2xl p-6 space-y-2 flex flex-col items-center text-center shadow-xs"
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
              className="bg-surface border border-card-border rounded-2xl overflow-hidden space-y-4 pb-6 shadow-xs"
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
    <div className="min-h-screen bg-canvas text-text pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 select-none">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-32 h-6 rounded-full bg-gold/20 animate-pulse" />
        <div className="w-64 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl animate-pulse" />
        <div className="w-96 h-4 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 pt-2 border-b border-card-border pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-24 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.03] border border-card-border animate-pulse"
          />
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface border border-card-border rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 rounded bg-slate-200 dark:bg-white/[0.04] animate-pulse" />
                <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-white/[0.03] animate-pulse" />
              </div>
              <div className="w-5/6 h-5 bg-slate-200 dark:bg-white/[0.07] rounded animate-pulse" />
              <div className="w-full h-3 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
            </div>
            <div className="pt-3 border-t border-card-border flex justify-between items-center">
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
    <div className="min-h-screen bg-canvas text-text pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 select-none">
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
            className="bg-surface border border-gold/25 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-xs"
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
            className="bg-surface border border-card-border rounded-xl p-4 flex flex-col items-center text-center space-y-3 shadow-xs"
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
    <div className="min-h-screen bg-canvas text-text pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 select-none">
      {/* Header */}
      <div className="space-y-3">
        <div className="w-32 h-6 rounded-full bg-gold/20 animate-pulse" />
        <div className="w-64 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl animate-pulse" />
        <div className="w-80 h-4 bg-slate-200 dark:bg-white/[0.03] rounded animate-pulse" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-card-border pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-24 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.03] border border-card-border animate-pulse"
          />
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-surface border border-card-border rounded-2xl overflow-hidden space-y-4 pb-6 shadow-xs"
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
    <div className="min-h-screen bg-canvas text-text pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12 select-none">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-28 h-6 rounded-full bg-gold/20 mx-auto animate-pulse" />
        <div className="w-64 h-10 bg-slate-200 dark:bg-white/[0.07] rounded-xl mx-auto animate-pulse" />
        <div className="w-96 h-4 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto animate-pulse" />
      </div>

      {/* Preamble Box Skeleton */}
      <div className="bg-surface border border-card-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
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
            className="bg-surface border border-card-border rounded-xl p-4 space-y-2 shadow-xs"
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
            className="bg-surface border border-card-border rounded-xl p-4 flex justify-between items-center shadow-xs"
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
        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-white/[0.06] border border-card-border" />
        <div className="w-56 h-6 bg-slate-200 dark:bg-white/[0.07] rounded-lg" />
        <div className="w-80 max-w-full h-3.5 bg-slate-200 dark:bg-white/[0.04] rounded" />
      </div>
      <div className="max-w-md mx-auto space-y-3 pt-2">
        <div className="w-full h-12 rounded-xl bg-slate-200 dark:bg-white/[0.05] border border-card-border" />
        <div className="w-full h-12 rounded-xl bg-gold/25" />
      </div>
      <div className="w-48 h-3 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto" />
    </div>
  )
}

export function SubmissionPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas text-text pt-32 pb-24 px-4 sm:px-6 max-w-3xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-36 h-6 rounded-full bg-gold/20 mx-auto animate-pulse" />
        <div className="w-72 sm:w-96 h-10 sm:h-12 bg-slate-200 dark:bg-white/[0.07] rounded-xl mx-auto animate-pulse" />
        <div className="w-64 h-4 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto animate-pulse" />
      </div>

      {/* Main Container Skeleton */}
      <div className="bg-surface border border-card-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
        <SubmissionAuthSkeleton />
      </div>
    </div>
  )
}

export function VotingPageSkeleton() {
  return (
    <div className="min-h-screen bg-canvas text-text pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12 select-none">
      {/* Header Skeleton */}
      <div className="text-center space-y-3 pt-4">
        <div className="w-36 h-6 rounded-full bg-gold/20 mx-auto animate-pulse" />
        <div className="w-72 sm:w-96 h-10 sm:h-12 bg-slate-200 dark:bg-white/[0.07] rounded-xl mx-auto animate-pulse" />
        <div className="w-64 sm:w-80 h-4 bg-slate-200 dark:bg-white/[0.03] rounded mx-auto animate-pulse" />
      </div>

      {/* Gallery Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface/90 border border-card-border rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg"
          >
            <div className="relative aspect-[3/4] bg-slate-200/80 dark:bg-white/[0.04] overflow-hidden">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.08] to-transparent animate-banner-shimmer" />
            </div>
            <div className="p-5 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-white/[0.07] rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-white/[0.04] rounded animate-pulse" />
              <div className="h-8 w-full bg-slate-200 dark:bg-white/[0.05] rounded-xl animate-pulse mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CommentsListSkeleton() {
  return (
    <div className="space-y-4 pt-1 select-none animate-pulse">
      {[
        { nameW: 'w-24', line1W: 'w-3/4', line2W: 'w-1/2', reply: true },
        { nameW: 'w-28', line1W: 'w-5/6', line2W: '', reply: false },
        { nameW: 'w-20', line1W: 'w-2/3', line2W: 'w-1/3', reply: true },
        { nameW: 'w-32', line1W: 'w-4/5', line2W: '', reply: false },
      ].map((item, idx) => (
        <div key={idx} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/[0.08] shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="flex items-center gap-2">
                <div className={`h-3.5 ${item.nameW} bg-slate-200 dark:bg-white/[0.08] rounded-full`} />
                <div className="w-10 h-2.5 bg-slate-200 dark:bg-white/[0.04] rounded" />
              </div>
              <div className={`h-3 ${item.line1W} bg-slate-200 dark:bg-white/[0.06] rounded-md`} />
              {item.line2W && (
                <div className={`h-3 ${item.line2W} bg-slate-200 dark:bg-white/[0.04] rounded-md`} />
              )}
              <div className="w-14 h-2 bg-slate-200 dark:bg-white/[0.03] rounded pt-0.5" />
            </div>
          </div>

          {item.reply && (
            <div className="pl-9 sm:pl-11 flex items-start gap-2.5 pt-0.5">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/[0.06] shrink-0" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-3 bg-slate-200 dark:bg-white/[0.07] rounded-full" />
                  <div className="w-8 h-2 bg-slate-200 dark:bg-white/[0.03] rounded" />
                </div>
                <div className="w-3/5 h-2.5 bg-slate-200 dark:bg-white/[0.05] rounded-md" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function CommunityFeedSkeleton() {
  return (
    <div className="pt-20 sm:pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-6 select-none animate-pulse">
      {/* Thread Switcher & Search Bar Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        {/* Thread Slider Pills */}
        <div className="flex items-center gap-2 overflow-hidden py-1">
          <div className="w-24 h-7 rounded-full bg-gold/25 border border-gold/30 shrink-0" />
          <div className="w-20 h-7 rounded-full bg-slate-200 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] shrink-0" />
          <div className="w-28 h-7 rounded-full bg-slate-200 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] shrink-0" />
          <div className="w-20 h-7 rounded-full bg-slate-200 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] shrink-0" />
          <div className="w-24 h-7 rounded-full bg-slate-200 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] shrink-0" />
        </div>

        {/* Live Members & Search Input Skeleton */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <div className="w-28 h-7 rounded-full bg-slate-200 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08]" />
          <div className="w-48 sm:w-60 h-7 rounded-full bg-slate-200 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08]" />
        </div>
      </div>

      {/* 2-Column Community Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed Column (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Create Post Prompt Bar Skeleton */}
          <div className="rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl p-3 sm:p-4 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/[0.08] shrink-0" />
            <div className="flex-1 h-9 rounded-xl bg-slate-200/70 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]" />
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.05]" />
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/[0.05]" />
            </div>
          </div>

          {/* Quick Filter Toolbar Skeleton */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-white/[0.05]" />
              <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-white/[0.04]" />
              <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-white/[0.04]" />
            </div>
            <div className="w-20 h-5 rounded bg-slate-200 dark:bg-white/[0.04]" />
          </div>

          {/* Post Feed Cards Skeletons */}
          {[1, 2, 3].map((cardIdx) => (
            <div
              key={cardIdx}
              className="rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl p-4 sm:p-5 space-y-3.5 shadow-xs"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/[0.08] shrink-0 relative" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 h-3.5 bg-slate-200 dark:bg-white/[0.08] rounded-full" />
                      <div className="w-14 h-4 bg-amber-500/10 rounded-md" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-2.5 bg-slate-200 dark:bg-white/[0.04] rounded" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
                      <div className="w-16 h-2.5 bg-gold/20 rounded" />
                    </div>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/[0.04]" />
              </div>

              {/* Card Content Lines */}
              <div className="space-y-2 pt-1">
                <div className="w-full h-3.5 bg-slate-200 dark:bg-white/[0.06] rounded-md" />
                <div className="w-5/6 h-3.5 bg-slate-200 dark:bg-white/[0.06] rounded-md" />
                {cardIdx === 1 && (
                  <div className="w-3/5 h-3.5 bg-slate-200 dark:bg-white/[0.05] rounded-md" />
                )}
              </div>

              {/* Optional Media Preview on Card 2 */}
              {cardIdx === 2 && (
                <div className="w-full h-44 sm:h-52 rounded-xl bg-slate-200/80 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] overflow-hidden" />
              )}

              {/* Card Action Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.05]">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-7 rounded-xl bg-slate-200 dark:bg-white/[0.05]" />
                  <div className="w-14 h-7 rounded-xl bg-slate-200 dark:bg-white/[0.05]" />
                  <div className="w-8 h-7 rounded-xl bg-slate-200 dark:bg-white/[0.04]" />
                </div>
                <div className="w-8 h-7 rounded-xl bg-slate-200 dark:bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>

        {/* Right Sidebar Column (4 cols, hidden on mobile) */}
        <aside className="hidden lg:flex flex-col gap-5 lg:col-span-4 sticky top-20">
          {/* Channels & Threads Card Skeleton */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-1">
              <div className="w-32 h-3.5 bg-slate-200 dark:bg-white/[0.08] rounded" />
              <div className="w-12 h-3 bg-slate-200 dark:bg-white/[0.04] rounded" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-surface-subtle border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-gold/30" />
                    <div className="w-24 h-3 bg-slate-200 dark:bg-white/[0.07] rounded" />
                  </div>
                  <div className="w-8 h-3 bg-slate-200 dark:bg-white/[0.04] rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Active Members & Guidelines Card Skeleton */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-5 space-y-3.5 shadow-xs">
            <div className="w-28 h-3.5 bg-slate-200 dark:bg-white/[0.08] rounded" />
            <div className="space-y-2">
              <div className="w-full h-3 bg-slate-200 dark:bg-white/[0.05] rounded" />
              <div className="w-4/5 h-3 bg-slate-200 dark:bg-white/[0.05] rounded" />
              <div className="w-3/4 h-3 bg-slate-200 dark:bg-white/[0.04] rounded" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}



