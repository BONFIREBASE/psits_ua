'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Quote } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import DispatchCarousel from '@/components/DispatchCarousel'
import { socialDispatches } from '@/data/announcements'
import { dean } from '@/data/officers'

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-12 overflow-hidden bg-base">
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src="/assets/cover.jpg"
            alt="University of Antique College of Computing Studies"
            fill
            className="object-cover object-center opacity-35 sm:opacity-45"
            priority
            sizes="100vw"
          />
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
            <div className="inline-flex items-center justify-center h-9 px-5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md mb-8 shadow-sm">
              <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                &quot;Transforming Lives, Building Communities&quot;
              </span>
            </div>

            <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-6 select-none">
              <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">PSITS </span>
              <span className="text-[#F5A623] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">U</span>
              <span className="text-[#E63946] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">A</span>
            </h1>

            <p className="text-white/90 text-base sm:text-lg md:text-xl mb-6 font-normal tracking-wide max-w-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Philippine Society of Information Technology Students — University of Antique
            </p>

            <p className="text-white font-bold text-2xl sm:text-3xl md:text-4xl max-w-3xl mx-auto leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Empowering Future IT Students Through Innovation and Collaboration.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative max-w-4xl mx-auto px-6 py-14">
        <div className="grid grid-cols-3 divide-x divide-white/10 items-center">
          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              600+
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Active Members
            </p>
          </div>

          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              5+
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Events per Year
            </p>
          </div>

          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              2018
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Est. Year
            </p>
          </div>
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-center">
          <div className="md:col-span-5 flex justify-center">
            <div
              className="relative w-72 sm:w-80 md:w-[380px] h-[420px] sm:h-[460px] md:h-[500px] select-none"
              style={{
                maskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 98%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 98%)',
              }}
            >
              <Image
                src="/assets/dean.png"
                alt={`${dean.name} — ${dean.title}, ${dean.college}`}
                fill
                className="object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.95)] pointer-events-none"
                priority
              />
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="font-mono text-xs text-gold uppercase tracking-[0.25em] font-bold block">
                Leadership
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase">
                Dean&apos;s <span className="text-gold">Message</span>
              </h2>
            </div>

            <blockquote className="relative">
              <Quote size={28} className="text-gold/35 mb-3" />
              <p className="font-display font-medium text-base sm:text-lg md:text-xl text-white/90 leading-relaxed italic">
                &ldquo;One of my developmental goals is all about digital and smart campus transformation. I think it&apos;s good that the University of Antique has started the implementation of the AIMS. With this, there is a need to continue the implementation of the AIMS system of the university.&rdquo;
              </p>
            </blockquote>

            <div className="pt-4 border-t border-white/10 space-y-1">
              <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                {dean.name}
              </h3>
              <p className="font-mono text-xs sm:text-[13px] text-gold/90 uppercase tracking-widest font-semibold">
                Dean · College of Computing and Information Sciences
              </p>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                {dean.institution}
              </p>
            </div>
          </div>
        </div>
      </section>

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

      <section className="relative max-w-6xl mx-auto px-6 pb-24">
        <div className="relative min-h-[360px] md:min-h-[400px] flex items-center rounded-2xl overflow-hidden border border-white/10 bg-[#0a0e17]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/assets/cover.jpg"
              alt="University of Antique College of Computing Studies"
              fill
              className="object-cover object-right md:object-[80%_center] opacity-60 md:opacity-75"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0e17] from-35% via-[#0a0e17]/95 via-55% to-transparent" />
          </div>

          <div className="relative z-10 p-8 sm:p-12 md:p-14 max-w-xl">
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-gold font-bold mb-3">
              Join the Chapter
            </p>

            <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white leading-tight tracking-tight mb-3.5">
              Shape the future of tech with PSITS-UA.
            </h2>

            <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-7 max-w-md font-normal">
              Connect with student developers, designers, and tech innovators across the University of Antique.
            </p>

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
                <span className="text-gold"></span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
