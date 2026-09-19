import Link from 'next/link'
import { Home, Terminal } from 'lucide-react'

export const metadata = {
  title: '404 — Page Not Found | PSITS-UA',
  description: 'The requested resource could not be found on the PSITS-UA platform.',
}

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[60] bg-canvas-theme flex items-center justify-center px-6 overflow-hidden select-none">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.06] rounded-full blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border-theme bg-surface-theme/80 backdrop-blur-md shadow-xs">
          <Terminal size={12} className="text-amber-600 dark:text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground-theme">
            Status 404 // Not Found
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-display font-black text-7xl sm:text-8xl md:text-9xl text-foreground-theme tracking-tight leading-none">
            4<span className="text-amber-600 dark:text-gold">0</span>4
          </h1>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-foreground-theme tracking-tight">
            Page Lost in the Stack.
          </h2>
          <p className="text-muted-foreground-theme text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-normal">
            The route you requested does not exist or has been archived from the PSITS-UA portal.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center">
          <Link
            href="/"
            aria-label="Return Home"
            title="Return to Home"
            className="p-3.5 rounded-full border border-border-theme bg-surface-theme text-amber-600 dark:text-gold hover:text-[#0D1117] hover:bg-gold hover:border-gold hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] transition-all duration-300 active:scale-95 group cursor-pointer shadow-xs"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
