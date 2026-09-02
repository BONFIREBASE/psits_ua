'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Calendar, Zap } from 'lucide-react'

const stats = [
  { value: '200+', label: 'Active Members' },
  { value: '5+', label: 'Events per Year' },
  { value: '2018', label: 'Est. Year' },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-12 overflow-hidden bg-base">
        {/* Deep ambient background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-navy/40 rounded-full blur-[160px]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/60 via-[#0D1117]/85 to-[#0D1117]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center my-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Pill Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md mb-8 shadow-sm">
              <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase">
                Welcome to the Future
              </span>
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

      {/* Stats */}
      <section className="border-y border-white/5 bg-surface py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 divide-x divide-white/10">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center px-3 sm:px-8">
              <p className="font-display font-extrabold text-2xl sm:text-3xl text-gold mb-1">
                {value}
              </p>
              <p className="text-white/80 text-xs sm:text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="font-display font-bold text-h2 text-white gold-underline mb-16">
          What we do
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Users size={24} className="text-gold" />,
              title: 'Constitution & By-Laws',
              desc: 'Read our official charter, membership policies, officer mandates, and procedural statutes.',
              href: '/about',
            },
            {
              icon: <Calendar size={24} className="text-gold" />,
              title: 'Calendar of Activities (COA)',
              desc: 'Explore our complete schedule of bootcamps, hackathons, assemblies, and job fairs.',
              href: '/events',
            },
            {
              icon: <Zap size={24} className="text-gold" />,
              title: 'Grow Skills',
              desc: 'Workshops, competitions, and hands-on projects that prepare members for real industry work.',
              href: '/events',
            },
          ].map(({ icon, title, desc, href }) => (
            <Link
              key={title}
              href={href}
              className="group block bg-surface border border-white/5 rounded-lg p-7 card-hover"
            >
              <div className="mb-4">{icon}</div>
              <h3 className="font-display font-bold text-h3 text-white mb-2">
                {title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
