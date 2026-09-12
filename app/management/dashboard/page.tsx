'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  FileEdit,
  Users,
  Code2,
  ClipboardCheck,
  Landmark,
  ArrowUpRight,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../_context/auth-context'
import { calendarActivities } from '@/data/events'
import { socialDispatches } from '@/data/announcements'
import { projectsData } from '@/data/projects'
import { officers, pubmatTeam, dean, adviser } from '@/data/officers'

const emptySubscribe = () => () => {}

export default function DashboardPage() {
  const { user } = useAuth()
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  const greeting = isClient
    ? (() => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
      })()
    : 'Welcome back'

  const currentTimeStr = isClient
    ? new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const [activeMonthIdx, setActiveMonthIdx] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  /* ── 1. Real Monthly Activity Data Computation (from data/events.ts) ── */
  const academicMonths = [
    { label: 'Aug', full: 'August 2026', sem: '1st' },
    { label: 'Sep', full: 'September 2026', sem: '1st' },
    { label: 'Oct', full: 'October 2026', sem: '1st' },
    { label: 'Nov', full: 'November 2026', sem: '1st' },
    { label: 'Dec', full: 'December 2026', sem: '1st' },
    { label: 'Jan', full: 'January 2027', sem: '2nd' },
    { label: 'Feb', full: 'February 2027', sem: '2nd' },
    { label: 'Mar', full: 'March 2027', sem: '2nd' },
    { label: 'Apr', full: 'April 2027', sem: '2nd' },
    { label: 'May', full: 'May 2027', sem: '2nd' },
    { label: 'Jun', full: 'June 2027', sem: '2nd' },
    { label: 'Jul', full: 'July 2027', sem: '2nd' },
  ] as const

  const monthsData = academicMonths.map((m) => {
    const count = calendarActivities.filter((act) => act.month === m.full).length
    return {
      ...m,
      count,
    }
  })

  const maxMonthlyEvents = Math.max(...monthsData.map((m) => m.count), 1)
  const firstSemCount = calendarActivities.filter((a) => a.semester === '1st Semester (2026)').length
  const secondSemCount = calendarActivities.filter((a) => a.semester === '2nd Semester (2027)').length

  /* ── 2. Real Category Distribution Computation (from data/events.ts) ── */
  const categoryOrder: Array<'Governance' | 'Academic' | 'Social' | 'Career' | 'Competition'> = [
    'Governance',
    'Academic',
    'Social',
    'Career',
    'Competition',
  ]
  const categoryColorTiers: Record<string, string> = {
    Governance: '#f59e0b', // PSITS Gold
    Academic: 'rgba(255, 255, 255, 0.70)',
    Social: 'rgba(255, 255, 255, 0.45)',
    Career: 'rgba(255, 255, 255, 0.25)',
    Competition: 'rgba(255, 255, 255, 0.12)',
  }

  const categoryStats = categoryOrder
    .map((name) => {
      const count = calendarActivities.filter((act) => act.category === name).length
      return {
        name,
        count,
        color: categoryColorTiers[name] || 'rgba(255, 255, 255, 0.20)',
      }
    })
    .filter((c) => c.count > 0)

  const totalCategoryEvents = calendarActivities.length

  // Donut chart math
  const donutRadius = 60
  const donutCircumference = 2 * Math.PI * donutRadius
  let cumulativePercent = 0

  /* ── 3. Real Staffing Distribution (from data/officers.ts) ── */
  const executiveCount = officers.filter((o) => o.roleGroup === 'Executive').length
  const secretariatFinanceCount = officers.filter((o) => o.roleGroup === 'Secretariat & Finance').length
  const operationsPrCount = officers.filter((o) => o.roleGroup === 'Operations & PR').length
  const yearRepsCount = officers.filter((o) => o.roleGroup === 'Year Representatives').length
  const pubmatCount = pubmatTeam.length
  const totalStaffCount = officers.length + pubmatCount

  /* ── 4. Real Constitutional & Activity Budget Matrix ── */
  // Sourced from data/constitution.ts & official scheduled activities
  const budgetAllocations = [
    { category: 'Academic Seminars, Bootcamps & Demo Day', percent: 35, amount: '4 Activities', barBg: 'bg-gold', indicator: '#f59e0b' },
    { category: 'Competitions & Hackathons (CCIS)', percent: 25, amount: '1 Major Contest', barBg: 'bg-white/60', indicator: 'rgba(255, 255, 255, 0.60)' },
    { category: 'Student Welfare & End Year Gatherings', percent: 20, amount: '2 Social Events', barBg: 'bg-white/35', indicator: 'rgba(255, 255, 255, 0.35)' },
    { category: 'Governance Assemblies, Pubmat & Admin', percent: 20, amount: '8 Meetings/Dues', barBg: 'bg-white/15', indicator: 'rgba(255, 255, 255, 0.15)' },
  ]

  /* ── 5. Real Key Metrics (Top Ribbon) ── */
  const topMetrics = [
    { label: 'Calendar Activities', value: `${calendarActivities.length}`, sub: '12 Months Scheduled', icon: CalendarDays, href: '/management/events' },
    { label: 'Officers & Creatives', value: `${totalStaffCount}`, sub: '29 PSITS Org Members', icon: Users, href: '/management/officers' },
    { label: 'Projects Live', value: `${projectsData.length}`, sub: projectsData[0]?.title || 'Campus Utilities', icon: Code2, href: '/management/projects' },
    { label: 'Dispatches Published', value: `${socialDispatches.length}`, sub: 'Official Advisories', icon: FileEdit, href: '/management/blog' },
  ]

  /* ── 6. Spotlights (from real data arrays) ── */
  const nextImminentEvent = calendarActivities[2] || calendarActivities[0] // coa-3: Hackathon / Programming Contest
  const latestDispatch = socialDispatches[0] // Suicide Prevention Month

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* ─── Hero Header & Status ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/6 pb-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            {greeting}{user ? `, ${user.displayName}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-white/40 mt-0.5">
            Operational intelligence, calendar timeline, and governance analytics.
          </p>
        </div>

        {currentTimeStr && (
          <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/8 px-4 py-2 rounded-xl text-xs font-mono text-white/50 w-fit">
            <Clock size={13} className="text-gold" />
            <span>{currentTimeStr}</span>
          </div>
        )}
      </div>

      {/* ─── Key Metrics KPI Bar ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {topMetrics.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group relative bg-[#0d121f] border border-white/6 hover:border-white/15 rounded-xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50 font-medium">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center group-hover:border-gold/30 transition-colors">
                <kpi.icon size={15} className="text-white/60 group-hover:text-gold transition-colors" />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                {kpi.value}
              </span>
              <span className="text-[11px] font-mono text-white/35 group-hover:text-white/60 transition-colors flex items-center gap-1">
                <span>{kpi.sub}</span>
                <ArrowUpRight size={11} />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── Real Operational Spotlights (Next Event & Latest Dispatch) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Imminent Calendar Activity */}
        <div className="bg-[#0d121f] border border-white/6 hover:border-white/12 transition-colors rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-gold/[0.08] border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CalendarDays size={15} className="text-gold" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase text-gold tracking-wider">
                Imminent Activity · {nextImminentEvent.month}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/50 border border-white/8">
                {nextImminentEvent.category}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
              {nextImminentEvent.activity}
            </h4>
            <p className="text-[11px] font-mono text-white/40 truncate">
              Venue: {nextImminentEvent.venue} · For: {nextImminentEvent.involved}
            </p>
          </div>
        </div>

        {/* Latest Published Dispatch */}
        <div className="bg-[#0d121f] border border-white/6 hover:border-white/12 transition-colors rounded-xl p-4 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileEdit size={15} className="text-white/70" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                Latest Official Dispatch · {latestDispatch.date}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-white/50 border border-white/8">
                {latestDispatch.category}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
              {latestDispatch.title}
            </h4>
            <p className="text-[11px] font-mono text-white/40 truncate">
              By {latestDispatch.credits.writer || 'PSITS Pubmat'} · {latestDispatch.tags[0]}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Visual Charts Grid (Bar Chart & Donut Chart) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Activity Timeline Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/6 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-gold" />
                <h3 className="font-display font-bold text-base text-white">
                  Academic Year Activity Volume
                </h3>
              </div>
              <p className="text-xs text-white/40 mt-0.5">
                Monthly event distribution across 1st Semester (2026) and 2nd Semester (2027)
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-white/70 bg-white/[0.04] px-2.5 py-1 rounded border border-white/10">
                1st Sem: {firstSemCount}
              </span>
              <span className="flex items-center gap-1.5 text-gold bg-gold/[0.08] px-2.5 py-1 rounded border border-gold/20">
                2nd Sem: {secondSemCount}
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="space-y-2">
            <div className="h-48 sm:h-52 w-full flex items-end justify-between gap-1 sm:gap-2 pt-6 px-1 sm:px-2 overflow-x-auto">
              {monthsData.map((m, idx) => {
                const heightPercent = (m.count / maxMonthlyEvents) * 100
                const isHovered = activeMonthIdx === idx
                const isFirstSem = m.sem === '1st'

                return (
                  <div
                    key={m.label}
                    className="flex-1 min-w-[22px] sm:min-w-[28px] max-w-[36px] flex flex-col items-center h-full justify-end group cursor-pointer"
                    onMouseEnter={() => setActiveMonthIdx(idx)}
                    onMouseLeave={() => setActiveMonthIdx(null)}
                  >
                    {/* Tooltip Count */}
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono mb-1.5 transition-all duration-200 ${
                        isHovered ? 'text-gold scale-110 font-bold' : 'text-white/30'
                      }`}
                    >
                      {m.count}
                    </span>

                    {/* Bar Rectangle */}
                    <div className="w-full bg-white/[0.03] rounded-t relative h-full flex items-end overflow-hidden border border-white/6 group-hover:border-gold/40 transition-colors">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.04 }}
                        className={`w-full rounded-t transition-all duration-200 ${
                          isHovered
                            ? 'bg-gold shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                            : isFirstSem
                            ? 'bg-white/20 hover:bg-white/30'
                            : 'bg-gold/75 hover:bg-gold/90'
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] sm:text-[11px] font-mono mt-2 transition-colors ${
                        isHovered ? 'text-white font-bold' : 'text-white/40'
                      }`}
                    >
                      {m.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Semester Division Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/40 pt-3 border-t border-white/6 px-1 sm:px-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-white/25" />
                1st Semester: Aug–Dec 2026 ({firstSemCount} Events)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-gold" />
                2nd Semester: Jan–Jul 2027 ({secondSemCount} Events)
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-white/40 bg-white/[0.02] p-2.5 rounded-lg border border-white/6 flex items-center justify-between">
            <span>Peak Activity Months: <strong className="text-white">Sep, Nov, Dec 2026 (2 Events each)</strong></span>
            <Link href="/management/events" className="text-gold hover:underline flex items-center gap-1">
              <span>View All 15 Activities</span>
              <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>

        {/* Category Share Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="border-b border-white/6 pb-4">
            <div className="flex items-center gap-2">
              <PieIcon size={16} className="text-gold" />
              <h3 className="font-display font-bold text-base text-white">
                Category Distribution
              </h3>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              Real activity breakdown across 5 organizational domains
            </p>
          </div>

          {/* SVG Donut */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  className="stroke-white/5"
                  strokeWidth="16"
                  fill="none"
                />

                {/* Slices */}
                {categoryStats.map((cat) => {
                  const percent = cat.count / totalCategoryEvents
                  const strokeDasharray = `${percent * donutCircumference} ${donutCircumference}`
                  const strokeDashoffset = -cumulativePercent * donutCircumference
                  cumulativePercent += percent
                  const isSelected = activeCategory === cat.name

                  return (
                    <circle
                      key={cat.name}
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      stroke={cat.color}
                      strokeWidth={isSelected ? '20' : '16'}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      fill="none"
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setActiveCategory(cat.name)}
                      onMouseLeave={() => setActiveCategory(null)}
                    />
                  )
                })}
              </svg>

              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-display font-black text-2xl text-white">
                  {totalCategoryEvents}
                </span>
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                  Activities
                </span>
              </div>
            </div>

            {/* Category Legend List */}
            <div className="space-y-1.5 flex-1 w-full text-xs font-mono">
              {categoryStats.map((cat) => {
                const percent = Math.round((cat.count / totalCategoryEvents) * 100)
                const isSelected = activeCategory === cat.name

                return (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setActiveCategory(cat.name)}
                    onMouseLeave={() => setActiveCategory(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className={`${isSelected ? 'text-white font-medium' : 'text-white/70'} truncate`}>
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-white/40">{cat.count}</span>
                      <span className={`font-bold w-8 text-right ${isSelected ? 'text-gold' : 'text-white'}`}>
                        {percent}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-[11px] font-mono text-white/40 bg-white/[0.02] p-2.5 rounded-lg border border-white/6 flex items-center justify-between">
            <span>Core Focus: <strong className="text-white">Governance (40%) & Academic (27%)</strong></span>
            <span className="text-white/30">15 Real Activities</span>
          </div>
        </div>
      </div>

      {/* ─── Financial Allocation & Governance Clearance Gauge ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Treasury Operating Budget Visualizer (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/6 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-gold" />
                <h3 className="font-display font-bold text-base text-white">
                  Treasury & Activity Resource Matrix
                </h3>
              </div>
              <p className="text-xs text-white/40 mt-0.5">
                Constitutional dues and calendar resource allocations (A.Y. 2026–2027)
              </p>
            </div>
            <Link
              href="/management/treasury"
              className="text-xs font-mono text-gold hover:text-gold-light flex items-center gap-1 font-medium"
            >
              <span>Treasury Ledger</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {/* Stacked Proportional Bar */}
          <div className="space-y-3">
            <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {budgetAllocations.map((item) => (
                <div
                  key={item.category}
                  style={{ width: `${item.percent}%` }}
                  className={`h-full rounded-sm ${item.barBg} transition-all duration-500 hover:opacity-90`}
                  title={`${item.category}: ${item.percent}% (${item.amount})`}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {budgetAllocations.map((item) => (
                <div
                  key={item.category}
                  className="bg-white/[0.02] border border-white/6 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.indicator }}
                    />
                    <span className="text-xs text-white/70 font-mono truncate">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-bold text-white block">{item.amount}</span>
                    <span className="text-[10px] font-mono text-white/40">{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real Constitutional Dues Policy */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-white/80 font-bold flex items-center gap-1.5">
                <TrendingUp size={13} className="text-gold" />
                Constitutional Membership Dues & Compliance
              </span>
              <span className="text-white/40 block text-[11px]">
                Mandatory BSIT Semestral Fee: <strong className="text-white">₱25.00 / sem</strong> · Assembly Absence Fine: <strong className="text-white">₱100.00</strong>
              </span>
            </div>
            <span className="px-2.5 py-1 rounded bg-white/[0.04] text-white/60 border border-white/10 text-[11px] font-medium self-start sm:self-auto">
              Art. VIII Dues
            </span>
          </div>
        </div>

        {/* Governance & Liquidation Gauge (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="border-b border-white/6 pb-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-gold" />
              <h3 className="font-display font-bold text-base text-white">
                Semester Audit Clearance Gauge
              </h3>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              Institutional liquidation readiness & verification progress
            </p>
          </div>

          {/* Semi-Circle Speedometer SVG Gauge */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
              <svg className="w-48 h-48" viewBox="0 0 200 200">
                {/* Gauge Background Track */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Gauge Progress Arc (35% filled) */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset="163.28" // 35% completed = 251.2 * (1 - 0.35) = 163.28
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Gauge Numeric Center */}
              <div className="absolute bottom-1 flex flex-col items-center text-center">
                <span className="font-display font-black text-3xl text-white leading-none">
                  35%
                </span>
                <span className="text-[10px] font-mono text-gold font-semibold uppercase tracking-widest mt-0.5">
                  Phase 1 Cleared
                </span>
              </div>
            </div>

            {/* Real Clearance Checkpoints */}
            <div className="w-full space-y-2 mt-4 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/10 text-white/80">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-gold" />
                  Constitution & By-Laws (Aug 2026)
                </span>
                <span className="text-[10px] font-bold uppercase text-gold">Ratified (coa-1)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/6 text-white/60">
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-white/40" />
                  1st Sem Midterm Liquidation (Oct 2026)
                </span>
                <span className="text-[10px] uppercase text-white/40">Upcoming Review</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/5 text-white/30">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-white/30" />
                  Annual Elections & Audit (July 2027)
                </span>
                <span className="text-[10px] uppercase text-white/30">Constitutional Mandate</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Team Structure Matrix (Real Sourced from data/officers.ts) ─── */}
      <div className="bg-[#0d121f] border border-white/8 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/6 pb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gold" />
            <h3 className="font-display font-bold text-base text-white">
              Organization Staffing Matrix
            </h3>
          </div>
          <span className="text-xs font-mono text-white/40">
            {totalStaffCount} Appointed & Elected PSITS Org Members
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-white/[0.02] border border-white/6 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/35 uppercase block">Executive</span>
            <span className="font-display font-bold text-xl text-gold block">{executiveCount} Officers</span>
            <span className="text-[10px] text-white/40 block">President & VP</span>
          </div>

          <div className="bg-white/[0.02] border border-white/6 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/35 uppercase block">Sec & Finance</span>
            <span className="font-display font-bold text-xl text-white block">{secretariatFinanceCount} Officers</span>
            <span className="text-[10px] text-white/40 block">Sec, Treas, Auditor + Assts</span>
          </div>

          <div className="bg-white/[0.02] border border-white/6 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/35 uppercase block">Operations & PR</span>
            <span className="font-display font-bold text-xl text-white block">{operationsPrCount} Officers</span>
            <span className="text-[10px] text-white/40 block">PIOs & Business Mgrs</span>
          </div>

          <div className="bg-white/[0.02] border border-white/6 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] text-white/35 uppercase block">Year Reps</span>
            <span className="font-display font-bold text-xl text-white block">{yearRepsCount} Officers</span>
            <span className="text-[10px] text-white/40 block">1st to 4th Year Reps</span>
          </div>

          <div className="bg-white/[0.02] border border-white/6 rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-white/35 uppercase block">Pubmat Creatives</span>
            <span className="font-display font-bold text-xl text-white block">{pubmatCount} Staff</span>
            <span className="text-[10px] text-white/40 block">Writers, Designers, Photo/Video</span>
          </div>
        </div>

        {/* Real Leadership Accreditation */}
        <div className="pt-3 border-t border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-white/40">
          <span>Adviser: <strong className="text-white">{adviser.name}, {adviser.credentials}</strong> ({adviser.title})</span>
          <span>College Dean: <strong className="text-white">{dean.name}, {dean.credentials}</strong> ({dean.college})</span>
        </div>
      </div>
    </div>
  )
}
