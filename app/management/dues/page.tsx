'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Trash2,
  X,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Users,
  Coins,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import FormField, { inputStyles } from '../_components/FormField'
import { ManagementCardGridSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import { useAuth } from '../_context/auth-context'
import type { MembershipDueRow } from '@/lib/supabase'
import {
  DEFAULT_PROGRAM,
  DEFAULT_MEMBERSHIP_FEE,
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_SEMESTER,
  YEAR_LEVELS,
  SECTIONS,
  ACADEMIC_YEARS,
  SEMESTERS,
  STANDARD_COLLECTING_OFFICERS,
  parseRecordedBy,
  formatYearSection,
  getAllStandardSections,
  type YearLevel,
  type SectionLetter,
} from '@/lib/dues'
import {
  getMembershipDuesAction,
  recordMembershipDueAction,
  deleteMembershipDueAction,
} from './actions'

function resolveDefaultOfficer(user: { displayName?: string; position?: string; role?: string } | null): string {
  if (!user?.displayName) {
    return `${STANDARD_COLLECTING_OFFICERS[0].name} (${STANDARD_COLLECTING_OFFICERS[0].role})`
  }
  const match = STANDARD_COLLECTING_OFFICERS.find(
    (o) =>
      user.displayName!.toLowerCase().includes(o.name.toLowerCase()) ||
      o.name.toLowerCase().includes(user.displayName!.toLowerCase())
  )
  if (match) return `${match.name} (${match.role})`
  if (user.position) return `${user.displayName} (${user.position})`
  if (user.role === 'admin') return `${user.displayName} (Admin)`
  return `${user.displayName} (Officer)`
}

export default function MembershipDuesManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [dues, setDues] = useState<MembershipDueRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all')

  // Add Payment Modal State
  const [showModal, setShowModal] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [yearLevel, setYearLevel] = useState<YearLevel>(1)
  const [sectionLetter, setSectionLetter] = useState<SectionLetter>('A')
  const [academicYear, setAcademicYear] = useState<string>(DEFAULT_ACADEMIC_YEAR)
  const [semester, setSemester] = useState<string>(DEFAULT_SEMESTER)
  const [recordedBy, setRecordedBy] = useState<string>(() => resolveDefaultOfficer(null))
  const [formError, setFormError] = useState<string | null>(null)

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load records (manual refresh)
  const loadDues = useCallback(async () => {
    setIsLoading(true)
    const res = await getMembershipDuesAction()
    if (res.success && res.data) {
      setDues(res.data)
    } else {
      toast(res.error || 'Failed to fetch dues records', 'error')
    }
    setIsLoading(false)
  }, [toast])

  // Initial load
  useEffect(() => {
    let active = true
    async function init() {
      const res = await getMembershipDuesAction()
      if (active) {
        if (res.success && res.data) {
          setDues(res.data)
        } else {
          toast(res.error || 'Failed to fetch dues records', 'error')
        }
        setIsLoading(false)
      }
    }
    init()
    return () => {
      active = false
    }
  }, [toast])

  // Computed live section tag for the modal
  const computedSectionTag = useMemo(() => {
    return formatYearSection(DEFAULT_PROGRAM, yearLevel, sectionLetter)
  }, [yearLevel, sectionLetter])

  // Filtered dues records
  const filteredDues = useMemo(() => {
    return dues.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.student_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.year_section.toLowerCase().includes(searchQuery.toLowerCase().trim())

      const matchesYear =
        selectedYear === 'all' || String(item.year_level) === selectedYear

      const matchesSection =
        selectedSection === 'all' || item.section === selectedSection

      const matchesAcademicYear =
        selectedAcademicYear === 'all' || item.academic_year === selectedAcademicYear

      const matchesSemester =
        selectedSemester === 'all' || item.semester === selectedSemester

      const matchesOfficer =
        selectedOfficer === 'all' || (item.recorded_by && item.recorded_by.toLowerCase().includes(selectedOfficer.toLowerCase()))

      return matchesSearch && matchesYear && matchesSection && matchesAcademicYear && matchesSemester && matchesOfficer
    })
  }, [dues, searchQuery, selectedYear, selectedSection, selectedAcademicYear, selectedSemester, selectedOfficer])

  // Quick statistics
  const stats = useMemo(() => {
    const totalCollected = dues.reduce((acc, curr) => acc + (Number(curr.amount) || DEFAULT_MEMBERSHIP_FEE), 0)
    const uniqueSectionsWithPayments = new Set(dues.map((d) => d.year_section)).size
    return {
      totalPaid: dues.length,
      totalCollected,
      sectionsCount: uniqueSectionsWithPayments,
    }
  }, [dues])

  // Section breakdown map for quick chips
  const sectionCounts = useMemo(() => {
    const map = new Map<string, number>()
    getAllStandardSections().forEach((s) => map.set(s, 0))
    dues.forEach((d) => {
      const s = d.year_section
      map.set(s, (map.get(s) || 0) + 1)
    })
    return map
  }, [dues])

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!studentName.trim()) {
      setFormError('Student full name is required.')
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('student_name', studentName.trim())
    formData.append('year_level', String(yearLevel))
    formData.append('section', sectionLetter)
    formData.append('academic_year', academicYear)
    formData.append('semester', semester)
    formData.append('recorded_by', recordedBy.trim())

    const res = await recordMembershipDueAction(formData)

    if (res.success && res.data) {
      toast(`Successfully recorded ₱25.00 due for ${res.data.student_name} (${res.data.year_section})`, 'success')
      setDues((prev) => [res.data!, ...prev])
      setShowModal(false)
      setStudentName('')
      setFormError(null)
    } else {
      setFormError(res.error || 'Failed to record membership due')
    }

    setIsSubmitting(false)
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    const res = await deleteMembershipDueAction(id)
    if (res.success) {
      setDues((prev) => prev.filter((d) => d.id !== id))
      toast('Payment record removed', 'success')
      setDeleteConfirmId(null)
    } else {
      toast(res.error || 'Failed to delete record', 'error')
    }
    setIsDeleting(false)
  }

  const handleOpenAddModal = () => {
    setFormError(null)
    setStudentName('')
    setRecordedBy(resolveDefaultOfficer(user))
    setShowModal(true)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-gold">
            <Receipt className="w-4 h-4 text-gold" />
            <span>Treasury & Membership Ledger</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Membership Dues Register
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
            Official semestral PSITS membership dues (₱25.00/semester) collection ledger and section validation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dues"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono tracking-wider uppercase border border-black/15 dark:border-white/15 text-slate-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gold" />
            <span>Public Tracker</span>
          </Link>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono tracking-wider uppercase bg-gold hover:bg-gold-light text-black font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Funds Collected */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50">
              Total Funds Collected
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              ₱{stats.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-white/40 mt-1 block">
            Rate: ₱25.00 per student / semester
          </span>
        </div>

        {/* Total Registered Members */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50">
              Paid Members
            </span>
            <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.totalPaid}
            </span>
            <span className="text-xs text-slate-500 dark:text-white/40 font-mono">Students</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-white/40 mt-1 block">
            Active verified entries
          </span>
        </div>

        {/* Active Sections Covered */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50">
              Sections Represented
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.sectionsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-white/40 font-mono">/ 20 Sections</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-white/40 mt-1 block">
            BSIT Years 1–4 (Sections A–E)
          </span>
        </div>

        {/* Term Information */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50">
              Active Term
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {DEFAULT_ACADEMIC_YEAR}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-white/40 mt-1 block">
            {DEFAULT_SEMESTER}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student full name or section (e.g. BSIT 1-A)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputStyles} pl-10 text-xs`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Term, Year, Section Filters Grid */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 md:flex-initial">
              {/* Academic Year Filter */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 whitespace-nowrap">
                  A.Y.:
                </span>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  <option value="all">All A.Y.</option>
                  {ACADEMIC_YEARS.map((ay) => (
                    <option key={ay} value={ay}>
                      {ay}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester Filter */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 whitespace-nowrap">
                  Sem:
                </span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  <option value="all">All Semesters</option>
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Level Filter */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 whitespace-nowrap">
                  Year:
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  <option value="all">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              {/* Section Filter */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 whitespace-nowrap">
                  Sec:
                </span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  <option value="all">All Sections</option>
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      Sec {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Officer Filter */}
              <div className="flex items-center gap-1.5 min-w-0 col-span-2 sm:col-span-4 lg:col-span-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 whitespace-nowrap">
                  By:
                </span>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="w-full bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  <option value="all">All Officers</option>
                  {STANDARD_COLLECTING_OFFICERS.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name} ({o.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadDues}
              disabled={isLoading}
              className="flex items-center justify-center p-2 rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-white/70 shrink-0"
              title="Refresh Dues List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-gold' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Section Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar text-xs">
          <button
            onClick={() => {
              setSelectedYear('all')
              setSelectedSection('all')
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all whitespace-nowrap ${
              selectedYear === 'all' && selectedSection === 'all'
                ? 'bg-gold text-black font-semibold'
                : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-white'
            }`}
          >
            All Sections ({dues.length})
          </button>

          {getAllStandardSections().map((sec) => {
            const count = sectionCounts.get(sec) || 0
            const [, numLetter] = sec.split(' ')
            const [y, s] = numLetter ? numLetter.split('-') : ['1', 'A']
            const isSelected = selectedYear === y && selectedSection === s

            return (
              <button
                key={sec}
                onClick={() => {
                  setSelectedYear(y)
                  setSelectedSection(s)
                }}
                className={`px-2 py-1 rounded-full text-[11px] font-mono transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gold text-black font-semibold'
                    : count > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40'
                }`}
              >
                <span>{sec}</span>
                <span className={`text-[10px] px-1 rounded-full ${isSelected ? 'bg-black/20 text-black' : 'bg-black/10 dark:bg-white/10'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dues Records Table */}
      {isLoading ? (
        <ManagementCardGridSkeleton />
      ) : filteredDues.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No Dues Payments Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 max-w-sm mx-auto mt-1">
            {searchQuery || selectedYear !== 'all' || selectedSection !== 'all'
              ? 'Try changing your search query or section filters.'
              : 'Start by clicking "+ Record Payment" to log paid membership dues.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0c0c0c] shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-black/10 dark:border-white/10 text-slate-500 dark:text-white/50 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Student Full Name</th>
                  <th className="px-4 py-3.5">Year & Section</th>
                  <th className="px-4 py-3.5">Term</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Recorded By</th>
                  <th className="px-4 py-3.5">Paid At</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredDues.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Student Name */}
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {row.student_name}
                    </td>

                    {/* Section Badge */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gold/10 text-gold border border-gold/20">
                        {row.year_section}
                      </span>
                    </td>

                    {/* Term */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-white/60">
                      <div>A.Y. {row.academic_year}</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/40">{row.semester}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 font-mono text-slate-900 dark:text-white font-medium">
                      ₱{(Number(row.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </span>
                    </td>

                    {/* Recorded By */}
                    <td className="px-4 py-3.5">
                      {(() => {
                        const { name, role } = parseRecordedBy(row.recorded_by)
                        return (
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-900 dark:text-white text-xs whitespace-nowrap">
                              {name}
                            </div>
                            {role && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                                {role}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-white/50 font-mono text-[11px]">
                      {row.paid_at
                        ? new Date(row.paid_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setDeleteConfirmId(row.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Void / Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (shown on md and below) */}
          <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
            {filteredDues.map((row) => (
              <div key={row.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {row.student_name}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gold/10 text-gold border border-gold/20">
                        {row.year_section}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>₱{(Number(row.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmId(row.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                    title="Void Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-white/40 pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04] flex-wrap gap-1">
                  <div>
                    {(() => {
                      const { name, role } = parseRecordedBy(row.recorded_by)
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 dark:text-white/40">By:</span>
                          <span className="text-slate-800 dark:text-white/90 font-medium">{name}</span>
                          {role && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              {role}
                            </span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <span className="shrink-0 text-slate-400 dark:text-white/40">
                    A.Y. {row.academic_year} · {row.semester}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 border-t border-black/10 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-white/40 font-mono">
            <span>
              Showing {filteredDues.length} of {dues.length} records
            </span>
            <span>
              Total: ₱
              {filteredDues
                .reduce((acc, curr) => acc + (Number(curr.amount) || DEFAULT_MEMBERSHIP_FEE), 0)
                .toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-semibold">
                  Official Ledger Entry
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Record Membership Due
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Program & Section Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Fixed Program */}
                <FormField label="Program">
                  <div className="w-full bg-slate-100 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono font-bold text-gold flex items-center justify-between select-none">
                    <span>{DEFAULT_PROGRAM}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-gold/20 text-gold">
                      Fixed
                    </span>
                  </div>
                </FormField>

                {/* Year Level Dropdown */}
                <FormField label="Year Level" required>
                  <select
                    value={yearLevel}
                    onChange={(e) => setYearLevel(parseInt(e.target.value, 10) as YearLevel)}
                    className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                  >
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>
                        {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : '4th Year'}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Section Dropdown */}
                <FormField label="Section" required>
                  <select
                    value={sectionLetter}
                    onChange={(e) => setSectionLetter(e.target.value as SectionLetter)}
                    className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Live Section Preview Badge */}
              <div className="px-3.5 py-2.5 rounded-lg bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-white/50 font-mono">
                  Normalized Section Tag:
                </span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                  {computedSectionTag}
                </span>
              </div>

              {/* Student Name */}
              <FormField
                label="Student Full Name"
                required
                hint="Check name spelling carefully. Checked against duplicates per section."
              >
                <input
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value)
                    if (formError) setFormError(null)
                  }}
                  className={inputStyles}
                  autoFocus
                />
              </FormField>

              {/* Collecting Officer & Role */}
              <FormField
                label="Collecting Officer & Role"
                required
                hint="Select the specific officer responsible for collecting and registering this payment."
              >
                <select
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold cursor-pointer"
                >
                  <optgroup label="Finance & Treasury">
                    {STANDARD_COLLECTING_OFFICERS.filter((o) => o.category === 'Finance & Treasury').map((o) => (
                      <option key={o.name} value={`${o.name} (${o.role})`}>
                        {o.name} — {o.role}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Year Representatives">
                    {STANDARD_COLLECTING_OFFICERS.filter((o) => o.category === 'Year Representatives').map((o) => (
                      <option key={o.name} value={`${o.name} (${o.role})`}>
                        {o.name} — {o.role}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Executive Council">
                    {STANDARD_COLLECTING_OFFICERS.filter((o) => o.category === 'Executive Council').map((o) => (
                      <option key={o.name} value={`${o.name} (${o.role})`}>
                        {o.name} — {o.role}
                      </option>
                    ))}
                  </optgroup>
                  {user && (
                    <optgroup label="Logged-in Account">
                      <option value={`${user.displayName} (${user.position || user.role})`}>
                        {user.displayName} ({user.position || user.role})
                      </option>
                    </optgroup>
                  )}
                </select>
              </FormField>

              {/* Academic Year and Semester Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Academic Year" required>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                  >
                    {ACADEMIC_YEARS.map((ay) => (
                      <option key={ay} value={ay}>
                        A.Y. {ay}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Semester" required>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                  >
                    {SEMESTERS.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Semestral Fee Notice */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-white/40 block">
                    Semestral Membership Due
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-white/50">
                    CBL Art. V § 2 (Php 25.00)
                  </span>
                </div>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  ₱{DEFAULT_MEMBERSHIP_FEE.toFixed(2)}
                </span>
              </div>

              {/* Duplicate Error Banner */}
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-mono uppercase text-slate-600 dark:text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-gold hover:bg-gold-light text-black font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Void Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Void Dues Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
                Are you sure you want to remove this student payment from the official ledger?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase text-slate-600 dark:text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-mono uppercase bg-red-600 hover:bg-red-500 text-white font-semibold shadow-sm transition-all"
              >
                {isDeleting ? 'Voiding...' : 'Yes, Void Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
