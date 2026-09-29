'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, CheckCircle2, ChevronDown } from 'lucide-react'
import type { PublicDuesSummary } from '@/app/management/dues/actions'
import { DEFAULT_MEMBERSHIP_FEE, getAllStandardSections } from '@/lib/dues'

interface PublicDuesClientProps {
  initialData: PublicDuesSummary
  availableTerms?: { academicYear: string; semester: string }[]
  availableAcademicYears?: string[]
}

export default function PublicDuesClient({
  initialData,
  availableTerms = [],
}: PublicDuesClientProps) {
  const router = useRouter()
  const data = initialData

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all')
  const [selectedSection, setSelectedSection] = useState<string>('all')

  const standardSections = useMemo(() => getAllStandardSections(), [])

  // Term options
  const termOptions = useMemo(() => {
    const list: { ay: string; sem: string; label: string }[] = []
    const seen = new Set<string>()

    const currentKey = `${data.academicYear}__${data.semester}`
    seen.add(currentKey)
    list.push({
      ay: data.academicYear,
      sem: data.semester,
      label: `A.Y. ${data.academicYear} · ${data.semester}`,
    })

    for (const t of availableTerms) {
      const key = `${t.academicYear}__${t.semester}`
      if (!seen.has(key)) {
        seen.add(key)
        list.push({
          ay: t.academicYear,
          sem: t.semester,
          label: `A.Y. ${t.academicYear} · ${t.semester}`,
        })
      }
    }

    return list
  }, [data.academicYear, data.semester, availableTerms])

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [ay, sem] = e.target.value.split('__')
    if (ay && sem) {
      router.push(`/dues?ay=${encodeURIComponent(ay)}&sem=${encodeURIComponent(sem)}`)
    }
  }

  // Year level tallies
  const yearLevelTallies = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
    for (const rec of data.maskedRecords) {
      const y = Number(rec.year_level) as 1 | 2 | 3 | 4
      if (counts[y] !== undefined) {
        counts[y]++
      }
    }
    return counts
  }, [data.maskedRecords])

  // Filtered records
  const filteredRecords = useMemo(() => {
    return data.maskedRecords.filter((rec) => {
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        rec.masked_name.toLowerCase().includes(q) ||
        rec.year_section.toLowerCase().includes(q)

      const matchesYear =
        selectedYearLevel === 'all' || String(rec.year_level) === selectedYearLevel

      const matchesSection =
        selectedSection === 'all' || rec.year_section === selectedSection

      return matchesSearch && matchesYear && matchesSection
    })
  }, [data.maskedRecords, searchQuery, selectedYearLevel, selectedSection])

  // Active sections
  const activeSectionsCount = useMemo(() => {
    return data.sectionBreakdown.filter((s) => s.count > 0).length
  }, [data.sectionBreakdown])

  return (
    <div className="min-h-screen bg-canvas text-text pt-28 sm:pt-36 pb-20 px-4 sm:px-6 selection:bg-gold/20 selection:text-gold">
      <div className="max-w-4xl mx-auto">

        {/* Top bar — back link + term */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 hover:text-gold transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>PSITS Home</span>
          </Link>

          <div className="relative inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/50 font-mono">
            <select
              value={`${data.academicYear}__${data.semester}`}
              onChange={handleTermChange}
              className="appearance-none bg-transparent text-xs text-slate-600 dark:text-white/70 outline-none cursor-pointer font-mono pr-4"
            >
              {termOptions.map((opt) => (
                <option
                  key={`${opt.ay}__${opt.sem}`}
                  value={`${opt.ay}__${opt.sem}`}
                  className="bg-white dark:bg-[#121212] text-slate-900 dark:text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-0 pointer-events-none text-slate-400 dark:text-white/40" />
          </div>
        </div>

        {/* Header — title only, no boxes */}
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Membership Dues
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-white/50 max-w-xl">
            Transparency ledger for PSITS membership dues — ₱{DEFAULT_MEMBERSHIP_FEE.toFixed(2)} per student, per semester.
          </p>
        </div>

        {/* Inline stats — flat, no cards */}
        <div className="flex items-baseline gap-8 sm:gap-12 mb-10 pb-8 border-b border-black/5 dark:border-white/5">
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              ₱{data.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-white/40 font-mono uppercase tracking-wider">
              Collected
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {data.totalPaid}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-white/40 font-mono uppercase tracking-wider">
              Registered
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {activeSectionsCount}<span className="text-base font-normal text-slate-400 dark:text-white/40">/20</span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-white/40 font-mono uppercase tracking-wider">
              Sections
            </span>
          </div>
        </div>

        {/* Filters — only visible when there are records */}
        {data.totalPaid > 0 && (
          <div className="space-y-4 mb-8">
            {/* Year level tabs + search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-xs font-mono overflow-x-auto no-scrollbar">
                {[
                  { key: 'all', label: 'All', count: data.totalPaid },
                  { key: '1', label: '1st', count: yearLevelTallies[1] },
                  { key: '2', label: '2nd', count: yearLevelTallies[2] },
                  { key: '3', label: '3rd', count: yearLevelTallies[3] },
                  { key: '4', label: '4th', count: yearLevelTallies[4] },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setSelectedYearLevel(tab.key)
                      setSelectedSection('all')
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      selectedYearLevel === tab.key
                        ? 'bg-gold text-black font-bold'
                        : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label} <span className="opacity-60">{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name or section..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 pr-7 text-xs font-mono rounded-lg bg-transparent border border-black/10 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-gold/50 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] font-mono"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Section chips — simple flat pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedSection('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all whitespace-nowrap ${
                  selectedSection === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black font-bold'
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>

              {standardSections.map((sec) => {
                const count = data.sectionBreakdown.find((s) => s.yearSection === sec)?.count || 0
                const isSelected = selectedSection === sec

                return (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-gold text-black font-bold'
                        : count > 0
                        ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                        : 'text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/50'
                    }`}
                  >
                    {sec}{count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Records */}
        {filteredRecords.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-slate-400 dark:text-white/30 font-mono">
              {searchQuery || selectedSection !== 'all' || selectedYearLevel !== 'all'
                ? 'No matching records. Try clearing filters.'
                : 'No dues recorded for this term yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table — borderless, open */}
            <div className="hidden sm:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/35">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Section</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {filteredRecords.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="py-4 pr-4">
                        <span className="font-mono text-sm text-slate-800 dark:text-white/90">
                          {item.masked_name}
                        </span>
                      </td>

                      <td className="py-4 pr-4">
                        <span className="font-mono text-sm text-slate-500 dark:text-white/50">
                          {item.year_section}
                        </span>
                      </td>

                      <td className="py-4 pr-4 font-mono text-sm text-slate-700 dark:text-white/70">
                        ₱{(Number(item.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                      </td>

                      <td className="py-4 pr-4">
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Registered
                        </span>
                      </td>

                      <td className="py-4 text-right text-slate-400 dark:text-white/40 font-mono text-xs">
                        {item.paid_at
                          ? new Date(item.paid_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list — clean rows */}
            <div className="sm:hidden divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {filteredRecords.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-slate-800 dark:text-white/90 truncate">
                      {item.masked_name}
                    </div>
                    <div className="text-xs font-mono text-slate-400 dark:text-white/40 mt-0.5">
                      {item.year_section}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono text-slate-700 dark:text-white/70">
                      ₱{(Number(item.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      Registered
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary line */}
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-mono text-slate-400 dark:text-white/35">
              <span>{filteredRecords.length} of {data.totalPaid} records</span>
              <span className="text-slate-700 dark:text-white/70 font-medium">
                ₱{filteredRecords
                  .reduce((acc, curr) => acc + (Number(curr.amount) || DEFAULT_MEMBERSHIP_FEE), 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-black/5 dark:border-white/5 text-center text-[11px] font-mono text-slate-400 dark:text-white/25">
          PSITS · University of Antique
        </div>
      </div>
    </div>
  )
}
