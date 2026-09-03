'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { X, ArrowUpRight, MapPin, Calendar, Quote, PenTool, Camera, Palette, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SocialDispatch } from '@/data/announcements'

interface SocialDispatchCardProps {
  dispatch: SocialDispatch
  isActive?: boolean
}

const emptySubscribe = () => () => {}

export default function SocialDispatchCard({ dispatch, isActive = true }: SocialDispatchCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const open = useCallback(() => {
    if (isActive) setIsOpen(true)
  }, [isActive])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  return (
    <>
      {/* ─── Editorial Poster Card ─── */}
      <article
        role="button"
        tabIndex={isActive ? 0 : -1}
        onClick={open}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && isActive) { e.preventDefault(); open() } }}
        className={`
          group relative cursor-pointer rounded-2xl overflow-hidden
          bg-surface border border-white/10 transition-all duration-500 flex flex-col
          ${isActive ? 'hover:border-white/25 shadow-2xl hover:shadow-[0_24px_60px_rgba(0,0,0,0.85)]' : 'border-white/5 opacity-75'}
        `}
      >
        {/* 100% Clear Thumbnail Container - No darkening gradient over artwork */}
        {dispatch.imageUrl && (
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[16/10] overflow-hidden bg-[#0a0e17] shrink-0">
            <Image
              src={dispatch.imageUrl}
              alt={dispatch.title}
              fill
              className={`object-cover object-center transition-transform duration-700 ease-out ${isActive ? 'group-hover:scale-[1.03]' : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 650px, 750px"
              priority
            />
          </div>
        )}

        {/* Dedicated Information Tray below thumbnail */}
        <div className="relative p-4 sm:p-5 flex flex-col justify-between bg-surface/95 border-t border-white/10">
          <div>
            {/* Meta row: Category pill + Date */}
            <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-mono mb-2">
              <span
                className="uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-gold/15 border border-gold/30"
                style={{ color: '#F5A623' }}
              >
                {dispatch.category}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <span className="font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
                {dispatch.date}
              </span>
            </div>

            {/* Title - Clean, legible, fits naturally with zero '...' */}
            <h3
              style={{ color: '#FFFFFF' }}
              className="font-display font-bold text-[14px] sm:text-[15px] md:text-[16px] leading-[1.35] tracking-tight"
            >
              {dispatch.title}
            </h3>
          </div>

          {/* Interactive footer hint */}
          {isActive && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span
                className="text-[11px] sm:text-[12px] font-mono tracking-wider uppercase transition-all duration-300 group-hover:translate-x-1"
                style={{ color: '#F5A623' }}
              >
                Tap to read full dispatch →
              </span>
              <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gold/40 bg-surface shadow-sm">
                  <Image
                    src="/assets/logo/PSITS logo.png"
                    alt="PSITS-UA"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* ─── Floating Modal: Teleported via Portal to document.body (Escapes all CSS transforms!) ─── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="dispatch-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={close}
                  className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md"
                />

                {/* Modal Dialog Container */}
                <motion.div
                  key="dispatch-modal"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center overflow-y-auto pt-14 pb-0 sm:py-8 sm:px-6"
                  onClick={close}
                >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full sm:max-w-3xl lg:max-w-4xl bg-surface border-t border-x border-white/10 sm:border sm:border-white/15 rounded-t-3xl sm:rounded-2xl overflow-hidden overflow-y-auto max-h-[92dvh] sm:max-h-[88vh] shadow-[0_25px_70px_rgba(0,0,0,0.95)] scrollbar-minimal flex flex-col"
              >
                {/* Desktop Sticky Header Bar with Close + ESC badge */}
                <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-surface/90 backdrop-blur-md border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gold/40">
                      <Image
                        src="/assets/logo/PSITS logo.png"
                        alt="PSITS-UA"
                        fill
                        className="object-contain p-0.5"
                      />
                    </div>
                    <span className="font-display font-bold text-xs sm:text-sm tracking-tight text-white">
                      PSITS-UA Dispatch Reader
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-white/50 bg-white/10 rounded border border-white/15">
                      ESC
                    </kbd>
                    <button
                      onClick={close}
                      className="p-1.5 sm:p-2 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 transition-colors"
                      aria-label="Close dispatch"
                    >
                      <X size={18} style={{ color: '#FFFFFF' }} />
                    </button>
                  </div>
                </div>

                {/* Banner Showcase - Clean full-width visual, zero text clash */}
                {dispatch.imageUrl && (
                  <div className="relative w-full aspect-[16/9] sm:aspect-[2.2/1] bg-[#0a0e17] shrink-0 border-b border-white/10">
                    <Image
                      src={dispatch.imageUrl}
                      alt={dispatch.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 800px, 950px"
                      priority
                    />
                  </div>
                )}

                {/* Article Reading Body */}
                <div className="px-6 sm:px-10 lg:px-12 py-8 space-y-6">
                  {/* Category & Date Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
                    <span
                      className="uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-gold/15 border border-gold/30"
                      style={{ color: '#F5A623' }}
                    >
                      {dispatch.category}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80">
                      <Calendar size={13} style={{ color: '#F5A623' }} />
                      {dispatch.date}
                    </span>
                    {dispatch.venue && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80">
                        <MapPin size={13} style={{ color: '#F5A623' }} />
                        {dispatch.venue}
                      </span>
                    )}
                    {dispatch.deadline && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 font-bold" style={{ color: '#F5A623' }}>
                        <Clock size={13} style={{ color: '#F5A623' }} />
                        Deadline: {dispatch.deadline}
                      </span>
                    )}
                  </div>

                  {/* Headline Title */}
                  <h1
                    style={{ color: '#FFFFFF' }}
                    className="font-display font-black text-2xl sm:text-3xl md:text-4xl leading-[1.2] tracking-tight"
                  >
                    {dispatch.title}
                  </h1>

                  {/* Highlight Quote Box */}
                  {dispatch.highlightQuote && (
                    <div className="my-6 p-5 sm:p-6 rounded-xl border-l-4 border-gold bg-white/[0.04] border border-white/10 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Quote size={22} style={{ color: '#F5A623' }} className="shrink-0 mt-1" />
                        <p
                          style={{ color: '#FFFFFF' }}
                          className="font-display italic font-bold text-base sm:text-lg md:text-xl leading-relaxed"
                        >
                          &ldquo;{dispatch.highlightQuote}&rdquo;
                        </p>
                      </div>
                      <p
                        className="text-xs font-mono font-semibold mt-2.5 pl-8"
                        style={{ color: '#F5A623' }}
                      >
                        — Student Affairs and Services (SAS) Head
                      </p>
                    </div>
                  )}

                  {/* Lead Excerpt Paragraph */}
                  <div className="pb-6 border-b border-white/10">
                    <p
                      style={{ color: '#FFFFFF' }}
                      className="text-base sm:text-lg leading-[1.8] font-medium"
                    >
                      {dispatch.excerpt}
                    </p>
                  </div>

                  {/* Full Narrative Text */}
                  <div className="space-y-4">
                    <p
                      style={{ color: 'rgba(255,255,255,0.9)' }}
                      className="text-sm sm:text-base leading-[1.8] font-normal"
                    >
                      {dispatch.fullContent}
                    </p>
                  </div>

                  {/* Participating Academic Colleges */}
                  {dispatch.involvedColleges && dispatch.involvedColleges.length > 0 && (
                    <div className="pt-4">
                      <p
                        className="text-[11px] font-mono uppercase tracking-widest font-bold mb-3"
                        style={{ color: '#F5A623' }}
                      >
                        Participating Academic Departments
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dispatch.involvedColleges.map((college) => (
                          <span
                            key={college}
                            style={{ color: '#FFFFFF' }}
                            className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 font-mono font-medium"
                          >
                            {college}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author / Photographer / Pubmat Credits Bar */}
                  <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono text-white/70">
                      {dispatch.credits.writer && (
                        <span className="flex items-center gap-1.5">
                          <PenTool size={13} style={{ color: '#F5A623' }} />
                          Writer: <strong className="text-white">{dispatch.credits.writer}</strong>
                        </span>
                      )}
                      {dispatch.credits.photographer && (
                        <>
                          {dispatch.credits.writer && <span className="text-white/20">·</span>}
                          <span className="flex items-center gap-1.5">
                            <Camera size={13} style={{ color: '#F5A623' }} />
                            Photography: <strong className="text-white">{dispatch.credits.photographer}</strong>
                          </span>
                        </>
                      )}
                      {dispatch.credits.pubmat && (
                        <>
                          {(dispatch.credits.writer || dispatch.credits.photographer) && <span className="text-white/20">·</span>}
                          <span className="flex items-center gap-1.5">
                            <Palette size={13} style={{ color: '#F5A623' }} />
                            Pubmat: <strong className="text-white">{dispatch.credits.pubmat}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Action Links & CTAs */}
                    <div className="flex items-center gap-3">
                      {dispatch.applyUrl && (
                        <a
                          href={dispatch.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-bold px-4 py-2 rounded-lg bg-gold text-[#0D1117] hover:bg-white transition-colors shadow-lg"
                        >
                          <span>Apply via Google Form</span>
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                      <a
                        href={dispatch.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono font-medium px-4 py-2 rounded-lg bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] text-white transition-colors"
                      >
                        <span>Open on Facebook</span>
                        <ArrowUpRight size={14} style={{ color: '#F5A623' }} />
                      </a>
                    </div>
                  </div>

                  {/* Hashtags Footer */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {dispatch.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-mono font-medium hover:text-white transition-colors"
                        style={{ color: 'rgba(245,166,35,0.6)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}
