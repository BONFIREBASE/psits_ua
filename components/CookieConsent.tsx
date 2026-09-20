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
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          role="region"
          aria-label="Cookie and Privacy Notice"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] sm:w-auto max-w-4xl px-4 sm:px-6 py-2.5 sm:py-2 rounded-2xl sm:rounded-full backdrop-blur-xl bg-slate-900/90 dark:bg-black/90 border border-white/15 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6 text-xs font-mono text-slate-300"
        >
          <span className="text-[11px] sm:text-xs text-slate-300 text-center sm:text-left whitespace-normal sm:whitespace-nowrap">
            This platform uses essential cookies strictly for authentication and system security.
          </span>

          <div className="flex items-center gap-3.5 flex-shrink-0 text-[11px] whitespace-nowrap">
            <Link
              href="/privacy"
              className="text-gold underline underline-offset-2 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer active:scale-95 text-[11px]"
            >
              Got it
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
