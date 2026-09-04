'use client'

import { useState } from 'react'
import { calendarActivities, Activity } from '@/data/events'
import {
  MapPin,
  Users,
  Calendar,
  CalendarDays,
  LayoutGrid,
  GraduationCap,
  Trophy,
  PartyPopper,
  Landmark,
  Briefcase,
} from 'lucide-react'

const categoryConfig = [
  { label: 'All', icon: LayoutGrid },
  { label: 'Academic', icon: GraduationCap },
  { label: 'Competition', icon: Trophy },
  { label: 'Social', icon: PartyPopper },
  { label: 'Governance', icon: Landmark },
  { label: 'Career', icon: Briefcase },
] as const

type CategoryType = (typeof categoryConfig)[number]['label']

export default function COAPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All')

  const filtered = calendarActivities.filter((item) => {
    if (selectedCategory === 'All') return true
    return item.category === selectedCategory
  })

  const term1Activities = filtered.filter(
    (a) => a.semester === '1st Semester (2026)'
  )
  const term2Activities = filtered.filter(
    (a) => a.semester === '2nd Semester (2027)'
  )

  return (
    <div className="pt-32 pb-28 max-w-6xl mx-auto px-6 space-y-14">
      <header className="space-y-4 border-b border-white/10 pb-10">
        <p className="font-mono text-xs text-gold tracking-widest uppercase">
          01 / Academic Year 2026–2027 · COA
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase leading-[1.08]">
          Calendar of <span className="text-gold">Activities</span>
        </h1>
        <p className="text-white/80 text-base max-w-2xl font-normal leading-relaxed">
          The codified schedule of assemblies, technical hackathons, bootcamps,
          and governance sessions for the University of Antique PSITS Chapter.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {categoryConfig.map(({ label, icon: Icon }) => {
          const isActive = selectedCategory === label
          return (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedCategory(label)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                isActive
                  ? 'border-gold bg-gold/10 text-gold font-semibold'
                  : 'border-white/10 text-white/70 hover:text-white hover:border-white/30'
              }`}
            >
              <Icon size={13} className={isActive ? 'text-gold' : 'text-white/50'} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={15} className="text-gold" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-white font-bold">
                1st Semester (2026)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
              {term1Activities.length} {term1Activities.length === 1 ? 'Activity' : 'Activities'}
            </span>
          </div>

          <div className="space-y-3">
            {term1Activities.length === 0 ? (
              <div className="py-12 text-center border border-white/5 text-white/40 font-mono text-xs uppercase tracking-wider">
                No scheduled activities
              </div>
            ) : (
              term1Activities.map((act) => (
                <ActivityCell key={act.id} item={act} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <CalendarDays size={15} className="text-gold" />
              <h2 className="font-mono text-xs uppercase tracking-widest text-white font-bold">
                2nd Semester (2027)
              </h2>
            </div>
            <span className="font-mono text-[11px] text-white/50 uppercase tracking-wider">
              {term2Activities.length} {term2Activities.length === 1 ? 'Activity' : 'Activities'}
            </span>
          </div>

          <div className="space-y-3">
            {term2Activities.length === 0 ? (
              <div className="py-12 text-center border border-white/5 text-white/40 font-mono text-xs uppercase tracking-wider">
                No scheduled activities
              </div>
            ) : (
              term2Activities.map((act) => (
                <ActivityCell key={act.id} item={act} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityCell({ item }: { item: Activity }) {
  const CategoryIcon = {
    Academic: GraduationCap,
    Competition: Trophy,
    Social: PartyPopper,
    Governance: Landmark,
    Career: Briefcase,
  }[item.category]

  return (
    <div
      className={`border p-5 transition-colors bg-surface/50 hover:bg-surface space-y-3 ${
        item.featured
          ? 'border-gold/50 border-l-2 border-l-gold'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-gold font-bold uppercase tracking-wider">
          <Calendar size={12} className="text-gold/80" />
          <span>{item.month}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-white/70 uppercase tracking-widest border border-white/10 px-2 py-0.5">
          <CategoryIcon size={11} className="text-white/60" />
          <span>{item.category}</span>
        </span>
      </div>

      <h3 className="font-display font-bold text-white text-base sm:text-lg leading-snug">
        {item.activity}
      </h3>

      <div className="pt-2 border-t border-white/5 grid sm:grid-cols-2 gap-2 text-xs text-white/80 font-mono">
        <div className="flex items-center gap-1.5 truncate">
          <Users size={12} className="text-gold/80 shrink-0" />
          <span className="truncate">{item.involved}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={12} className="text-gold/80 shrink-0" />
          <span className="truncate">{item.venue}</span>
        </div>
      </div>
    </div>
  )
}
