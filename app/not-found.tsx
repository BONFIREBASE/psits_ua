import Link from 'next/link'
import Image from 'next/image'
import { Home } from 'lucide-react'
import NotFoundAnimation from '@/components/NotFoundAnimation'

export const metadata = {
  title: '404 — Page Not Found | PSITS-UA',
  description: 'The requested resource could not be found on the PSITS-UA platform.',
}

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[9999] bg-canvas text-text flex items-center justify-center px-6 overflow-hidden select-none">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold/[0.06] rounded-full blur-[160px] pointer-events-none"
      />

      <div className="relative z-10 max-w-md w-full text-center space-y-5">
        {/* PSITS Official Logo */}
        <Link
          href="/"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
          aria-label="Return to PSITS-UA Home"
        >
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto drop-shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:scale-105 transition-transform shrink-0">
            <Image
              src="/assets/logo/PSITS logo.png"
              alt="PSITS-UA Logo"
              fill
              sizes="(max-width: 640px) 56px, 64px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* 404 Animated Lottie Graphic */}
        <NotFoundAnimation />

        <div className="space-y-2">
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text tracking-tight">
            Page Lost in the Stack.
          </h1>
          <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-sm mx-auto font-normal">
            The route you requested does not exist or has been archived from the PSITS-UA portal.
          </p>
        </div>

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
