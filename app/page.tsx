'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import DispatchCarousel from '@/components/DispatchCarousel'
import { socialDispatches } from '@/data/announcements'

const heroPhrases = [
  { text: 'Welcome to the Future', isItalic: false, isUpper: true },
  { text: '"saan ba ako nag kulang?"', isItalic: true, isUpper: false },
]

export default function HomePage() {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % heroPhrases.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-12 overflow-hidden bg-base">
        {/* Background Cover Image with Cinematic Vignette */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src="/assets/cover.jpg"
            alt="University of Antique College of Computing Studies"
            fill
            className="object-cover object-center opacity-35 sm:opacity-45"
            priority
            sizes="100vw"
          />
          {/* Ambient Glows & Vignettes ensuring high text contrast */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-navy/50 rounded-full blur-[160px]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/60 via-[#0D1117]/75 to-[#0D1117]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center my-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Pill Eyebrow Badge (Cycles every 3 seconds) */}
            <div className="inline-flex items-center justify-center min-w-[260px] sm:min-w-[290px] h-9 px-5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md mb-8 shadow-sm overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className={`text-white/90 text-xs sm:text-sm ${
                    heroPhrases[phraseIndex].isItalic
                      ? 'italic font-medium text-gold tracking-wide'
                      : 'font-semibold tracking-[0.25em] uppercase'
                  }`}
                >
                  {heroPhrases[phraseIndex].text}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Giant Title: PSITS (White) U (Yellow) A (Red) */}
            <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-6 select-none">
              <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">PSITS </span>
              <span className="text-[#F5A623] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">U</span>
              <span className="text-[#E63946] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">A</span>
            </h1>

            {/* Sub-line 1: Chapter Designation */}
            <p className="text-white/90 text-base sm:text-lg md:text-xl mb-6 font-normal tracking-wide max-w-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Philippine Society of Information Technology Students — University of Antique
            </p>

            {/* Sub-line 2: Core Mission Tagline */}
            <p className="text-white font-bold text-2xl sm:text-3xl md:text-4xl max-w-3xl mx-auto leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Empowering Future IT Leaders Through Innovation and Collaboration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Minimalist Stats Strip */}
      <section className="relative max-w-4xl mx-auto px-6 py-14">
        <div className="grid grid-cols-3 divide-x divide-white/10 items-center">
          {/* Stat 1: 200+ Active Members */}
          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              200+
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Active Members
            </p>
          </div>

          {/* Stat 2: 5+ Events per Year */}
          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              5+
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Events per Year
            </p>
          </div>

          {/* Stat 3: 2018 (Alternates every 3s to "jo ano jo ako pa din ba jo?") */}
          <div className="text-center px-4 sm:px-8 min-h-[64px] sm:min-h-[76px] flex flex-col justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {phraseIndex === 0 ? (
                <motion.div
                  key="stat-est"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
                    2018
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
                    Est. Year
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="stat-jo"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="font-display font-bold text-xs sm:text-sm md:text-base text-gold italic leading-snug mb-1">
                    &ldquo;jo ano jo ako pa din ba jo?&rdquo;
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 font-medium">
                    Est. 2018
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Latest Official Social Dispatches */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <SectionHeader
            eyebrow="Community Pulse"
            title="What's Happening in PSITS"
            subtitle="Stay in the loop with official event recaps, department event, and student spotlights."
          />
        </div>
        <DispatchCarousel dispatches={socialDispatches} />
      </section>

      {/* ─── Minimalist Institutional CTA ─── */}
      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="relative min-h-[360px] md:min-h-[400px] flex items-center rounded-2xl overflow-hidden border border-white/10 bg-[#0a0e17]">
          {/* Background Cover Image with Heavy Left Mask */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/cover.jpg"
              alt="University of Antique College of Computing Studies"
              fill
              className="object-cover object-right md:object-[80%_center] opacity-60 md:opacity-75"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
            {/* Solid mask on left side to completely conceal background graphics/text */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0e17] from-35% via-[#0a0e17]/95 via-55% to-transparent" />
          </div>

          {/* Minimalist Content Layer */}
          <div className="relative z-10 p-8 sm:p-12 md:p-14 max-w-xl">
            {/* Subtle Eyebrow */}
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-gold font-bold mb-3">
              Join the Chapter
            </p>

            {/* Clean Headline */}
            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight tracking-tight mb-3.5">
              Shape the future of tech with PSITS-UA.
            </h2>

            {/* Concise Subtitle */}
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-7 max-w-md font-normal">
              Connect with student developers, designers, and tech innovators across the University of Antique.
            </p>

            {/* Streamlined Actions */}
            <div className="flex items-center gap-5">
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSd005fH-_fxNnf3qREIODWMGWVGi4K0svkFO3cA2qr0Nswc0w/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-[#0D1117] font-mono font-bold text-xs sm:text-sm hover:bg-white transition-all shadow-md active:scale-95"
              >
                <span>Join Organization</span>
                <ArrowUpRight size={15} />
              </a>

              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono text-white/60 hover:text-white transition-colors"
              >
                <span>View Projects</span>
                <span className="text-gold">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
