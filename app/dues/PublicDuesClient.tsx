'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, CheckCircle2, Lock, Receipt, Calendar } from 'lucide-react'
import type { PublicDuesSummary } from '@/app/management/dues/actions'
import { DEFAULT_MEMBERSHIP_FEE, getAllStandardSections } from '@/lib/dues'

interface PublicDuesClientProps {
  initialData: PublicDuesSummary
}

export default function PublicDuesClient({ initialData }: PublicDuesClientProps) {
  const [data] = useState<PublicDuesSummary>(initialData)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')

  const standardSections = useMemo(() => getAllStandardSections(), [])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return data.maskedRecords.filter((rec) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        rec.masked_name.toLowerCase().includes(q) ||
        rec.year_section.toLowerCase().includes(q)

      const matchesSection =
        selectedSection === 'all' || rec.year_section === selectedSection

      return matchesSearch && matchesSection
    })
  }, [data.maskedRecords, searchQuery, selectedSection])

  // Count active sections
  const activeSectionsCount = useMemo(() => {
    return data.sectionBreakdown.filter((s) => s.count > 0).length
  }, [data.sectionBreakdown])

  return (
    <div className="min-h-screen bg-canvas text-text pt-24 sm:pt-32 pb-16 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Minimal Breadcrumb & Active Term Badge (Set by Management) */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-white/50">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>

          {/* Active term badge set by management */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[11px] text-slate-700 dark:text-white/70">
            <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>A.Y. {data.academicYear} · {data.semester}</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-gold">
            <Receipt className="w-3.5 h-3.5" />
            <span>Treasury & Membership Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Membership Dues
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60">
            Official public transparency ledger of semestral membership dues (₱25.00/student) for <span className="font-semibold text-slate-800 dark:text-white/90">A.Y. {data.academicYear} · {data.semester}</span>. Student names masked on server for privacy.
          </p>
        </div>

        {/* Minimal Stats Row (Theme-Aware & Responsive) */}
        <div className="grid grid-cols-3 divide-x divide-black/[0.08] dark:divide-white/[0.08] rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] py-3.5 sm:py-4 px-2 text-center text-xs shadow-sm">
          <div className="px-1">
            <span className="block text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-white/40">Total Funds</span>
            <span className="mt-1 block text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-mono truncate">
              ₱{data.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-1">
            <span className="block text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-white/40">Paid Members</span>
            <span className="mt-1 block text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
              {data.totalPaid}
            </span>
          </div>
          <div className="px-1">
            <span className="block text-[10px] sm:text-[11px] font-mono uppercase text-slate-500 dark:text-white/40">Sections</span>
            <span className="mt-1 block text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-mono">
              {activeSectionsCount} <span className="text-[10px] sm:text-xs text-slate-400 dark:text-white/40 font-normal">/ 20</span>
            </span>
          </div>
        </div>

        {/* Filter & Search Bar (Mobile Optimized) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search masked name (e.g. J***) or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-lg pl-8 pr-7 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-gold/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Section Select Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-[#11131a] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold/50 cursor-pointer"
            >
              <option value="all">All Sections ({data.maskedRecords.length})</option>
              {standardSections.map((sec) => {
                const count = data.sectionBreakdown.find((s) => s.yearSection === sec)?.count || 0
                return (
                  <option key={sec} value={sec}>
                    {sec} ({count} paid)
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Section Quick Summary Chips (Edge-to-Edge Mobile Swipe) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedSection('all')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all whitespace-nowrap ${
              selectedSection === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-semibold'
                : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            All ({data.maskedRecords.length})
          </button>
          {standardSections.map((sec) => {
            const count = data.sectionBreakdown.find((s) => s.yearSection === sec)?.count || 0
            const isSelected = selectedSection === sec
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-all whitespace-nowrap flex items-center gap-1 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-semibold'
                    : count > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{sec.replace('BSIT ', '')}</span>
                <span className={`text-[10px] ${isSelected ? 'text-white/80 dark:text-black/80' : 'text-slate-400 dark:text-white/40'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Minimal Ledger List */}
        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] py-12 text-center text-xs text-slate-500 dark:text-white/40 bg-slate-50/50 dark:bg-white/[0.01]">
            No dues records found for this section filter.
          </div>
        ) : (
          <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden bg-white dark:bg-white/[0.01] shadow-sm">
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.08] dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] text-slate-500 dark:text-white/40 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student (Masked)</th>
                    <th className="px-4 py-3 font-medium">Section</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/5">
                  {filteredRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-900 dark:text-white font-medium">
                        {item.masked_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                          {item.year_section}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        ₱{(Number(item.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Paid</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Roster (Shown on screens < 640px) */}
            <div className="sm:hidden divide-y divide-black/[0.05] dark:divide-white/5">
              {filteredRecords.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                      {item.masked_name}
                    </div>
                    <span className="inline-flex items-center font-mono text-[10px] text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                      {item.year_section}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>₱{(Number(item.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-white/30 mt-0.5">
                      Verified
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Footer */}
            <div className="px-4 py-2.5 border-t border-black/[0.08] dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-white/40">
              <span>{filteredRecords.length} records</span>
              <span>
                Subtotal: ₱
                {filteredRecords
                  .reduce((acc, curr) => acc + (Number(curr.amount) || DEFAULT_MEMBERSHIP_FEE), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Minimal Footer Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-white/40 pt-4 border-t border-black/[0.06] dark:border-white/[0.06] text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>Student identities masked on server for privacy.</span>
          </div>
          <span className="font-mono">PSITS-UA Treasury</span>
        </div>
      </div>
    </div>
  )
}
