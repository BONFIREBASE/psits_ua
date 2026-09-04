import Link from 'next/link'
import { Home, Terminal } from 'lucide-react'

export const metadata = {
  title: '404 — Page Not Found | PSITS-UA',
  description: 'The requested resource could not be found on the PSITS-UA platform.',
}

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[60] bg-[#0D1117] flex items-center justify-center px-6 overflow-hidden select-none">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.04] rounded-full blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md">
          <Terminal size={12} className="text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] font-bold text-white/70">
            Status 404 // Not Found
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-display font-black text-7xl sm:text-8xl md:text-9xl text-white tracking-tight leading-none">
            4<span className="text-gold">0</span>4
          </h1>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Page Lost in the Stack.
          </h2>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-normal">
            The route you requested does not exist or has been archived from the PSITS-UA portal.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center">
          <Link
            href="/"
            aria-label="Return Home"
            title="Return to Home"
            className="p-3.5 rounded-full border border-white/10 bg-white/[0.04] text-gold hover:text-[#0D1117] hover:bg-gold hover:border-gold hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] transition-all duration-300 active:scale-95 group cursor-pointer"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
