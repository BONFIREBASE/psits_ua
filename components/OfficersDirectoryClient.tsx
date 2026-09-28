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
      <section className="mb-16">
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
                  <span className="text-gold font-normal text-base sm:text-lg md:text-xl ml-2 inline-block">
                    {adviser.credentials}
                  </span>
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

      {/* ─── Executive Officers ─── */}
      <section className="mb-20">
        <ScrollReveal>
          <SectionLabel
            icon={<Award size={13} />}
            text="Executive Officers"
            sub="Highest Governing Body"
          />
        </ScrollReveal>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {executives.map((officer, index) => (
            <ScrollReveal key={officer.name} delay={index * 0.07} className="h-full">
              <div
                role="button"
                tabIndex={0}
                onClick={() => openOfficer(officer)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openOfficer(officer)
                  }
                }}
                className="group relative border border-black/8 dark:border-white/8 hover:border-gold/50 dark:hover:border-gold/40 bg-surface p-5 sm:p-7 transition-all duration-300 rounded-xl shadow-sm dark:shadow-none hover:shadow-[0_8px_30px_rgba(245,166,35,0.08)] hover:-translate-y-1 cursor-pointer select-none h-full flex items-center gap-4 sm:gap-5"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 text-lg sm:text-xl relative rounded-full overflow-hidden ring-2 ring-gold/40 ring-offset-2 ring-offset-canvas flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {officer.image ? (
                    <ProgressiveImage src={officer.image} alt={officer.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-gold/70">
                      {getInitials(officer.name)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <span className="font-mono text-[10px] sm:text-[11px] text-gold font-bold uppercase tracking-[0.15em] block">
                    {officer.position}
                  </span>
                  <h3 className="font-display font-black text-lg sm:text-xl md:text-2xl text-slate-900 dark:text-white leading-tight tracking-tight group-hover:text-amber-500 dark:group-hover:text-gold transition-colors">
                    {officer.name}
                  </h3>
                  <span className="font-mono text-[9px] sm:text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest block">
                    {officer.department}
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gold shrink-0">
                  <ArrowUpRight size={15} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Secretariat & Finance ─── */}
      <section className="mb-20">
        <ScrollReveal>
          <SectionLabel
            icon={<ShieldCheck size={13} />}
            text="Secretariat & Finance"
            sub="Records & Fiscal Governance"
          />
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {secretariat.map((officer, index) => (
            <ScrollReveal key={officer.name} delay={(index % 4) * 0.05} className="h-full">
              <InteractiveOfficerCard officer={officer} onOpen={() => openOfficer(officer)} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Operations & Public Relations ─── */}
      <section className="mb-20">
        <ScrollReveal>
          <SectionLabel
            icon={<BookOpen size={13} />}
            text="Operations & Public Relations"
            sub="External Relations & Logistics"
          />
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
          {operations.map((officer, index) => (
            <ScrollReveal key={officer.name} delay={(index % 4) * 0.05} className="h-full">
              <InteractiveOfficerCard officer={officer} onOpen={() => openOfficer(officer)} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Year Level Representatives ─── */}
      <section className="mb-20">
        <ScrollReveal>
          <SectionLabel
            icon={<Users size={13} />}
            text="Year Level Representatives"
            sub="Class Delegates"
          />
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
          {representatives.map((officer, index) => (
            <ScrollReveal key={officer.name} delay={(index % 4) * 0.04} className="h-full">
              <InteractiveOfficerCard officer={officer} compact onOpen={() => openOfficer(officer)} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── Pubmat Creative Team ─── */}
      {pubmatMembers.length > 0 && (
        <section>
          <ScrollReveal>
            <SectionLabel
              icon={<Palette size={13} />}
              text="Pubmat Creative Team"
              sub="Design, Media & Visual Communications"
            />
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {pubmatMembers.map((officer, index) => (
              <ScrollReveal key={officer.name} delay={(index % 5) * 0.04} className="h-full">
                <InteractiveOfficerCard officer={officer} compact onOpen={() => openOfficer(officer)} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* ─── Minimalist Officer Spotlight ID Card ─── */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {selectedOfficer && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
                onClick={closeOfficer}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-xl md:max-w-2xl rounded-2xl overflow-hidden border border-gold/30 dark:border-white/15 bg-[#070A11] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] ring-1 ring-gold/20 my-auto text-left"
                >
                  {/* Top Rim Highlight */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent pointer-events-none z-30" />

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={closeOfficer}
                    className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
                    aria-label="Close officer card"
                  >
                    <X size={15} />
                  </button>

                  <div className="flex flex-col sm:flex-row">
                    {/* 1. Profile Photo */}
                    <div className="relative w-full sm:w-[220px] md:w-[240px] aspect-[4/3] sm:aspect-auto min-h-[220px] sm:min-h-[250px] bg-[#0a0e17] border-b sm:border-b-0 sm:border-r border-white/10 shrink-0 overflow-hidden">
                      {selectedOfficer.image ? (
                        <ProgressiveImage
                          src={selectedOfficer.image}
                          alt={selectedOfficer.name}
                          fill
                          className="object-cover object-top sm:object-center"
                          ambientGlow
                          priority
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-navy/40 via-[#0a0e17] to-black p-4 text-center">
                          <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center font-display font-black text-2xl text-gold shadow-lg">
                            {getInitials(selectedOfficer.name)}
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                            PSITS Officer
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Details: Role Group, Name, Role, Department */}
                    <div className="p-6 sm:p-7 flex flex-col justify-center flex-1 pr-12 sm:pr-14">
                      {/* Role Group */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-mono font-bold uppercase tracking-wider w-fit mb-3">
                        <CheckCircle2 size={11} className="text-gold" />
                        <span>{selectedOfficer.roleGroup}</span>
                      </div>

                      {/* Name */}
                      <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight mb-2">
                        {selectedOfficer.name}
                        {selectedOfficer.credentials && (
                          <span className="text-gold text-base sm:text-lg font-normal ml-2">
                            {selectedOfficer.credentials}
                          </span>
                        )}
                      </h3>

                      {/* Role (Position) */}
                      <span className="font-mono text-xs sm:text-sm text-amber-500 font-bold uppercase tracking-wider block mb-2">
                        {selectedOfficer.position}
                      </span>

                      {/* Department */}
                      <p className="font-mono text-xs text-white/70 leading-relaxed">
                        {selectedOfficer.department}
                        {selectedOfficer.institution ? ` · ${selectedOfficer.institution}` : ' · University of Antique CCIS'}
                      </p>
                    </div>
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
    <div className="flex items-center justify-between mb-5 pb-3 border-b border-black/8 dark:border-white/6">
      <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-[0.12em]">
        {icon}
        <span>{text}</span>
      </div>
      {sub && (
        <span className="font-mono text-[10px] text-slate-400 dark:text-white/25 uppercase tracking-wider">
          {sub}
        </span>
      )}
    </div>
  )
}

function InteractiveOfficerCard({
  officer,
  compact = false,
  onOpen,
}: {
  officer: Officer
  compact?: boolean
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
      className="group relative border border-black/8 dark:border-white/6 hover:border-gold/40 dark:hover:border-gold/40 bg-surface/80 hover:bg-surface transition-all duration-300 overflow-hidden rounded-lg shadow-sm dark:shadow-none hover:shadow-[0_6px_24px_rgba(245,166,35,0.08)] hover:-translate-y-0.5 cursor-pointer select-none h-full flex flex-col justify-between"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className={`relative ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'} flex items-center gap-3`}>
        <div
          className={`${
            compact ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm'
          } relative rounded-full overflow-hidden ring-2 ring-gold/40 ring-offset-2 ring-offset-canvas flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}
        >
          {officer.image ? (
            <ProgressiveImage src={officer.image} alt={officer.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-gold/70">
              {getInitials(officer.name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="font-mono text-[9px] text-gold font-bold uppercase tracking-[0.15em] block mb-0.5 leading-tight break-words">
            {officer.position}
          </span>
          <h4
            className={`font-display font-bold text-slate-900 dark:text-white leading-tight break-words line-clamp-2 group-hover:text-amber-500 dark:group-hover:text-gold transition-colors ${
              compact ? 'text-[13px]' : 'text-sm sm:text-base'
            }`}
          >
            {officer.name}
          </h4>
          {!compact && (
            <span className="font-mono text-[9px] text-slate-500 dark:text-white/30 uppercase tracking-widest block mt-0.5 break-words">
              {officer.department}
            </span>
          )}
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gold shrink-0">
          <ArrowUpRight size={13} />
        </div>
      </div>
    </div>
  )
}
