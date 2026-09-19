'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/officers', label: 'Officers' },
  { href: '/events', label: 'COA' },
  { href: '/projects', label: 'Projects' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      window.addEventListener('keydown', onKeyDown)
    }
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[110] flex justify-center pointer-events-none px-4 pt-3 sm:pt-4">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`
            pointer-events-auto
            relative flex items-center justify-between
            w-full max-w-3xl
            h-12 sm:h-14
            px-3 sm:px-4
            rounded-full
            border
            transition-all duration-500 ease-out
            ${scrolled
              ? 'bg-white/85 dark:bg-[#0D1117]/85 backdrop-blur-xl border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_12px_36px_rgba(0,0,0,0.6),0_0_20px_rgba(245,166,35,0.06)]'
              : 'bg-white/70 dark:bg-[#0D1117]/60 backdrop-blur-md border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_4px_24px_rgba(0,0,0,0.3)]'
            }
          `}
        >
          {/* Specular glass rim highlight */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent pointer-events-none rounded-full"
          />

          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 shrink-0 pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
            aria-label="PSITS-UA Home"
          >
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Image
                src="/assets/logo/PSITS logo.png"
                alt="PSITS-UA"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </motion.div>
            <span className="font-display font-bold text-[14px] sm:text-[15px] tracking-tight text-slate-900 dark:text-white select-none">
              PSITS<span className="text-gold">-U</span><span className="text-[#E63946]">A</span>
            </span>
          </Link>

          {/* Desktop Nav Links & Theme Toggle */}
          <div className="hidden md:flex items-center gap-1.5">
            <ul
              className="flex items-center gap-1"
              onMouseLeave={() => setHoveredPath(null)}
            >
              {links.map(({ href, label }) => {
                const isActive = pathname === href

                return (
                  <li key={href} className="relative">
                    <Link
                      href={href}
                      onMouseEnter={() => setHoveredPath(href)}
                      className={`
                        relative z-10 block px-3.5 py-1.5 rounded-full text-[13px] font-medium
                        transition-colors duration-200 select-none
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
                        ${isActive
                          ? 'text-[#0D1117] font-semibold'
                          : 'text-slate-600 hover:text-slate-900 dark:text-white/75 dark:hover:text-white'
                        }
                      `}
                    >
                      {label}
                    </Link>

                    {/* Sliding active pill indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFA726] shadow-[0_2px_12px_rgba(245,166,35,0.4)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Hover highlight */}
                    {hoveredPath === href && !isActive && (
                      <motion.div
                        layoutId="navbar-hover-pill"
                        className="absolute inset-0 rounded-full bg-black/[0.05] dark:bg-white/[0.08]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="w-[1px] h-4 bg-black/10 dark:bg-white/15 mx-1" />
            <ThemeToggle size={17} />
          </div>

          {/* Mobile Right Controls: Theme Toggle + Menu Toggle */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle size={18} />
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="
                p-2 rounded-full
                text-gold hover:bg-black/5 dark:hover:bg-white/[0.08]
                transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
              "
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="pointer-events-none"
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="pointer-events-none"
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>
      </header>

      {/* Mobile Menu Overlay & Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] bg-black/40 dark:bg-black/75 backdrop-blur-md md:hidden"
          />
        )}

        {open && (
          <motion.div
            key="nav-menu"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 left-4 right-4 z-[100] md:hidden pointer-events-auto"
          >
            <div className="
              relative overflow-hidden
              bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-xl
              border border-black/10 dark:border-white/10
              rounded-2xl p-3
              shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_16px_48px_rgba(0,0,0,0.6)]
            ">
              <ul className="flex flex-col gap-1">
                {links.map(({ href, label }) => {
                  const isActive = pathname === href

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`
                          block px-4 py-3 rounded-xl text-[15px] font-medium
                          transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-r from-[#F5A623] to-[#FFA726] text-[#0D1117] font-semibold shadow-[0_4px_14px_rgba(245,166,35,0.35)]'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-black/[0.04] dark:text-white/85 dark:hover:text-white dark:hover:bg-white/[0.06]'
                          }
                        `}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

