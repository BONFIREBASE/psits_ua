'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import UseAnimations from 'react-useanimations'
import facebook from 'react-useanimations/lib/facebook'
import github from 'react-useanimations/lib/github'
import mail from 'react-useanimations/lib/mail'

import { X, ArrowUpRight } from 'lucide-react'

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
  const [isProBonoOpen, setIsProBonoOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLogoIndex((prev) => (prev + 1) % footerLogos.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isProBonoOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProBonoOpen(false)
    }
    const timer = setTimeout(() => setIsProBonoOpen(false), 8000)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [isProBonoOpen])

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
            Governance & Chapter
          </p>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-muted hover:text-gold transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Connect Column (Interactive Animated Vector Icons) */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-mono font-medium text-white/40 uppercase tracking-[0.2em] mb-1">
            Connect
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://web.facebook.com/uapsits"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-muted hover:text-[#1877F2] transition-colors p-1"
            >
              <UseAnimations
                animation={facebook}
                size={22}
                strokeColor="#7A8394"
                className="cursor-pointer"
              />
            </a>

            <a
              href="https://github.com/bonfirebase/psits_ua"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className="text-muted hover:text-white transition-colors p-1"
            >
              <UseAnimations
                animation={github}
                size={22}
                strokeColor="#7A8394"
                className="cursor-pointer"
              />
            </a>

            <a
              href="mailto:psits-ua@antiquespride.edu.ph"
              aria-label="Official Email"
              className="text-muted hover:text-gold transition-colors p-1"
            >
              <UseAnimations
                animation={mail}
                size={22}
                strokeColor="#7A8394"
                className="cursor-pointer"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Institutional Strip & Dynamic Logo Carousel */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          {/* Animated Carousel Logo Container (CCIS & UA) */}
          <div className="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={footerLogos[activeLogoIndex].src}
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

        <div className="text-muted/80 flex items-center gap-2 flex-wrap">
          <span>© {new Date().getFullYear()} PSITS-UA.</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white/45">Built by</span>
            <button
              type="button"
              onClick={() => setIsProBonoOpen(true)}
              className="group inline-flex items-center font-bold cursor-pointer transition-transform duration-200 active:scale-95"
            >
              <span className="animate-orange-gradient text-xs sm:text-[13px] tracking-wide underline underline-offset-4 decoration-[#FF6F00]/40 group-hover:decoration-[#FF6F00] transition-all drop-shadow-[0_0_14px_rgba(255,111,0,0.35)]">
                Bonfire Base Studio
              </span>
            </button>
          </span>
        </div>
      </div>

      {/* ─── Liquid Glass Pro Bono Snackbar (Bottom-Right) ─── */}
      <AnimatePresence>
        {isProBonoOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 sm:w-92 sm:max-w-md rounded-2xl p-4 sm:p-5 overflow-hidden backdrop-blur-2xl bg-[#0D1117]/70 border border-white/15 shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.22),0_20px_50px_rgba(0,0,0,0.75)]"
          >
            {/* Liquid Specular Glare Overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.09] via-transparent to-white/[0.02]"
            />

            {/* Subtle Ambient Orange Glow Orb */}
            <div
              aria-hidden="true"
              className="absolute -top-8 -right-8 w-24 h-24 bg-[#FF6F00]/15 rounded-full blur-2xl pointer-events-none"
            />

            {/* Content Container */}
            <div className="relative z-10 space-y-3">
              {/* Header: Studio Title + Location + Dismiss */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h4 className="font-display font-black text-sm text-white tracking-tight">
                    Bonfire Base Studio
                  </h4>
                  <span className="font-mono text-[9px] text-white/35 uppercase tracking-wider">
                    · San Jose, Antique
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProBonoOpen(false)}
                  className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Message */}
              <p className="text-white/80 text-xs leading-relaxed font-normal">
                Engineered with pride in Antique by <span className="text-white font-medium">Bonfire Base Studio</span> to give PSITS-UA and CCIS an official, modern platform celebrating student tech innovation.
              </p>

              {/* Slogan & Glass Pill Link */}
              <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#FFA726]/85 italic">
                  &ldquo;Ignite Ideas, Survive the Future&rdquo;
                </span>
                <a
                  href="https://bonfire.base69.studio/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-white/90 hover:text-[#FFA726] transition-colors py-1 px-2.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 shadow-sm"
                >
                  <span>Visit Studio</span>
                  <ArrowUpRight size={12} className="text-[#FF8C00]" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
