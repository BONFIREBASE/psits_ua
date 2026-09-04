'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

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
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pt-4">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`
            pointer-events-auto
            flex items-center justify-between
            w-full max-w-3xl
            h-12 sm:h-14
            px-3 sm:px-4
            rounded-full
            border
            transition-all duration-500
            ${scrolled
              ? 'bg-surface/90 backdrop-blur-md border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
              : 'bg-surface/60 backdrop-blur-md border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.2)]'
            }
          `}
        >
          <Link href="/" className="flex items-center gap-2 shrink-0 pl-1">
            <Image
              src="/assets/logo/PSITS logo.png"
              alt="PSITS-UA"
              width={28}
              height={28}
              className="object-contain"
            />
            <span className="font-display font-bold text-[14px] sm:text-[15px] tracking-tight" style={{ color: '#FFFFFF' }}>
              PSITS<span style={{ color: '#F5A623' }}>-U</span><span style={{ color: '#E63946' }}>A</span>
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`
                      relative px-3.5 py-1.5 rounded-full text-[13px] font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'text-[#0D1117] font-semibold'
                        : 'hover:bg-white/[0.06]'
                      }
                    `}
                    style={{
                      color: isActive ? '#0D1117' : 'rgba(255,255,255,0.7)',
                      backgroundColor: isActive ? '#F5A623' : undefined,
                    }}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-full hover:bg-white/[0.08] transition-colors"
            aria-label="Toggle menu"
          >
            {open
              ? <X size={20} style={{ color: '#F5A623' }} />
              : <Menu size={20} style={{ color: '#F5A623' }} />
            }
          </button>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md md:hidden"
            />

            <motion.div
              key="nav-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-20 left-4 right-4 z-50 md:hidden"
            >
              <div className="bg-surface/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
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
                          `}
                          style={{
                            color: isActive ? '#0D1117' : '#FFFFFF',
                            backgroundColor: isActive ? '#F5A623' : 'transparent',
                          }}
                        >
                          {label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
