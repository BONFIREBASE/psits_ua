'use client'

import Link from 'next/link'
import Image from 'next/image'
import LottiePlayer from '@/components/LottiePlayer'
import communityAnimation from '@/public/assets/community.json'

export default function CommunityPage() {
  return (
    <div className="relative w-full min-h-[calc(100dvh-120px)] sm:min-h-[calc(100dvh-140px)] bg-canvas text-text flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 select-none overflow-hidden font-body">
      {/* Subtle Ambient Glow matching site aesthetic */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gold/[0.04] dark:bg-gold/[0.05] blur-[160px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-navy/20 dark:bg-navy/30 rounded-full blur-[140px] pointer-events-none" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md w-full my-auto space-y-4">
        {/* PSITS Official Logo with Navbar Clearance */}
        <Link
          href="/"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
          aria-label="PSITS-UA Home"
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

        {/* Centered Responsive Community Lottie */}
        <div className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 aspect-[5/4] flex items-center justify-center shrink-0 mx-auto">
          <LottiePlayer
            animationData={communityAnimation}
            className="w-full h-full"
            animationClassName="drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* Minimalist Typography */}
        <div className="space-y-2 shrink-0">
          <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl tracking-tight uppercase text-slate-900 dark:text-white leading-tight">
            Community Under <span className="text-gold">Construction</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed pt-1">
            We&apos;re currently preparing the PSITS Community for BSIT students. A dedicated space for peer discussions, channel threads, project collaborations, and tech forums is in the works and will be open soon!
          </p>
        </div>

      </div>
    </div>
  )
}
