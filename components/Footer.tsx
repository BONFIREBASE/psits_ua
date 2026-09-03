'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import UseAnimations from 'react-useanimations'
import facebook from 'react-useanimations/lib/facebook'
import github from 'react-useanimations/lib/github'
import mail from 'react-useanimations/lib/mail'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Constitution & By-Laws' },
  { href: '/officers', label: 'Leadership Directory' },
  { href: '/events', label: 'Calendar of Activities' },
  { href: '/projects', label: 'Student Projects' },
]

const footerLogos = [
  {
    src: '/assets/logo/ccis new logo.png',
    alt: 'CCIS Seal',
  },
  {
    src: '/assets/logo/UA Logo.png',
    alt: 'University of Antique Seal',
  },
]

export default function Footer() {
  const [activeLogoIndex, setActiveLogoIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLogoIndex((prev) => (prev + 1) % footerLogos.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])
  return (
    <footer className="relative border-t border-white/5 bg-surface mt-24 overflow-hidden">
      {/* Subtle CCIS Seal Watermark Backdrop */}
      <div
        aria-hidden="true"
        className="absolute -right-20 sm:-right-16 md:-right-10 lg:-right-6 top-1/3 -translate-y-1/2 pointer-events-none select-none opacity-[0.04] md:opacity-[0.06]"
      >
        <Image
          src="/assets/logo/ccis new logo.png"
          alt=""
          width={380}
          height={380}
          className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain -rotate-12"
        />
      </div>

      {/* Upper Section: Navigation & Connect Columns (Minimalist, Left-Aligned) */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 sm:pt-16 pb-6 flex flex-wrap items-start justify-start gap-14 sm:gap-24">
        {/* Governance / Navigation Links */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono font-medium text-white/40 uppercase tracking-[0.2em] mb-1">
            Governance
          </p>
          <div className="flex flex-col gap-1.5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-xs sm:text-sm text-muted hover:text-white transition-colors duration-150 tracking-wide"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Connect & Social Icons */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono font-medium text-white/40 uppercase tracking-[0.2em] mb-1">
            Connect
          </p>
          <div className="flex items-center gap-3.5 py-1">
            <a
              href="https://www.facebook.com/p/PSITS-UA-100086983023496/"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
              aria-label="Facebook"
            >
              <UseAnimations
                animation={facebook}
                size={20}
                strokeColor="#E8E8E8"
                className="cursor-pointer"
              />
            </a>
            <a
              href="https://github.com/bonfire404/psits_ua"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
              aria-label="GitHub"
            >
              <UseAnimations
                animation={github}
                size={20}
                strokeColor="#E8E8E8"
                className="cursor-pointer"
              />
            </a>
            <a
              href="mailto:psits-ua@antiquespride.edu.ph"
              className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
              aria-label="Email"
            >
              <UseAnimations
                animation={mail}
                size={20}
                strokeColor="#E8E8E8"
                className="cursor-pointer"
              />
            </a>
          </div>
          <p className="text-[11px] font-mono text-muted/50 mt-1 max-w-[200px] leading-relaxed">
            CCIS • UA Main Campus
          </p>
        </div>
      </div>

      {/* Centerpiece: Massive Display Typographic Wordmark (Antigravity Style) */}
      <div className="relative z-10 w-full overflow-hidden px-4 sm:px-6 py-4 select-none border-b border-white/5 flex justify-center items-center">
        <h2 className="w-full text-center font-display font-black text-[clamp(2.5rem,10.5vw,11.8rem)] leading-[0.85] tracking-tighter text-white whitespace-nowrap drop-shadow-[0_4px_32px_rgba(0,0,0,0.6)]">
          PSITS<span className="text-gold">-U</span><span className="text-[#E63946]">A</span>
        </h2>
      </div>

      {/* Bottom Bar: Baseline Credits & Carousel Logo Loop */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div className="flex items-center gap-3">
          {/* Animated Carousel Logo Container (CCIS & UA) */}
          <div className="relative w-5 h-5 overflow-hidden flex items-center justify-center shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLogoIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Image
                  src={footerLogos[activeLogoIndex].src}
                  alt={footerLogos[activeLogoIndex].alt}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Static Institutional Text */}
          <span className="font-medium text-white/70 whitespace-nowrap">
            College of Computing and Information Sciences — University of Antique
          </span>
        </div>

        <div className="text-muted/80">
          © {new Date().getFullYear()} PSITS-UA. Built by Bonfire Base Studio.
        </div>
      </div>
    </footer>
  )
}

