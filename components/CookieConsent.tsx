'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'psits_cookie_consent'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem(STORAGE_KEY)
      if (!acknowledged) {
        const timer = setTimeout(() => setIsVisible(true), 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      // Gracefully handle local storage unavailable
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // Gracefully ignore write errors
    }
    setIsVisible(false)
  }

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.aside
          role="region"
          aria-label="Cookie and Privacy Notice"
          initial={{ opacity: 0, y: 20, scale: 0.92, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{
            opacity: 0,
            y: 32,
            scale: 0.8,
            filter: 'blur(14px)',
            transition: {
              duration: 0.35,
              ease: [0.32, 0.72, 0, 1],
            },
          }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto max-w-[calc(100%-1.25rem)] sm:max-w-xl px-3 sm:px-4 py-1.5 rounded-full backdrop-blur-2xl bg-white/80 dark:bg-[#0c121e]/80 border border-black/10 dark:border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/60 dark:ring-white/10 flex items-center justify-between gap-2.5 sm:gap-4 text-xs select-none pointer-events-auto"
        >
          <span className="text-[10px] sm:text-[11px] text-text/80 whitespace-nowrap leading-none font-normal">
            This platform uses essential cookies strictly for security.
          </span>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 text-[10px] sm:text-[11px] whitespace-nowrap">
            <Link
              href="/privacy"
              className="text-gold underline underline-offset-2 hover:text-gold-muted transition-colors font-medium leading-none"
            >
              Privacy
            </Link>
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={handleAccept}
              className="px-2.5 sm:px-3 py-1 rounded-full bg-gold hover:bg-gold/90 text-[#0D1117] font-semibold transition-colors cursor-pointer active:scale-95 shadow-sm text-[10px] sm:text-[11px] leading-none"
            >
              Got it
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
