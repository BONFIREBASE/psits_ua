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
  { href: '/about', label: 'About & History' },
  { href: '/officers', label: 'Leadership Directory' },
  { href: '/events', label: 'Calendar of Activities' },
  { href: '/projects', label: 'Student Projects' },
  { href: '/submission', label: 'Polo Shirt Contest' },
  { href: '/merch', label: 'Official Merch' },
  { href: '/management', label: 'Management' },
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
    <footer className="relative border-t border-black/5 dark:border-white/5 bg-surface mt-24 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute -right-20 sm:-right-16 md:-right-10 lg:-right-6 top-[60%] -translate-y-1/2 pointer-events-none select-none opacity-[0.04] md:opacity-[0.06]"
      >
        <Image
          src="/assets/logo/ccis new logo.png"
          alt=""
          width={380}
          height={380}
          className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain -rotate-12"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 sm:pt-16 pb-6 flex flex-wrap items-start justify-start gap-14 sm:gap-24">
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-1">
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

        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-1">
            Policies & Legal
          </p>
          <Link
            href="/terms"
            className="text-xs text-muted hover:text-gold transition-colors duration-200"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="text-xs text-muted hover:text-gold transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted hover:text-gold transition-colors duration-200"
          >
            Sitemap
          </a>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-mono font-medium text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-1">
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
              className="text-muted hover:text-slate-900 dark:hover:text-white transition-colors p-1"
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-center sm:text-left">
        <div className="flex items-center gap-3 justify-center sm:justify-start">
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

          <span className="font-medium text-slate-700 dark:text-white/70 break-words">
            College of Computing and Information Sciences — University of Antique
          </span>
        </div>

        <div className="text-muted/80 flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 flex-wrap text-center sm:text-left">
          <span>© {new Date().getFullYear()} PSITS-UA.</span>
          <span className="text-muted/40">·</span>
          <Link href="/terms" className="hover:text-gold transition-colors">
            Terms
          </Link>
          <span className="text-muted/40">·</span>
          <Link href="/privacy" className="hover:text-gold transition-colors">
            Privacy
          </Link>
          <span className="text-muted/40">·</span>
            <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-white/45">Built by</span>
            <a
              href="https://bonfire.base69.studio/whatweoffer"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center font-bold cursor-pointer transition-transform duration-200 active:scale-95"
            >
              <span className="animate-orange-gradient text-xs sm:text-[13px] tracking-wide underline underline-offset-4 decoration-[#FF6F00]/40 group-hover:decoration-[#FF6F00] transition-all drop-shadow-[0_0_14px_rgba(255,111,0,0.35)]">
                Bonfire Base Studio
              </span>
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
