'use client'

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Palette,
  X,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import ProgressiveImage from '@/components/ProgressiveImage'
import ScrollReveal from '@/components/ScrollReveal'
import type { Adviser, Officer } from '@/data/officers'

export interface OfficerProfile {
  name: string
  position: string
  roleGroup: string
  department: string
  image?: string
  quote?: string
  credentials?: string
  institution?: string
  isFaculty?: boolean
}

interface OfficersDirectoryClientProps {
  adviser: Adviser
  executives: Officer[]
  secretariat: Officer[]
  operations: Officer[]
  representatives: Officer[]
  pubmatMembers: Officer[]
}

const emptySubscribe = () => () => {}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((w) => !['Jr.', 'II', 'III', 'IV'].includes(w))
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function OfficersDirectoryClient({
  adviser,
  executives,
  secretariat,
  operations,
  representatives,
  pubmatMembers,
}: OfficersDirectoryClientProps) {
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerProfile | null>(null)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const openOfficer = useCallback((profile: OfficerProfile) => {
    setSelectedOfficer(profile)
  }, [])

  const closeOfficer = useCallback(() => {
    setSelectedOfficer(null)
  }, [])

  // Lock body scroll when modal is active
  useEffect(() => {
    if (selectedOfficer) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedOfficer])

  // Dismiss on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOfficer()
    }
    if (selectedOfficer) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedOfficer, closeOfficer])

  return (
    <div className="pt-32 pb-28 max-w-7xl mx-auto px-6">
      <ScrollReveal>
        <header className="space-y-4 pb-16 text-center">
          <p className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
            Leadership Directory · A.Y. 2026–2027
          </p>
          <h1 className="font-display font-black text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 dark:text-white tracking-tight uppercase leading-[1.05] break-words">
            The People Behind{' '}
            <span className="text-gold">PSITS-UA</span>
          </h1>
          <p className="text-slate-600 dark:text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed break-words">
            Meet the executive council, committee heads, and faculty leadership
            guiding our organization.
          </p>
        </header>
      </ScrollReveal>

      {/* ─── Faculty Adviser Card ─── */}
      <section className="mb-20">
        <ScrollReveal>
          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              openOfficer({
                name: adviser.name,
                position: adviser.title,
                roleGroup: 'Faculty Leadership',
                department: adviser.department,
                institution: adviser.institution,
                credentials: adviser.credentials,
                image: adviser.image,
                isFaculty: true,
                quote:
                  'Guiding the next generation of IT leaders with technical excellence, integrity, and visionary community impact.',
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openOfficer({
                  name: adviser.name,
                  position: adviser.title,
                  roleGroup: 'Faculty Leadership',
                  department: adviser.department,
                  institution: adviser.institution,
                  credentials: adviser.credentials,
                  image: adviser.image,
                  isFaculty: true,
                  quote:
                    'Guiding the next generation of IT leaders with technical excellence, integrity, and visionary community impact.',
                })
              }
            }}
            className="group relative overflow-hidden border border-gold/30 hover:border-gold/60 dark:border-gold/20 dark:hover:border-gold/50 bg-gradient-to-br from-navy/30 dark:from-navy/60 via-surface/90 to-canvas p-6 sm:p-10 md:p-14 rounded-2xl shadow-sm hover:shadow-[0_12px_40px_rgba(245,166,35,0.12)] transition-all duration-300 cursor-pointer select-none"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold/10 dark:from-gold/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold/5 dark:from-gold/3 to-transparent pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-12">
              <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 text-2xl sm:text-3xl relative rounded-full overflow-hidden ring-2 ring-gold/40 ring-offset-2 ring-offset-canvas flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                {adviser.image ? (
                  <ProgressiveImage src={adviser.image} alt={adviser.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-gold/80">
                    {getInitials(adviser.name)}
                  </div>
                )}
              </div>

              <div className="text-center md:text-left space-y-2.5 flex-1 min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <GraduationCap size={14} className="text-gold shrink-0" />
                  <span className="font-mono text-[10px] text-gold uppercase tracking-[0.2em] font-bold break-words">
                    Faculty Adviser & Program Head
                  </span>
                </div>
                <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight break-words group-hover:text-amber-500 dark:group-hover:text-gold transition-colors">
                  {adviser.name}
                  {adviser.credentials && (
                    <span className="text-gold font-normal text-base sm:text-lg md:text-xl ml-2 inline-block">
                      {adviser.credentials}
                    </span>
                  )}
                </h2>
                <p className="text-slate-700 dark:text-white/80 font-medium text-sm sm:text-base">
                  {adviser.title}
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-white/40">
                  {adviser.department} · {adviser.institution}
                </p>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gold shrink-0 hidden md:block">
                <ArrowUpRight size={18} />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Executive Officers (Static 2-Column Grid) ─── */}
      <OfficerGroupSection
        icon={<Award size={13} />}
        text="Executive Officers"
        sub="Highest Governing Body"
        officers={executives}
        onOpen={openOfficer}
        isCarousel={false}
      />

      {/* ─── Secretariat & Finance (Moving Carousel) ─── */}
      <OfficerGroupSection
        icon={<ShieldCheck size={13} />}
        text="Secretariat & Finance"
        sub="Records & Fiscal Governance"
        officers={secretariat}
        onOpen={openOfficer}
        isCarousel={true}
      />

      {/* ─── Operations & Public Relations (Moving Carousel) ─── */}
      <OfficerGroupSection
        icon={<BookOpen size={13} />}
        text="Operations & Public Relations"
        sub="External Relations & Logistics"
        officers={operations}
        onOpen={openOfficer}
        isCarousel={true}
      />

      {/* ─── Year Level Representatives (Moving Carousel) ─── */}
      <OfficerGroupSection
        icon={<Users size={13} />}
        text="Year Level Representatives"
        sub="Class Delegates"
        officers={representatives}
        onOpen={openOfficer}
        isCarousel={true}
      />

      {/* ─── Pubmat Creative Team (Moving Carousel) ─── */}
      <OfficerGroupSection
        icon={<Palette size={13} />}
        text="Pubmat Creative Team"
        sub="Design, Media & Visual Communications"
        officers={pubmatMembers}
        onOpen={openOfficer}
        isCarousel={true}
      />

      {/* ─── Minimalist Theme-Aware Officer Spotlight Modal ─── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {selectedOfficer && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 dark:bg-black/75 backdrop-blur-md"
                onClick={closeOfficer}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 16 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden border border-card-border bg-surface text-text shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 text-center my-auto"
                >
                  {/* Subtle Top Gold Hairline */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent pointer-events-none" />

                  {/* Theme-Aware Close Button */}
                  <button
                    type="button"
                    onClick={closeOfficer}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 border border-card-border text-muted hover:text-text transition-all cursor-pointer"
                    aria-label="Close preview"
                  >
                    <X size={15} />
                  </button>

                  {/* Avatar Container */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-gold/25 ring-offset-4 ring-offset-surface mx-auto my-3 shadow-lg shrink-0">
                    {selectedOfficer.image ? (
                      <ProgressiveImage
                        src={selectedOfficer.image}
                        alt={selectedOfficer.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/20 flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-gold">
                        {getInitials(selectedOfficer.name)}
                      </div>
                    )}
                  </div>

                  {/* Role Group Pill Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 dark:bg-gold/15 border border-gold/30 text-gold text-[10px] font-mono font-bold uppercase tracking-wider mx-auto mt-2 mb-3">
                    <CheckCircle2 size={11} className="text-gold shrink-0" />
                    <span>{selectedOfficer.roleGroup}</span>
                  </div>

                  {/* Name */}
                  <h3 className="font-display font-black text-xl sm:text-2xl text-text tracking-tight leading-tight">
                    {selectedOfficer.name}
                    {selectedOfficer.credentials && (
                      <span className="text-gold text-sm sm:text-base font-normal ml-1.5 inline-block">
                        {selectedOfficer.credentials}
                      </span>
                    )}
                  </h3>

                  {/* Position */}
                  <p className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-gold mt-1 mb-2">
                    {selectedOfficer.position}
                  </p>

                  {/* Department & Institution */}
                  <p className="font-mono text-xs text-muted leading-relaxed max-w-xs mx-auto">
                    {selectedOfficer.department} · {selectedOfficer.institution || 'University of Antique CCIS'}
                  </p>

                  {/* Minimalist Status / Footer */}
                  <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-center text-[11px] font-mono text-muted tracking-widest uppercase">
                    PSITS OFFICER · 2024–2025
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}

function SectionLabel({
  icon,
  text,
  sub,
}: {
  icon: React.ReactNode
  text: string
  sub?: string
}) {
  return (
    <div className="flex items-center justify-between mb-6 pb-3 border-b border-black/8 dark:border-white/6">
      <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-[0.12em]">
        {icon}
        <span>{text}</span>
      </div>
      {sub && (
        <span className="font-mono text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider">
          {sub}
        </span>
      )}
    </div>
  )
}

function OfficerGroupSection({
  icon,
  text,
  sub,
  officers,
  onOpen,
  isCarousel = true,
}: {
  icon: React.ReactNode
  text: string
  sub?: string
  officers: Officer[]
  onOpen: (officer: Officer) => void
  isCarousel?: boolean
}) {
  if (!officers || officers.length === 0) return null

  return (
    <section className="mb-20">
      <ScrollReveal>
        <SectionLabel icon={icon} text={text} sub={sub} />
      </ScrollReveal>

      {isCarousel ? (
        <OfficerCarousel officers={officers} onOpen={onOpen} />
      ) : (
        <div className="flex flex-wrap justify-center gap-6 max-w-2xl mx-auto">
          {officers.map((officer, index) => (
            <ScrollReveal
              key={`${officer.position}-${officer.name}-${index}`}
              delay={(index % 4) * 0.05}
              className="w-full sm:w-[280px] md:w-[300px]"
            >
              <OfficerCard
                officer={officer}
                onOpen={() => onOpen(officer)}
              />
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  )
}

function OfficerCarousel({
  officers,
  onOpen,
}: {
  officers: Officer[]
  onOpen: (officer: Officer) => void
}) {
  // If fewer than 5 members, duplicate base so the seamless loop spans beyond wide monitors
  const base = officers.length <= 4 ? [...officers, ...officers] : officers
  // Triplicate the array for seamless infinite looping with calc(-100% / 3)
  const loopedOfficers = [...base, ...base, ...base]

  return (
    <div className="relative w-full overflow-hidden py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* Edge gradient masks matching canvas */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-24 z-10 bg-gradient-to-r from-canvas via-canvas/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-24 z-10 bg-gradient-to-l from-canvas via-canvas/80 to-transparent" />

      {/* Marquee Track */}
      <div className="animate-scroll-carousel gap-4 sm:gap-6 py-2 select-none">
        {loopedOfficers.map((officer, index) => (
          <div
            key={`${officer.position}-${officer.name}-${index}`}
            className="w-[270px] sm:w-[300px] shrink-0"
          >
            <OfficerCard officer={officer} onOpen={() => onOpen(officer)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function OfficerCard({
  officer,
  onOpen,
}: {
  officer: Officer
  onOpen: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="group relative border border-black/8 dark:border-white/8 hover:border-gold/50 dark:hover:border-gold/40 bg-surface/90 hover:bg-surface p-6 transition-all duration-300 rounded-2xl shadow-sm dark:shadow-none hover:shadow-[0_12px_36px_rgba(245,166,35,0.12)] hover:-translate-y-1.5 cursor-pointer select-none text-center flex flex-col items-center justify-between min-h-[310px] h-[315px] w-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

      {/* Role Pill Badge */}
      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gold/10 dark:bg-gold/15 border border-gold/30 text-gold text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
        {officer.position}
      </span>

      {/* Avatar Container */}
      <div className="w-24 h-24 relative rounded-full overflow-hidden ring-2 ring-gold/40 ring-offset-2 ring-offset-canvas shrink-0 group-hover:scale-105 transition-transform duration-300 my-2 shadow-md">
        {officer.image ? (
          <ProgressiveImage src={officer.image} alt={officer.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-black text-xl text-gold/80">
            {getInitials(officer.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 w-full px-1">
        <h4 className="font-display font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-amber-500 dark:group-hover:text-gold transition-colors break-words">
          {officer.name}
        </h4>
        <span className="font-mono text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest block">
          {officer.department}
        </span>
      </div>

      {/* Top right arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gold">
        <ArrowUpRight size={14} />
      </div>

      {/* Bottom accent glow */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  )
}
