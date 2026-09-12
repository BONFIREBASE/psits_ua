'use client'

export function ManagementShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#0a0e17] text-white">
      {/* ─── Left Sidebar Skeleton (Desktop) ─── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0d121f] border-r border-white/6 p-4 justify-between select-none">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/8 animate-pulse" />
            <div className="space-y-1.5 flex-1">
              <div className="w-24 h-3.5 bg-white/[0.06] rounded animate-pulse" />
              <div className="w-16 h-2.5 bg-white/[0.03] rounded animate-pulse" />
            </div>
          </div>

          {/* Navigation Items Skeleton */}
          <div className="space-y-1.5 pt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-transparent"
              >
                <div className="w-4 h-4 rounded bg-white/[0.05] animate-pulse" />
                <div
                  className="h-3 bg-white/[0.04] rounded animate-pulse"
                  style={{ width: `${60 + (i % 3) * 20}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* User Session Footer Skeleton */}
        <div className="pt-4 border-t border-white/6 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/8 animate-pulse" />
          <div className="space-y-1.5 flex-1">
            <div className="w-20 h-3 bg-white/[0.05] rounded animate-pulse" />
            <div className="w-28 h-2.5 bg-white/[0.02] rounded animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ─── Main Content Canvas Skeleton ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Skeleton */}
        <div className="h-16 bg-[#0d121f]/70 border-b border-white/6 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] lg:hidden animate-pulse" />
            <div className="w-32 sm:w-48 h-4 bg-white/[0.05] rounded animate-pulse" />
          </div>
          <div className="w-24 h-8 rounded-lg bg-white/[0.03] border border-white/6 animate-pulse" />
        </div>

        {/* Dashboard Body Skeleton */}
        <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
          {/* Hero Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/6 pb-6">
            <div className="space-y-2">
              <div className="w-56 sm:w-72 h-8 bg-white/[0.06] rounded-lg animate-pulse" />
              <div className="w-72 sm:w-96 h-3.5 bg-white/[0.03] rounded animate-pulse" />
            </div>
            <div className="w-36 h-8 rounded-xl bg-white/[0.02] border border-white/6 animate-pulse" />
          </div>

          {/* Dual Spotlight Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#0d121f] border border-white/6 rounded-xl p-4 flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/8 animate-pulse flex-shrink-0" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="w-28 h-2.5 bg-white/[0.05] rounded animate-pulse" />
                    <div className="w-14 h-4 bg-white/[0.03] rounded animate-pulse" />
                  </div>
                  <div className="w-48 h-3.5 bg-white/[0.06] rounded animate-pulse" />
                  <div className="w-36 h-2.5 bg-white/[0.03] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* 4 KPI Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#0d121f] border border-white/6 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-20 h-3 bg-white/[0.04] rounded animate-pulse" />
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/8 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-12 h-7 bg-white/[0.08] rounded animate-pulse" />
                  <div className="w-24 h-2.5 bg-white/[0.03] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          {/* 2 Main Visual Charts Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Bar Chart Card (7 cols) */}
            <div className="lg:col-span-7 bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex justify-between items-center border-b border-white/6 pb-4">
                <div className="space-y-1.5">
                  <div className="w-44 h-4 bg-white/[0.06] rounded animate-pulse" />
                  <div className="w-56 h-2.5 bg-white/[0.03] rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="w-16 h-5 rounded bg-white/[0.04] animate-pulse" />
                  <div className="w-16 h-5 rounded bg-white/[0.04] animate-pulse" />
                </div>
              </div>
              {/* 12 Bars Skeleton */}
              <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
                {[40, 75, 35, 80, 50, 65, 45, 90, 60, 85, 30, 70].map((h, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                    <div
                      className="w-full max-w-[28px] bg-white/[0.05] rounded-t animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                    <div className="w-4 h-2 bg-white/[0.03] rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Donut Chart Card (5 cols) */}
            <div className="lg:col-span-5 bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
              <div className="border-b border-white/6 pb-4 space-y-1.5">
                <div className="w-36 h-4 bg-white/[0.06] rounded animate-pulse" />
                <div className="w-48 h-2.5 bg-white/[0.03] rounded animate-pulse" />
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
                <div className="w-32 h-32 rounded-full border-[14px] border-white/[0.05] border-t-gold/50 animate-pulse flex-shrink-0" />
                <div className="space-y-2 flex-1 w-full">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <div className="w-20 h-2.5 bg-white/[0.04] rounded animate-pulse" />
                      <div className="w-8 h-2.5 bg-white/[0.04] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-8 rounded-lg bg-white/[0.02] border border-white/6 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoginCardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="relative w-full max-w-md bg-[#0d121f] border border-white/8 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Brand Icon Skeleton */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 animate-pulse" />
          <div className="w-48 h-6 bg-white/[0.08] rounded-lg animate-pulse" />
          <div className="w-64 h-3 bg-white/[0.03] rounded animate-pulse" />
        </div>

        {/* Input Placeholder Skeleton */}
        <div className="space-y-3 pt-2">
          <div className="w-24 h-3 bg-white/[0.04] rounded animate-pulse" />
          <div className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/8 animate-pulse" />
          <div className="w-full h-11 rounded-xl bg-white/[0.06] border border-white/10 animate-pulse" />
        </div>

        {/* Bottom Note */}
        <div className="w-48 h-2.5 bg-white/[0.02] rounded mx-auto animate-pulse" />
      </div>
    </div>
  )
}
