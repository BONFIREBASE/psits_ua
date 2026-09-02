'use client'

import Link from 'next/link'
import Image from 'next/image'
import UseAnimations from 'react-useanimations'
import facebook from 'react-useanimations/lib/facebook'
import github from 'react-useanimations/lib/github'
import mail from 'react-useanimations/lib/mail'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start justify-between gap-8">
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
            { href: '/contact', label: 'Contact' },
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
              href="#"
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
              href="mailto:psitsua@ua.edu.ph"
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
      <div className="border-t border-white/5 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} PSITS-UA. Built with 💛 by Bonfire Base
        Studio.
      </div>
    </footer>
  )
}
