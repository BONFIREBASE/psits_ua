'use client'

import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useSyncExternalStore } from 'react'

interface ThemeToggleProps {
  className?: string
  size?: number
}

const emptySubscribe = () => () => {}

export default function ThemeToggle({ className = '', size = 18 }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) {
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 ${className}`}
        aria-hidden="true"
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`
        relative flex items-center justify-center
        w-8 h-8 rounded-full
        transition-colors duration-200
        text-gold hover:text-gold-muted
        hover:bg-black/5 dark:hover:bg-white/10
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        key={isDark ? 'dark' : 'light'}
        initial={{ rotate: isDark ? -90 : 90, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        exit={{ rotate: isDark ? 90 : -90, scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-center"
      >
        {isDark ? (
          <Sun size={size} className="text-[#F5A623]" />
        ) : (
          <Moon size={size} className="text-[#1B2A6B]" />
        )}
      </motion.div>
    </button>
  )
}
