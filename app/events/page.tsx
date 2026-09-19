'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Search, X } from 'lucide-react'
import { getEvents, supabase } from '@/lib/supabase'
import ScrollReveal from '@/components/ScrollReveal'
import { calendarActivities, type Activity } from '@/data/events'

export interface COAEvent {
  id: string
  title: string
  date: string
  time?: string
  venue: string
  involved: string
  semester: '1st Semester (2026)' | '2nd Semester (2027)'
  category: 'Governance' | 'Competition' | 'Social' | 'Academic' | 'Career'
  status: 'Ongoing' | 'Upcoming' | 'Completed'
  featured?: boolean
}

const categoryConfig = [
  'All',
  'Academic',
  'Competition',
  'Social',
  'Governance',
  'Career',
] as const

type CategoryType = (typeof categoryConfig)[number]
type StatusFilterType = 'All' | 'Ongoing' | 'Upcoming' | 'Completed'

function getEventTimingStatus(
  statusString?: string,
  dateString?: string
): 'Ongoing' | 'Upcoming' | 'Completed' {
  const norm = (statusString || '').toLowerCase().trim()
  if (norm === 'completed' || norm === 'done' || norm === 'past') {
    return 'Completed'
  }
  if (norm === 'ongoing' || norm === 'present' || norm === 'live' || norm === 'in progress') {
    return 'Ongoing'
  }

  if (dateString) {
    const dLower = dateString.toLowerCase()
    if (dLower.includes('august 2026') || dLower.includes('jul') || dLower.includes('aug')) {
      return 'Completed'
    }
    if (dLower.includes('september 2026') || dLower.includes('sept 2026')) {
      return 'Ongoing'
    }
    const parsed = new Date(dateString)
    if (!isNaN(parsed.getTime())) {
      const now = new Date('2026-09-19T00:00:00')
      const diffDays = (parsed.getTime() - now.getTime()) / (1000 * 3600 * 24)
      if (diffDays < -1) return 'Completed'
      if (diffDays >= -1 && diffDays <= 1) return 'Ongoing'
      return 'Upcoming'
    }
  }

  return 'Upcoming'
}

const initialMappedActivities: COAEvent[] = calendarActivities.map((act) => ({
  id: act.id,
  title: act.activity,
  date: act.month,
  venue: act.venue,
  involved: act.involved,
  semester: act.semester,
  category: act.category,
  featured: act.featured,
  status: getEventTimingStatus(undefined, act.month),
}))

export default function COAPage() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterType>('All')
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [activities, setActivities] = useState<COAEvent[]>(initialMappedActivities)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchEvents() {
      try {
        const dbEvents = await getEvents()
        if (isMounted && dbEvents && dbEvents.length > 0) {
          const mapped: COAEvent[] = dbEvents.map((ev) => {
            let involved = 'CCIS IT Students & Officers'
            if (ev.description && ev.description.includes(' · Involved: ')) {
              involved = ev.description.split(' · Involved: ')[1]
            }
            const semester = ev.date.includes('2026')
              ? '1st Semester (2026)'
              : '2nd Semester (2027)'

            return {
              id: ev.id,
              title: ev.title,
              date: ev.date,
              time: ev.time,
              venue: ev.location,
              involved,
              semester,
              category: (categoryConfig.includes(ev.category as CategoryType)
                ? ev.category
                : 'Academic') as Activity['category'],
              featured: ev.status === 'Completed' || ev.category === 'Competition',
              status: getEventTimingStatus(ev.status, ev.date),
            }
          })
          setActivities(mapped)
        }
      } catch (err) {
        console.warn('Error fetching live events:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchEvents()

    const channel = supabase
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [])

  // Dynamic counts
  const ongoingCount = activities.filter((a) => a.status === 'Ongoing').length
  const upcomingCount = activities.filter((a) => a.status === 'Upcoming').length
  const completedCount = activities.filter((a) => a.status === 'Completed').length

  // Filtered collection
  const filtered = activities.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All' || item.category === selectedCategory
    const matchesStatus =
      selectedStatus === 'All' || item.status === selectedStatus
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      query === '' ||
      item.title.toLowerCase().includes(query) ||
      item.venue.toLowerCase().includes(query) ||
      item.involved.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query)

    return matchesCategory && matchesStatus && matchesSearch
  })

  const isSegmentedView = selectedStatus === 'All' && searchQuery === '' && selectedCategory === 'All'
  const activeEvents = filtered.filter((a) => a.status === 'Ongoing')
  const upcomingEvents = filtered.filter((a) => a.status === 'Upcoming')
  const completedEvents = filtered.filter((a) => a.status === 'Completed')

  return (
    <div className="pt-32 pb-28 max-w-5xl xl:max-w-6xl 2xl:max-w-[1300px] mx-auto px-6 space-y-12">
      {/* Minimalist Editorial Header */}
      <ScrollReveal>
        <header className="space-y-3 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-gold uppercase tracking-[0.2em] font-semibold">
              Academic Year 2026–2027 · Calendar of Activities
            </span>
            {isLoading && <RefreshCw size={12} className="animate-spin text-gold/60" />}
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight uppercase">
            Activities <span className="text-gold">&</span> Schedule
          </h1>
          <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
            Codified timetable of student assemblies, hackathons, and governance sessions.
          </p>
        </header>
      </ScrollReveal>

      {/* Restrained Minimalist Navigation & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          {/* Subtle Underline Status Tabs */}
          <nav className="flex items-center gap-6 text-xs font-mono tracking-wider uppercase overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedStatus('All')}
              className={`transition-colors cursor-pointer relative pb-1 ${
                selectedStatus === 'All'
                  ? 'text-slate-900 dark:text-white font-bold border-b-2 border-gold'
                  : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'
              }`}
            >
              All ({activities.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('Ongoing')}
              className={`transition-colors cursor-pointer relative pb-1 flex items-center gap-1.5 ${
                selectedStatus === 'Ongoing'
                  ? 'text-slate-900 dark:text-white font-bold border-b-2 border-gold'
                  : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              Active ({ongoingCount})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('Upcoming')}
              className={`transition-colors cursor-pointer relative pb-1 ${
                selectedStatus === 'Upcoming'
                  ? 'text-slate-900 dark:text-white font-bold border-b-2 border-gold'
                  : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('Completed')}
              className={`transition-colors cursor-pointer relative pb-1 ${
                selectedStatus === 'Completed'
                  ? 'text-slate-900 dark:text-white font-bold border-b-2 border-gold'
                  : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'
              }`}
            >
              Concluded ({completedCount})
            </button>
          </nav>

          {/* Minimalist Search Input */}
          <div className="relative w-full sm:w-64">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schedule..."
              className="w-full bg-transparent border border-black/[0.08] dark:border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Category Text Links */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono tracking-wider uppercase text-slate-400 dark:text-white/40">
          <span className="text-slate-400 dark:text-white/20">Category:</span>
          {categoryConfig.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`transition-colors cursor-pointer ${
                  isActive
                    ? 'text-gold font-bold underline underline-offset-4 decoration-gold/50'
                    : 'hover:text-slate-700 dark:hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Layout */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-black/10 dark:border-white/10 rounded-xl space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 dark:text-white/40">
            No matching activities found
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('All')
              setSelectedCategory('All')
              setSearchQuery('')
            }}
            className="text-xs font-mono text-gold hover:underline underline-offset-4 uppercase tracking-wider cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : isSegmentedView ? (
        /* ── Chronological Master Stream ── */
        <div className="space-y-14">
          {/* Active Section */}
          {activeEvents.length > 0 && (
            <section className="space-y-5">
              <ScrollReveal>
                <div className="flex items-baseline justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-gold font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    Active This Month · September 2026
                  </h2>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-white/30 uppercase">
                    {activeEvents.length} items
                  </span>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {activeEvents.map((act, index) => (
                  <ScrollReveal key={act.id} delay={(index % 3) * 0.05} className="h-full">
                    <ActivityCard item={act} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Section */}
          {upcomingEvents.length > 0 && (
            <section className="space-y-5">
              <ScrollReveal>
                <div className="flex items-baseline justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-white font-bold">
                    Upcoming Milestones (2026–2027)
                  </h2>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-white/30 uppercase">
                    {upcomingEvents.length} items
                  </span>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {upcomingEvents.map((act, index) => (
                  <ScrollReveal key={act.id} delay={(index % 3) * 0.05} className="h-full">
                    <ActivityCard item={act} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}

          {/* Concluded Archive */}
          {completedEvents.length > 0 && (
            <section className="space-y-5">
              <ScrollReveal>
                <div className="flex items-baseline justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 font-bold">
                    Concluded Archive
                  </h2>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-white/30 uppercase">
                    {completedEvents.length} items
                  </span>
                </div>
              </ScrollReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {completedEvents.map((act, index) => (
                  <ScrollReveal key={act.id} delay={(index % 3) * 0.05} className="h-full">
                    <ActivityCard item={act} />
                  </ScrollReveal>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* ── Filtered Single Grid ── */
        <div className="space-y-5">
          <div className="flex items-baseline justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-slate-400 dark:text-white/40">
            <span>
              Showing {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
              {selectedStatus !== 'All' ? ` · ${selectedStatus}` : ''}
              {selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((act, index) => (
              <ScrollReveal key={act.id} delay={(index % 3) * 0.05} className="h-full">
                <ActivityCard item={act} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ActivityCard({ item }: { item: COAEvent }) {
  const isOngoing = item.status === 'Ongoing'
  const isCompleted = item.status === 'Completed'

  return (
    <div
      className={`group relative border rounded-xl p-5 sm:p-6 transition-colors duration-200 flex flex-col justify-between h-full ${
        isOngoing
          ? 'bg-white dark:bg-[#0B0F17] border-gold/40 shadow-xs'
          : isCompleted
          ? 'bg-slate-50/50 dark:bg-[#090D14]/60 border-black/[0.04] dark:border-white/[0.05] opacity-75 hover:opacity-100'
          : 'bg-white dark:bg-[#0B0F17] border-black/[0.06] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
      }`}
    >
      <div className="space-y-3">
        {/* Date & Minimal Status Indicator */}
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
          <span className="text-gold font-semibold uppercase">{item.date}</span>

          {isOngoing && (
            <span className="text-gold font-semibold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
              Active
            </span>
          )}
          {isCompleted && (
            <span className="text-slate-400 dark:text-white/30 text-[10px] uppercase tracking-widest">
              Concluded
            </span>
          )}
          {!isOngoing && !isCompleted && (
            <span className="text-slate-400 dark:text-white/35 text-[10px] uppercase tracking-widest">
              {item.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug tracking-tight group-hover:text-gold transition-colors">
          {item.title}
        </h3>
      </div>

      {/* Meta Line */}
      <div className="pt-4 mt-4 border-t border-black/[0.04] dark:border-white/[0.06] text-xs font-mono text-slate-500 dark:text-white/45 flex items-center justify-between gap-3">
        <div className="truncate">
          <span className="text-slate-700 dark:text-white/70">{item.venue}</span>{' '}
          <span className="text-slate-300 dark:text-white/20">·</span> {item.involved}
        </div>
        <span className="shrink-0 text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider">
          {item.semester === '1st Semester (2026)' ? '1st Sem' : '2nd Sem'}
        </span>
      </div>
    </div>
  )
}
