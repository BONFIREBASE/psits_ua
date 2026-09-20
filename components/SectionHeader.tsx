'use client'

import { motion } from 'framer-motion'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
}

export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <p className="text-gold text-xs sm:text-sm font-medium tracking-wide mb-2 sm:mb-3 break-words">
        {eyebrow}
      </p>
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white gold-underline mb-3 sm:mb-4 tracking-tight leading-tight break-words">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-700 dark:text-white/80 text-sm sm:text-base md:text-lg max-w-2xl mt-3 sm:mt-4 leading-relaxed font-normal break-words">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
