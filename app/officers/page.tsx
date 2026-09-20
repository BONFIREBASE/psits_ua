import type { Metadata } from 'next'
import Image from 'next/image'
import {
  dean,
  adviser,
  officers as initialOfficers,
  pubmatTeam as initialPubmat,
  Officer,
} from '@/data/officers'
import {
  ShieldCheck,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Palette,
} from 'lucide-react'
import { getOfficers } from '@/lib/supabase'
import ScrollReveal from '@/components/ScrollReveal'

export const metadata: Metadata = {
  title: 'Officers & Leadership Directory | PSITS-UA',
  description:
    'Meet the PSITS-UA Executive Council, CCIS Dean Dr. John C. Amar, BSIT Program Head Carl Spence Percy, and student leaders for Academic Year 2026–2027.',
  keywords: [
    'PSITS Officers',
    'PSITS-UA Leadership Directory',
    'University of Antique IT Officers',
    'College of Computing and Information Sciences Leaders',
    'Student Council Antique',
    // Dean & Adviser
    'Dr. John C. Amar',
    'Carl Spence Percy',
    // Executive Council & Year Representatives
    'Arvin James Balquin',
    'Jared Patrick Evangelio',
    'Kimberly Ann Erispe',
    'Jin Sung Jung',
    'Charyl Naldo',
    'John Vincent Peniero',
    'Johnric Ysulat',
    'Vhonn Gabriel Habulin',
    'Louise Jan Carlo Tabaldo',
    'Bon Jury Pecaoco',
    'Elijah Arevalo',
    'Angel Nicole Albuera',
    'Christine Sumande',
    'Rona Mae Sangcap',
    'Ramel Azar Jr.',
    'Carmelo Dapar II',
    // Pubmat Creative Team
    'Ma. Echel Vicencio',
    'Aizelle Binoy',
    'Blessy Bielle P. Odango',
    'Mark Gelo S. Wieldt',
    'Rheinheart Masuay',
    'Li Joshua Ramos',
    'Jairoh Noe Bachicha Bremon',
    'Dainielle Zyd Samalague',
    'Clarence Morales',
    'Precious Rhyza S. Ricasio',
    'Ellen June Cardinal',
    // Historical Founder
    'Mrs. Nelly E. Mistio',
  ],
  alternates: {
    canonical: '/officers',
  },
}

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

export default async function OfficersPage() {
  const dbOfficers = await getOfficers()

  const pubmatMembers: Officer[] =
    dbOfficers && dbOfficers.length > 0
      ? dbOfficers.filter((o) => o.is_pubmat).map((o) => ({
          name: o.name,
          position: o.pubmat_role || o.position,
          roleGroup: 'Operations & PR' as Officer['roleGroup'],
          department: o.year_section || 'Pubmat Creative Team',
          image: o.image_url || undefined,
        }))
      : initialPubmat.map((p) => ({
          name: p.name,
          position: p.role,
          roleGroup: 'Operations & PR' as Officer['roleGroup'],
          department: 'Pubmat Creative Team',
          image: p.image || undefined,
        }))

  const officersList: Officer[] =
    dbOfficers && dbOfficers.length > 0
      ? dbOfficers.filter((o) => !o.is_pubmat).map((o) => ({
          name: o.name,
          position: o.position,
          roleGroup: o.role_group as Officer['roleGroup'],
          department: o.year_section,
          image: o.image_url || undefined,
        }))
      : initialOfficers

  const executives = officersList.filter((o) => o.roleGroup === 'Executive')
  const secretariat = officersList.filter(
    (o) => o.roleGroup === 'Secretariat & Finance'
  )
  const operations = officersList.filter((o) => o.roleGroup === 'Operations & PR')
  const representatives = officersList.filter(
    (o) => o.roleGroup === 'Year Representatives'
  )

  const leadershipSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PSITS-UA Leadership Directory (AY 2026–2027)',
    description:
      'Executive Council, Faculty Advisers, and Student Leaders of PSITS at the University of Antique College of Computing and Information Sciences.',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Person',
          name: dean.name,
          jobTitle: `${dean.title}, ${dean.college}`,
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: dean.institution,
          },
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Person',
          name: adviser.name,
          jobTitle: adviser.title,
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: adviser.institution,
          },
        },
      },
      ...officersList.map((o, idx) => ({
        '@type': 'ListItem',
        position: idx + 3,
        item: {
          '@type': 'Person',
          name: o.name,
          jobTitle: `${o.position} — PSITS-UA`,
          worksFor: {
            '@type': 'Organization',
            name: 'PSITS-UA',
          },
          affiliation: {
            '@type': 'CollegeOrUniversity',
            name: 'University of Antique',
          },
        },
      })),
      ...pubmatMembers.map((p, idx) => ({
        '@type': 'ListItem',
        position: officersList.length + idx + 3,
        item: {
          '@type': 'Person',
          name: p.name,
          jobTitle: `${p.position} — Creative Pubmat Team`,
          worksFor: {
            '@type': 'Organization',
            name: 'PSITS-UA',
          },
        },
      })),
    ],
  }

  return (
    <div className="pt-32 pb-28 max-w-7xl mx-auto px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leadershipSchema) }}
      />
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

      {/* Faculty Adviser */}
      <section className="mb-16">
        <ScrollReveal>
          <div className="relative overflow-hidden border border-gold/30 dark:border-gold/20 bg-gradient-to-br from-navy/30 dark:from-navy/60 via-surface/90 to-canvas p-8 sm:p-12 md:p-16 rounded-2xl shadow-sm dark:shadow-none">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-gold/10 dark:from-gold/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gold/5 dark:from-gold/3 to-transparent pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <Avatar name={adviser.name} image={adviser.image} size="xl" />

              <div className="text-center md:text-left space-y-3 flex-1 min-w-0">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <GraduationCap size={14} className="text-gold shrink-0" />
                  <span className="font-mono text-[10px] text-gold uppercase tracking-[0.2em] font-bold break-words">
                    Faculty Adviser & Program Head
                  </span>
                </div>
                <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight break-words">
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
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Executive Officers */}
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
              <div className="group relative border border-black/8 dark:border-white/8 hover:border-gold/40 bg-surface p-6 sm:p-8 transition-all duration-500 rounded-xl shadow-sm dark:shadow-none hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_0_48px_rgba(245,166,35,0.06)] h-full">
                <div className="flex items-center gap-5">
                  <Avatar name={officer.name} image={officer.image} size="lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="font-mono text-[11px] text-gold font-bold uppercase tracking-[0.15em] block">
                      {officer.position}
                    </span>
                    <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white leading-tight tracking-tight">
                      {officer.name}
                    </h3>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest block">
                      {officer.department}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Secretariat & Finance */}
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
              <OfficerCard officer={officer} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Operations & Public Relations */}
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
              <OfficerCard officer={officer} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Year Level Representatives */}
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
              <OfficerCard officer={officer} compact />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Pubmat Creative Team */}
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
                <OfficerCard officer={officer} compact />
              </ScrollReveal>
            ))}
          </div>
        </section>
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

function OfficerCard({
  officer,
  compact = false,
}: {
  officer: Officer
  compact?: boolean
}) {
  return (
    <div className="group relative border border-black/8 dark:border-white/6 hover:border-gold/40 dark:hover:border-white/15 bg-surface/80 hover:bg-surface transition-all duration-300 overflow-hidden rounded-lg shadow-sm dark:shadow-none h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className={`relative ${compact ? 'p-4' : 'p-4 sm:p-5'} flex items-center gap-3`}>
        <Avatar
          name={officer.name}
          image={officer.image}
          size={compact ? 'sm' : 'md'}
        />
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[9px] text-gold font-bold uppercase tracking-[0.15em] block mb-0.5 leading-tight break-words">
            {officer.position}
          </span>
          <h4
            className={`font-display font-bold text-slate-900 dark:text-white leading-tight break-words line-clamp-2 ${
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
      </div>
    </div>
  )
}
