'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  FileEdit,
  Users,
  Code2,
  Landmark,
  Plus,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Megaphone,
  ClipboardList,
  Sparkles,
  BookOpen,
  Award,
  CheckCircle2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../_context/auth-context'
import { calendarActivities } from '@/data/events'
import { socialDispatches } from '@/data/announcements'
import { projectsData } from '@/data/projects'
import { officers, pubmatTeam, dean, adviser } from '@/data/officers'

const emptySubscribe = () => () => {}

function subscribeClock(callback: () => void) {
  const timer = setInterval(callback, 1000)
  return () => clearInterval(timer)
}

function getClockSnapshot() {
  const now = new Date()
  return `${now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} · ${now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })}`
}

function getServerClockSnapshot() {
  return ''
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const currentTimeStr = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot
  )

  const greeting = isClient
    ? (() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
      })()
    : 'Welcome back'

  const isAdmin = user?.role === 'admin'
  const isOfficer = user?.role === 'officer'

  // Staffing counts
  const totalStaffCount = officers.length + pubmatTeam.length
  const executiveCount = officers.filter((o) => o.roleGroup === 'Executive').length
  const secFinanceCount = officers.filter((o) => o.roleGroup === 'Secretariat & Finance').length
  const opsPrCount = officers.filter((o) => o.roleGroup === 'Operations & PR').length
  const yearRepsCount = officers.filter((o) => o.roleGroup === 'Year Representatives').length
  const pubmatCount = pubmatTeam.length

  // High-priority upcoming events (first 4 scheduled activities)
  const upcomingEvents = calendarActivities.slice(0, 4)

  // Latest dispatches
  const recentDispatches = socialDispatches.slice(0, 4)

  // Role-tailored top metrics
  const topMetrics = [
    {
      label: 'Scheduled Activities',
      value: `${calendarActivities.length} Events`,
      sub: 'A.Y. 2026–2027 Calendar',
      icon: CalendarDays,
      href: '/management/events',
    },
    {
      label: 'Official Dispatches',
      value: `${socialDispatches.length} Published`,
      sub: 'Campus Advisories & News',
      icon: FileEdit,
      href: '/management/blog',
    },
    {
      label: isAdmin ? 'Executive Roster' : 'Organization Team',
      value: `${totalStaffCount} Members`,
      sub: 'Active Officers & Staff',
      icon: Users,
      href: '/management/officers',
    },
    {
      label: isAdmin ? 'Treasury Compliance' : 'Campus Projects',
      value: isAdmin ? '₱25.00 / sem' : `${projectsData.length} Utilities`,
      sub: isAdmin ? 'Mandatory Semestral Fee' : 'Active Student Projects',
      icon: isAdmin ? Landmark : Code2,
      href: isAdmin ? '/management/treasury' : '/management/projects',
    },
  ]

  // Role-tailored quick action shortcuts
  const quickActions = [
    {
      label: 'New Dispatch',
      icon: Plus,
      href: '/management/blog/new',
      highlight: true,
    },
    {
      label: 'Schedule Activity',
      icon: CalendarDays,
      href: '/management/events',
    },
    {
      label: 'Manage Banners',
      icon: Megaphone,
      href: '/management/banners',
    },
    {
      label: 'Attendance Check-in',
      icon: ClipboardList,
      href: '/management/attendance',
    },
    ...(isAdmin
      ? [
          {
            label: 'Treasury Ledger',
            icon: Landmark,
            href: '/management/treasury',
          },
        ]
      : [
          {
            label: 'Constitution & By-Laws',
            icon: BookOpen,
            href: '/management/cbl',
          },
        ]),
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-6">
      {/* ─── Header: Greeting & Role Identity ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black/8 dark:border-white/6 pb-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {greeting}{user ? `, ${user.displayName}` : ''}
            </h1>
            {user && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                  isAdmin
                    ? 'bg-gold/15 text-gold border border-gold/30'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                }`}
              >
                {isAdmin ? 'Super Admin' : user.position || 'Officer'}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-white/50 mt-1 truncate">
            {isAdmin
              ? 'Executive Command & System Governance · College of Computing and Information Sciences'
              : `Officer Workspace · ${user?.position || 'Student Leader'} · A.Y. 2026–2027`}
          </p>
        </div>

        {currentTimeStr && (
          <div className="flex items-center gap-2 bg-black/[0.03] dark:bg-white/[0.03] border border-black/8 dark:border-white/8 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 dark:text-white/75 self-start md:self-auto flex-shrink-0">
            <Clock size={13} className="text-gold" />
            <span className="tabular-nums">{currentTimeStr}</span>
          </div>
        )}
      </div>

      {/* ─── Role-Based Officer Scope Banner (For Regular Officers) ─── */}
      {isOfficer && user && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-sky-500/[0.08] via-sky-500/[0.03] to-transparent border border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 flex-shrink-0">
              <Award size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Officer Assignment: <span className="text-sky-600 dark:text-sky-300">{user.position || 'PSITS Officer'}</span>
              </p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-white/50">
                Authorized for event coordination, attendance check-ins, and advisory dispatches.
              </p>
            </div>
          </div>
          <Link
            href="/management/cbl"
            className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 self-start sm:self-auto font-medium"
          >
            <span>Review Officer Duties (CBL)</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>
      )}

      {/* ─── Top KPI Metric Cards (Clean Vertical Hierarchy, Never Wraps) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {topMetrics.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
          >
            <Link
              href={kpi.href}
              className="group block bg-white dark:bg-[#0d121f] border border-black/8 dark:border-white/6 hover:border-gold/40 rounded-xl p-4 sm:p-5 transition-all duration-200 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-white/50 font-medium truncate">{kpi.label}</span>
                <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/8 dark:border-white/8 flex items-center justify-center text-slate-600 dark:text-white/60 group-hover:text-gold group-hover:border-gold/30 transition-colors flex-shrink-0">
                  <kpi.icon size={14} />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  {kpi.value}
                </div>
                <div className="text-[11px] font-mono text-slate-400 dark:text-white/40 group-hover:text-gold transition-colors flex items-center gap-1 mt-1 truncate">
                  <span className="truncate">{kpi.sub}</span>
                  <ArrowUpRight size={11} className="flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ─── Quick Actions Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-xs font-mono text-slate-500 dark:text-white/40 mr-1 flex items-center gap-1.5 w-full sm:w-auto">
          <Sparkles size={13} className="text-gold" />
          Quick Actions:
        </span>
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`
              inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-150 active:scale-95
              ${
                action.highlight
                  ? 'bg-gold text-[#0a0e17] font-semibold hover:bg-gold-muted shadow-sm'
                  : 'bg-white dark:bg-[#0d121f] border border-black/8 dark:border-white/8 text-slate-700 dark:text-white/75 hover:text-slate-900 dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 shadow-sm dark:shadow-none'
              }
            `}
          >
            <action.icon size={13} />
            <span>{action.label}</span>
          </Link>
        ))}
      </div>

      {/* ─── Main Two-Column Working Deck (Stack on mobile/tablet, 7/5 on Desktop) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: Upcoming Activities (7 of 12 cols) */}
        <div className="xl:col-span-7 bg-white dark:bg-[#0d121f] border border-black/8 dark:border-white/6 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/6">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-gold" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Upcoming Calendar Schedule</h2>
            </div>
            <Link
              href="/management/events"
              className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
            >
              <span>View All 15 Events</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingEvents.map((act) => (
              <div
                key={act.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/12 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-150"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-gold/10 border border-gold/20 flex flex-col items-center justify-center flex-shrink-0 text-gold">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                      {act.month.split(' ')[0].slice(0, 3)}
                    </span>
                    <span className="text-[11px] font-bold leading-none mt-0.5">
                      {act.semester.includes('1st') ? 'S1' : 'S2'}
                    </span>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-gold transition-colors">
                      {act.activity}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-white/40 truncate">
                      Venue: {act.venue} · Target: {act.involved}
                    </p>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 flex-shrink-0 pt-1 sm:pt-0 border-t border-black/5 dark:border-white/[0.03] sm:border-0">
                  <span
                    className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full border ${
                      act.category === 'Governance'
                        ? 'bg-gold/10 text-gold border-gold/30'
                        : act.category === 'Academic'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                        : act.category === 'Competition'
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : 'bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white/70 border-black/10 dark:border-white/20'
                    }`}
                  >
                    {act.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-white/30">{act.month}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-white/40">
            <span>Semester 1: 8 Activities</span>
            <span>Semester 2: 7 Activities</span>
          </div>
        </div>

        {/* Right Column: Recent Dispatches & Announcements (5 of 12 cols) */}
        <div className="xl:col-span-5 bg-white dark:bg-[#0d121f] border border-black/8 dark:border-white/6 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/6">
            <div className="flex items-center gap-2">
              <FileEdit size={16} className="text-gold" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Recent Dispatches</h2>
            </div>
            <Link
              href="/management/blog"
              className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDispatches.map((dispatch) => (
              <div
                key={dispatch.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 hover:border-black/15 dark:hover:border-white/12 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] transition-all duration-150 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-medium">
                    {dispatch.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">{dispatch.date}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-1 hover:text-gold transition-colors">
                  <Link href={`/management/blog?highlight=${dispatch.id}`}>{dispatch.title}</Link>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-white/40 line-clamp-1">
                  {dispatch.excerpt}
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-400 dark:text-white/30">
                  <span>By {dispatch.credits.writer || 'Pubmat Team'}</span>
                  <Link
                    href={`/management/blog?edit=${dispatch.id}`}
                    className="text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Edit →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/management/blog/new"
            className="w-full py-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] border border-dashed border-black/15 dark:border-white/10 text-xs font-mono text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white text-center transition-colors flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Plus size={13} />
            <span>Compose New Announcement</span>
          </Link>
        </div>
      </div>

      {/* ─── Bottom Row: Role-Tailored Snapshot (Stack on Mobile, 5/7 on Desktop) ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Bottom Card: Role-Tailored */}
        <div className="xl:col-span-5 bg-white dark:bg-[#0d121f] border border-black/8 dark:border-white/6 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm dark:shadow-none">
          {isAdmin ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/6">
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="text-gold" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Constitutional Dues & Compliance</h2>
                </div>
                <Link href="/management/treasury" className="text-xs font-mono text-gold hover:underline flex items-center gap-0.5">
                  <span>Ledger</span>
                  <ArrowUpRight size={11} />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 dark:text-white/50">Mandatory Semestral Fee</span>
                    <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">₱25.00 / student</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-white/40">
                    Mandatory collection for all enrolled BSIT majors (A.Y. 2026–2027)
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 dark:text-white/50">Unexcused Absence Fine</span>
                    <span className="font-bold text-sm sm:text-base text-gold">₱100.00 / meeting</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-white/40">
                    CBL Article V: Official assemblies & monthly performance evaluation
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={15} />
                    <span>CBL Ratification Status</span>
                  </div>
                  <span className="font-bold">Ratified (A.Y. 2026)</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/6">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-sky-500" />
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Officer Duties & Code of Conduct</h2>
                </div>
                <Link href="/management/cbl" className="text-xs font-mono text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5">
                  <span>By-Laws</span>
                  <ArrowUpRight size={11} />
                </Link>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-slate-800 dark:text-white/80 font-medium">Uphold Organization Loyalty</p>
                    <p className="text-slate-500 dark:text-white/40 text-[11px]">Serve as an exemplary role model for CCIS IT students.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-slate-800 dark:text-white/80 font-medium">Mandatory Assembly Attendance</p>
                    <p className="text-slate-500 dark:text-white/40 text-[11px]">Attend monthly regular meetings every last week of the month.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 flex items-start gap-2.5">
                  <CheckCircle2 size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-slate-800 dark:text-white/80 font-medium">Cooperative Execution</p>
                    <p className="text-slate-500 dark:text-white/40 text-[11px]">Coordinate actively with committee chairs for scheduled events.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Bottom Card: Staffing / Committee Matrix */}
        <div className="xl:col-span-7 bg-white dark:bg-[#0d121f] border border-black/8 dark:border-white/6 rounded-2xl p-4 sm:p-5 space-y-4 flex flex-col justify-between shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between pb-3 border-b border-black/8 dark:border-white/6">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gold" />
              <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {isAdmin ? 'Organization Staffing Matrix' : 'PSITS Leadership & Committees'}
              </h2>
            </div>
            <Link href="/management/officers" className="text-xs font-mono text-gold hover:underline flex items-center gap-0.5">
              <span>View Roster</span>
              <ArrowUpRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-0.5 text-center">
              <span className="text-[9.5px] font-mono uppercase text-slate-500 dark:text-white/40 block">Executive</span>
              <span className="font-black text-lg sm:text-xl text-gold">{executiveCount}</span>
              <span className="text-[9.5px] font-mono text-slate-400 dark:text-white/30 block">Pres & VP</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-0.5 text-center">
              <span className="text-[9.5px] font-mono uppercase text-slate-500 dark:text-white/40 block">Sec & Finance</span>
              <span className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">{secFinanceCount}</span>
              <span className="text-[9.5px] font-mono text-slate-400 dark:text-white/30 block">Sec, Treas, Aud</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-0.5 text-center">
              <span className="text-[9.5px] font-mono uppercase text-slate-500 dark:text-white/40 block">Operations</span>
              <span className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">{opsPrCount}</span>
              <span className="text-[9.5px] font-mono text-slate-400 dark:text-white/30 block">PIO, Bus. Mgrs</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-0.5 text-center">
              <span className="text-[9.5px] font-mono uppercase text-slate-500 dark:text-white/40 block">Year Reps</span>
              <span className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">{yearRepsCount}</span>
              <span className="text-[9.5px] font-mono text-slate-400 dark:text-white/30 block">1st–4th Year</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/6 dark:border-white/6 space-y-0.5 text-center col-span-2 sm:col-span-1">
              <span className="text-[9.5px] font-mono uppercase text-slate-500 dark:text-white/40 block">Pubmat</span>
              <span className="font-black text-lg sm:text-xl text-gold">{pubmatCount}</span>
              <span className="text-[9.5px] font-mono text-slate-400 dark:text-white/30 block">Creatives</span>
            </div>
          </div>

          <div className="pt-3 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-mono text-slate-500 dark:text-white/40">
            <span className="truncate">Adviser: <strong className="text-slate-800 dark:text-white/80">{adviser.name}</strong></span>
            <span className="truncate">College Dean: <strong className="text-slate-800 dark:text-white/80">{dean.name}</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
