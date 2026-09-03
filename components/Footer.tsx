'use client'

import Link from 'next/link'
import Image from 'next/image'
import UseAnimations from 'react-useanimations'
import facebook from 'react-useanimations/lib/facebook'
import github from 'react-useanimations/lib/github'
import mail from 'react-useanimations/lib/mail'

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-surface mt-24 overflow-hidden">
      {/* CCIS Seal Watermark Backdrop */}
      <div
        aria-hidden="true"
        className="absolute -right-14 sm:-right-8 md:right-2 lg:right-12 top-1/2 -translate-y-1/2 pointer-events-none select-none opacity-[0.05] md:opacity-[0.07]"
      >
        <Image
          src="/assets/logo/ccis new logo.png"
          alt=""
          width={380}
          height={380}
          className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Image
              src="/assets/logo/PSITS logo.png"
              alt="PSITS-UA"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="font-display font-bold text-white">
              PSITS<span className="text-gold">-UA</span>
            </span>
          </div>
          <p className="text-muted text-sm max-w-xs">
            Students Together in Information Technology. University of Antique
            — San Jose, Antique.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">
            Links
          </p>
          {[
            { href: '/', label: 'Home' },
            { href: '/about', label: 'CBL' },
            { href: '/officers', label: 'Officers' },
            { href: '/events', label: 'COA' },
            { href: '/projects', label: 'Projects' },
          ].map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-muted hover:text-gold transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted uppercase tracking-widest mb-1">
            Connect
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/p/PSITS-UA-100086983023496/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Facebook"
            >
              <UseAnimations
                animation={facebook}
                size={24}
                strokeColor="#F5A623"
                className="cursor-pointer"
              />
            </a>
            <a
              href="#"
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="GitHub"
            >
              <UseAnimations
                animation={github}
                size={24}
                strokeColor="#F5A623"
                className="cursor-pointer"
              />
            </a>
            <a
              href="mailto:psits-ua@antiquespride.edu.ph"
              className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Email"
            >
              <UseAnimations
                animation={mail}
                size={24}
                strokeColor="#F5A623"
                className="cursor-pointer"
              />
            </a>
          </div>
        </div>
      </div>
      <div className="relative z-10 border-t border-white/5 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} PSITS-UA. Built by Bonfire Base Studio.
      </div>
    </footer>
  )
}
