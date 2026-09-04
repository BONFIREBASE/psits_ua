import Link from 'next/link'
import { Activity, Home, RotateCcw } from 'lucide-react'

export const metadata = {
  title: '429 — Too Many Requests | PSITS-UA',
  description: 'Connection rate limit exceeded. Please wait a moment before trying again.',
}

export default function TooManyRequestsPage() {
  return (
    <div className="fixed inset-0 z-[60] bg-[#0D1117] flex items-center justify-center px-6 overflow-hidden select-none">
      {/* Ambient glowing aura */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF6F00]/[0.04] rounded-full blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF6F00]/20 bg-[#FF6F00]/5 backdrop-blur-md">
          <Activity size={12} className="text-[#FFA726]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] font-bold text-[#FFA726]">
            Traffic Control // 429 Rate Limited
          </span>
        </div>

        {/* Large aesthetic error code */}
        <div className="space-y-3">
          <h1 className="font-display font-black text-7xl sm:text-8xl md:text-9xl text-white tracking-tight leading-none">
            4<span className="animate-orange-gradient">2</span>9
          </h1>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Too Many Requests.
          </h2>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-normal">
            You are sending requests faster than our portal threshold allows. Please wait a moment before retrying.
          </p>
        </div>

        {/* Action controls: Icon-only Return Home & Retry */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/"
            aria-label="Return Home"
            title="Return to Home"
            className="p-3.5 rounded-full border border-white/10 bg-white/[0.04] text-gold hover:text-[#0D1117] hover:bg-gold hover:border-gold hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] transition-all duration-300 active:scale-95 group cursor-pointer"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
          </Link>

          <a
            href="javascript:location.reload()"
            aria-label="Retry Connection"
            title="Retry Connection"
            className="p-3.5 rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 active:scale-95 group cursor-pointer"
          >
            <RotateCcw size={20} className="group-hover:rotate-45 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  )
}
