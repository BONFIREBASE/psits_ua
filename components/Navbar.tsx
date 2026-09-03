'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import UseAnimations from 'react-useanimations'
import menu from 'react-useanimations/lib/menu'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'CBL' },
  { href: '/officers', label: 'Officers' },
  { href: '/events', label: 'COA' },
  { href: '/projects', label: 'Projects' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-base/95 backdrop-blur-md border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/logo/PSITS logo.png"
            alt="PSITS-UA"
            width={36}
            height={36}
            className="object-contain"
          />
          <span className="font-display font-bold text-white text-lg tracking-tight">
            PSITS<span className="text-gold">-U</span><span className="text-[#E63946]">A</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === href
                    ? 'text-gold'
                    : 'text-muted hover:text-text'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <div className="md:hidden">
          <UseAnimations
            animation={menu}
            size={26}
            strokeColor="#F5A623"
            reverse={open}
            onClick={() => setOpen(!open)}
            className="cursor-pointer"
            aria-label="Toggle menu"
          />
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-surface border-t border-white/5 px-6 py-4"
          >
            <ul className="flex flex-col gap-4">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`text-sm font-medium ${
                      pathname === href ? 'text-gold' : 'text-muted'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
