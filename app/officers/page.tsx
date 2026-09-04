import Image from 'next/image'
import {
  adviser,
  officers,
  Officer,
  pubmatTeam,
  PubmatMember,
} from '@/data/officers'
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Palette,
  PenLine,
  Camera,
} from 'lucide-react'

export const metadata = {
  title: 'Officers & Administration | PSITS-UA',
  description:
    'Official directory of PSITS-UA Executive Officers and Faculty Adviser for Academic Year 2026–2027.',
}

/* ── Helpers ── */
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

function Avatar({
  name,
  image,
  size = 'md',
}: {
  name: string
  image?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const styles = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 text-3xl',
  }

  if (image) {
    return (
      <div
        className={`${styles[size]} relative rounded-full overflow-hidden ring-2 ring-gold/40 ring-offset-2 ring-offset-canvas flex-shrink-0`}
      >
        <Image src={image} alt={name} fill className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`${styles[size]} rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-gold/60 flex-shrink-0 transition-all duration-300 group-hover:border-gold/40 group-hover:text-gold/90 group-hover:shadow-[0_0_24px_rgba(245,166,35,0.1)]`}
    >
      {getInitials(name)}
    </div>
  )
}

/* ── Main Page ── */
export default function OfficersPage() {
  const executives = officers.filter((o) => o.roleGroup === 'Executive')
  const secretariat = officers.filter(
    (o) => o.roleGroup === 'Secretariat & Finance'
  )
  const operations = officers.filter((o) => o.roleGroup === 'Operations & PR')
  const representatives = officers.filter(
    (o) => o.roleGroup === 'Year Representatives'
  )

  const writers = pubmatTeam.filter((m) => m.role === 'Writer')
  const designers = pubmatTeam.filter((m) => m.role === 'Graphic Designer')
  const photographers = pubmatTeam.filter(
    (m) =>
      m.role === 'Photographer' ||
      m.role === 'Photographer / Videographer / Editor'
  )

  return (
    <div className="pt-32 pb-28 max-w-7xl mx-auto px-6">
      {/* ━━━ Header ━━━ */}
      <header className="space-y-4 pb-16 text-center">
        <p className="font-mono text-xs sm:text-sm text-gold font-bold tracking-widest uppercase">
          Leadership Directory · A.Y. 2026–2027
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight uppercase leading-[1.05]">
          The People Behind{' '}
          <span className="text-gold">PSITS-UA</span>
        </h1>
        <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Meet the executive council, committee heads, faculty leadership, and
          the creative team powering our organization.
        </p>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ADVISER — Cinematic Banner
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mb-16">
        <div className="relative overflow-hidden border border-gold/20 bg-gradient-to-br from-navy/60 via-surface/80 to-canvas p-8 sm:p-12 md:p-16">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold/5 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold/3 to-transparent pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <Avatar name={adviser.name} image={adviser.image} size="xl" />

            <div className="text-center md:text-left space-y-3 flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <GraduationCap size={14} className="text-gold" />
                <span className="font-mono text-[10px] text-gold uppercase tracking-[0.2em] font-bold">
                  Faculty Adviser & Program Head
                </span>
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.1]">
                {adviser.name}
                <span className="text-gold font-mono text-2xl sm:text-3xl font-bold ml-2">
                  , {adviser.credentials}
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center md:items-start gap-1 sm:gap-4 font-mono text-xs text-white/50">
                <span>{adviser.title}</span>
                <span className="hidden sm:inline text-gold/30">·</span>
                <span>{adviser.department}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          EXECUTIVE — Two Large Feature Cards
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mb-16">
        <SectionLabel icon={<Award size={13} />} text="Executive Leadership" />

        <div className="grid md:grid-cols-2 gap-4 sm:gap-5">
          {executives.map((officer, i) => (
            <div
              key={officer.name}
              className="group relative border border-white/8 hover:border-gold/30 bg-gradient-to-br from-surface/90 to-canvas p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_0_48px_rgba(245,166,35,0.06)]"
            >
              {/* Rank indicator */}
              <div className="absolute top-4 right-4 font-mono text-[10px] text-white/15 font-bold">
                0{i + 1}
              </div>

              <div className="flex items-center gap-5">
                <Avatar name={officer.name} image={officer.image} size="lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="font-mono text-[11px] text-gold font-bold uppercase tracking-[0.15em] block">
                    {officer.position}
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight tracking-tight">
                    {officer.name}
                  </h3>
                  <span className="font-mono text-[10px] text-white/35 uppercase tracking-widest block">
                    {officer.department}
                  </span>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BENTO — Secretariat & Finance
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mb-16">
        <SectionLabel
          icon={<ShieldCheck size={13} />}
          text="Secretariat, Treasury & Audit"
          sub="Administration"
        />

        {/* Paired layout: Secretary pair | Treasurer pair | Auditor pair */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {secretariat.map((officer) => (
            <OfficerCard key={officer.name} officer={officer} />
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BENTO — Operations & PR
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mb-16">
        <SectionLabel
          icon={<BookOpen size={13} />}
          text="Public Relations & Business Operations"
          sub="Operations"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {operations.map((officer) => (
            <OfficerCard key={officer.name} officer={officer} />
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          YEAR REPS — Compact Row
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="mb-20">
        <SectionLabel
          icon={<Users size={13} />}
          text="Year Level Representatives"
          sub="Class Delegates"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {representatives.map((officer) => (
            <OfficerCard key={officer.name} officer={officer} compact />
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PUBMAT — Creative Team
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section>
        {/* PUBMAT Header — Minimalist Masthead */}
        <div className="text-center mb-6 space-y-3">
          <div className="flex items-center justify-center gap-3 font-mono text-xs text-gold uppercase tracking-[0.2em]">
            <span className="w-8 h-px bg-gold/30" />
            <Palette size={14} className="text-gold" />
            <span>Publications & Multimedia Team</span>
            <span className="w-8 h-px bg-gold/30" />
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase">
            Stories, Pixels <span className="text-gold">&</span> Presence
          </h2>
          <p className="text-white/45 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            The writers, designers, photographers, videographers, and editors defining how PSITS-UA is seen and remembered.
          </p>

          {/* Gold accent line directly connecting to Team Leads below */}
          <div className="pt-4 flex justify-center">
            <div className="w-px h-12 bg-gradient-to-b from-gold/50 via-gold/25 to-white/10" />
          </div>
        </div>

        {/* PUBMAT Leads — Featured */}
        <div className="mb-8">
          <SectionLabel icon={<Award size={13} />} text="Team Leads" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {pubmatTeam
              .filter((m) => m.isLead)
              .map((member) => (
                <div
                  key={member.name}
                  className="group relative border border-white/8 hover:border-gold/30 bg-gradient-to-br from-surface/90 to-canvas p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_0_48px_rgba(245,166,35,0.06)]"
                >
                  <div className="flex items-center gap-5">
                    <Avatar name={member.name} image={member.image} size="lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <span className="font-mono text-[11px] text-gold font-bold uppercase tracking-[0.15em] block">
                        Lead {member.role}
                      </span>
                      <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-tight tracking-tight">
                        {member.name}
                      </h3>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ))}
          </div>
        </div>

        {/* Writers */}
        {writers.filter((m) => !m.isLead).length > 0 && (
          <div className="mb-8">
            <SectionLabel icon={<PenLine size={13} />} text="Writers" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {writers
                .filter((m) => !m.isLead)
                .map((member) => (
                  <PubmatCard key={member.name} member={member} />
                ))}
            </div>
          </div>
        )}

        {/* Graphic Designers */}
        {designers.filter((m) => !m.isLead).length > 0 && (
          <div className="mb-8">
            <SectionLabel icon={<Palette size={13} />} text="Graphic Designers" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {designers
                .filter((m) => !m.isLead)
                .map((member) => (
                  <PubmatCard key={member.name} member={member} />
                ))}
            </div>
          </div>
        )}

        {/* Photographers / Videographers / Editors */}
        {photographers.filter((m) => !m.isLead).length > 0 && (
          <div>
            <SectionLabel
              icon={<Camera size={13} />}
              text="Photographers / Videographers / Editors"
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {photographers
                .filter((m) => !m.isLead)
                .map((member) => (
                  <PubmatCard key={member.name} member={member} />
                ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Section Label
   ───────────────────────────────────────────── */
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
    <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/6">
      <div className="flex items-center gap-2 font-mono text-xs text-gold uppercase tracking-[0.12em]">
        {icon}
        <span>{text}</span>
      </div>
      {sub && (
        <span className="font-mono text-[10px] text-white/25 uppercase tracking-wider">
          {sub}
        </span>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Officer Card
   ───────────────────────────────────────────── */
function OfficerCard({
  officer,
  compact = false,
}: {
  officer: Officer
  compact?: boolean
}) {
  return (
    <div className="group relative border border-white/6 hover:border-white/15 bg-surface/40 hover:bg-surface/70 transition-all duration-300 overflow-hidden">
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className={`relative ${compact ? 'p-4' : 'p-4 sm:p-5'} flex items-center gap-3`}>
        <Avatar
          name={officer.name}
          image={officer.image}
          size={compact ? 'sm' : 'md'}
        />
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[9px] text-gold/80 font-bold uppercase tracking-[0.15em] block mb-0.5 leading-tight">
            {officer.position}
          </span>
          <h4
            className={`font-display font-bold text-white leading-tight truncate ${
              compact ? 'text-[13px]' : 'text-sm sm:text-base'
            }`}
          >
            {officer.name}
          </h4>
          {!compact && (
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest block mt-0.5">
              {officer.department}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   PUBMAT Card
   ───────────────────────────────────────────── */
function PubmatCard({
  member,
  compact = false,
}: {
  member: PubmatMember
  compact?: boolean
}) {
  return (
    <div className="group relative border border-white/6 hover:border-white/15 bg-surface/40 hover:bg-surface/70 transition-all duration-300 overflow-hidden">
      {/* Hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div
        className={`relative ${
          compact ? 'p-4' : 'p-4 sm:p-5'
        } flex items-center gap-3`}
      >
        <Avatar
          name={member.name}
          image={member.image}
          size={compact ? 'sm' : 'md'}
        />
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[9px] text-gold/80 font-bold uppercase tracking-[0.15em] block mb-0.5 leading-tight">
            {member.role}
          </span>
          <h4
            className={`font-display font-bold text-white leading-tight truncate ${
              compact ? 'text-[13px]' : 'text-sm sm:text-base'
            }`}
          >
            {member.name}
          </h4>
          <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest block mt-0.5">
            PUBMAT Team
          </span>
        </div>
      </div>
    </div>
  )
}

