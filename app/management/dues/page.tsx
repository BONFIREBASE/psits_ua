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
  Settings,
  Check,
  AlertCircle,
} from 'lucide-react'
import { inputStyles } from '../_components/FormField'
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
  parseBatchStudentNames,
  type YearLevel,
  type SectionLetter,
} from '@/lib/dues'
import {
  getMembershipDuesAction,
  recordBatchMembershipDuesAction,
  deleteMembershipDueAction,
  getDuesTermConfigAction,
  updateDuesTermConfigAction,
  type DuesTermConfig,
  type BatchRecordResult,
} from './actions'

function resolveDefaultOfficer(user: { displayName?: string; position?: string; role?: string } | null): string {
  if (!user?.displayName) return 'Officer'
  if (user.position) return `${user.displayName} (${user.position})`
  if (user.role === 'admin') return `${user.displayName} (System Administrator)`
  return `${user.displayName} (Officer)`
}

export default function MembershipDuesManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [dues, setDues] = useState<MembershipDueRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Global Term Configuration State
  const [termConfig, setTermConfig] = useState<DuesTermConfig>({
    activeAcademicYear: DEFAULT_ACADEMIC_YEAR,
    activeSemester: DEFAULT_SEMESTER,
    availableAcademicYears: [...ACADEMIC_YEARS],
    isDatabaseBacked: false,
  })

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [selectedOfficer, setSelectedOfficer] = useState<string>('all')

  // Unified Record Payment Modal State
  const [showModal, setShowModal] = useState(false)
  const [inputStudentName, setInputStudentName] = useState('')
  const [queuedStudents, setQueuedStudents] = useState<string[]>([])
  const [yearLevel, setYearLevel] = useState<YearLevel>(1)
  const [sectionLetter, setSectionLetter] = useState<SectionLetter>('A')
  const [academicYear, setAcademicYear] = useState<string>(DEFAULT_ACADEMIC_YEAR)
  const [semester, setSemester] = useState<string>(DEFAULT_SEMESTER)
  const [recordedBy, setRecordedBy] = useState<string>(() => resolveDefaultOfficer(null))
  const [formError, setFormError] = useState<string | null>(null)

  // Term Management Modal State
  const [showTermModal, setShowTermModal] = useState(false)
  const [termModalAY, setTermModalAY] = useState<string>(DEFAULT_ACADEMIC_YEAR)
  const [termModalSem, setTermModalSem] = useState<string>(DEFAULT_SEMESTER)
  const [termModalYears, setTermModalYears] = useState<string[]>([...ACADEMIC_YEARS])
  const [newCustomAY, setNewCustomAY] = useState('')
  const [isSavingTerm, setIsSavingTerm] = useState(false)

  // Batch Result Details Modal State (shown when skipped duplicates occur)
  const [batchResultModal, setBatchResultModal] = useState<BatchRecordResult | null>(null)

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Total active students (queued + currently typed name if valid)
  const allActiveStudents = useMemo(() => {
    const list = [...queuedStudents]
    const pendingName = inputStudentName.trim()
    if (pendingName && !list.map((n) => n.toLowerCase()).includes(pendingName.toLowerCase())) {
      list.push(pendingName)
    }
    return list
  }, [queuedStudents, inputStudentName])

  // Load records and configuration
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [duesRes, configRes] = await Promise.all([
      getMembershipDuesAction(),
      getDuesTermConfigAction(),
    ])

    if (duesRes.success && duesRes.data) {
      setDues(duesRes.data)
    } else {
      toast(duesRes.error || 'Failed to fetch dues records', 'error')
    }

    if (configRes.success && configRes.data) {
      setTermConfig(configRes.data)
      setAcademicYear(configRes.data.activeAcademicYear)
      setSemester(configRes.data.activeSemester)
      setTermModalAY(configRes.data.activeAcademicYear)
      setTermModalSem(configRes.data.activeSemester)
      setTermModalYears(configRes.data.availableAcademicYears)
    }

    setIsLoading(false)
  }, [toast])

  // Initial load
  useEffect(() => {
    let active = true
    async function init() {
      const [duesRes, configRes] = await Promise.all([
        getMembershipDuesAction(),
        getDuesTermConfigAction(),
      ])

      if (active) {
        if (duesRes.success && duesRes.data) {
          setDues(duesRes.data)
        } else {
          toast(duesRes.error || 'Failed to fetch dues records', 'error')
        }

        if (configRes.success && configRes.data) {
          setTermConfig(configRes.data)
          setAcademicYear(configRes.data.activeAcademicYear)
          setSemester(configRes.data.activeSemester)
          setTermModalAY(configRes.data.activeAcademicYear)
          setTermModalSem(configRes.data.activeSemester)
          setTermModalYears(configRes.data.availableAcademicYears)
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
        selectedOfficer === 'all' ||
        (item.recorded_by && item.recorded_by.toLowerCase().includes(selectedOfficer.toLowerCase()))

      return (
        matchesSearch &&
        matchesYear &&
        matchesSection &&
        matchesAcademicYear &&
        matchesSemester &&
        matchesOfficer
      )
    })
  }, [
    dues,
    searchQuery,
    selectedYear,
    selectedSection,
    selectedAcademicYear,
    selectedSemester,
    selectedOfficer,
  ])

  // Quick statistics
  const stats = useMemo(() => {
    const totalCollected = dues.reduce(
      (acc, curr) => acc + (Number(curr.amount) || DEFAULT_MEMBERSHIP_FEE),
      0
    )
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

  // Open Unified Record Modal
  const handleOpenAddModal = () => {
    setFormError(null)
    setInputStudentName('')
    setQueuedStudents([])
    setRecordedBy(resolveDefaultOfficer(user))
    setAcademicYear(termConfig.activeAcademicYear)
    setSemester(termConfig.activeSemester)
    setShowModal(true)
  }

  // Queue Student from input
  const handleAddStudent = () => {
    const raw = inputStudentName.trim()
    if (!raw) return

    // If input contains newlines or commas with multiple names, parse batch
    const parsed = parseBatchStudentNames(raw)
    if (parsed.length > 0) {
      setQueuedStudents((prev) => {
        const existingLower = new Set(prev.map((n) => n.toLowerCase()))
        const toAdd = parsed.filter((n) => !existingLower.has(n.toLowerCase()))
        return [...prev, ...toAdd]
      })
      setInputStudentName('')
      setFormError(null)
    } else if (raw.length >= 2) {
      if (!queuedStudents.map((n) => n.toLowerCase()).includes(raw.toLowerCase())) {
        setQueuedStudents((prev) => [...prev, raw])
      }
      setInputStudentName('')
      setFormError(null)
    }
  }

  // Remove queued student
  const handleRemoveStudent = (index: number) => {
    setQueuedStudents((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle Input Keydown (Enter queues student)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddStudent()
    }
  }

  // Handle Paste directly into the student input
  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text && (text.includes('\n') || text.includes('\t') || text.split(',').length > 2)) {
      e.preventDefault()
      const parsed = parseBatchStudentNames(text)
      if (parsed.length > 0) {
        setQueuedStudents((prev) => {
          const existingLower = new Set(prev.map((n) => n.toLowerCase()))
          const toAdd = parsed.filter((n) => !existingLower.has(n.toLowerCase()))
          return [...prev, ...toAdd]
        })
        setInputStudentName('')
        setFormError(null)
        toast(`Parsed and queued ${parsed.length} student(s) from clipboard`, 'success')
      }
    }
  }

  // Handle Unified Submit
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Merge queued students with any pending typed name
    const finalStudents = [...queuedStudents]
    const pendingName = inputStudentName.trim()
    if (pendingName && !finalStudents.map((n) => n.toLowerCase()).includes(pendingName.toLowerCase())) {
      finalStudents.push(pendingName)
    }

    if (finalStudents.length === 0) {
      setFormError('Please enter at least one student name before recording.')
      return
    }

    setIsSubmitting(true)

    const res = await recordBatchMembershipDuesAction({
      rawNamesText: finalStudents.join('\n'),
      yearLevel,
      section: sectionLetter,
      academicYear,
      semester,
      recordedBy,
    })

    if (res.success && res.data) {
      const { recordedCount, skippedDuplicates, insertedRows, yearSection } = res.data

      if (insertedRows.length > 0) {
        setDues((prev) => [...insertedRows, ...prev])
      }

      setInputStudentName('')
      setQueuedStudents([])
      setShowModal(false)

      if (skippedDuplicates.length > 0) {
        setBatchResultModal(res.data)
        toast(
          `Recorded ${recordedCount} student(s) for ${yearSection}. ${skippedDuplicates.length} duplicate(s) skipped.`,
          'success'
        )
      } else {
        toast(
          `Successfully recorded ${recordedCount} student(s) for ${yearSection} (₱${(recordedCount * DEFAULT_MEMBERSHIP_FEE).toFixed(2)})!`,
          'success'
        )
      }
    } else {
      setFormError(res.error || 'Failed to record membership dues.')
    }

    setIsSubmitting(false)
  }

  // Open Term Management Modal
  const handleOpenTermModal = () => {
    setTermModalAY(termConfig.activeAcademicYear)
    setTermModalSem(termConfig.activeSemester)
    setTermModalYears(termConfig.availableAcademicYears)
    setNewCustomAY('')
    setShowTermModal(true)
  }

  // Handle Adding a new Custom Academic Year
  const handleAddCustomAY = () => {
    const clean = newCustomAY.trim().replace(/\s+/g, '')
    if (!clean) return
    if (!/^\d{4}-\d{4}$/.test(clean)) {
      toast('Format must be YYYY-YYYY (e.g. 2027-2028)', 'error')
      return
    }
    if (!termModalYears.includes(clean)) {
      const updated = [clean, ...termModalYears]
      setTermModalYears(updated)
      setTermModalAY(clean)
      setNewCustomAY('')
      toast(`Added ${clean} to selectable Academic Years`, 'success')
    } else {
      setTermModalAY(clean)
      setNewCustomAY('')
    }
  }

  // Handle Save Global Term Configuration
  const handleSaveTermConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingTerm(true)

    const res = await updateDuesTermConfigAction({
      activeAcademicYear: termModalAY,
      activeSemester: termModalSem,
      availableAcademicYears: termModalYears,
      updatedBy: user?.displayName,
    })

    if (res.success && res.data) {
      setTermConfig(res.data)
      setAcademicYear(res.data.activeAcademicYear)
      setSemester(res.data.activeSemester)
      toast(
        `Active term updated globally to A.Y. ${res.data.activeAcademicYear} (${res.data.activeSemester})`,
        'success'
      )
      setShowTermModal(false)
    } else {
      toast(res.error || 'Failed to update term configuration', 'error')
    }

    setIsSavingTerm(false)
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Page Header - Clean & Minimal (Single Action Button) */}
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

        {/* Action Buttons Row - Only One Recording Button */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/dues"
            target="_blank"
            className="h-10 px-3.5 rounded-xl text-xs font-mono tracking-wider uppercase border border-black/10 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Public Tracker</span>
          </Link>

          <button
            onClick={handleOpenAddModal}
            className="h-10 px-4 rounded-xl text-xs font-mono tracking-wider uppercase bg-gold hover:bg-gold-light text-black font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Dues</span>
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
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
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
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
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
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {stats.sectionsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-white/40 font-mono">/ 20 Sections</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-white/40 mt-1 block">
            BSIT Years 1–4 (Sections A–E)
          </span>
        </div>

        {/* Global Active Term Information & Officer Manager */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50">
              Active Term
            </span>
            <button
              onClick={handleOpenTermModal}
              className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded-lg border border-black/10 dark:border-white/10 text-slate-700 dark:text-white/70 hover:border-gold hover:text-gold transition-colors"
              title="Manage Academic Year and Semester"
            >
              <Settings className="w-3 h-3 text-gold" />
              <span>Manage</span>
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
              {termConfig.activeAcademicYear}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-500 dark:text-white/60 font-mono">
              {termConfig.activeSemester}
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                termConfig.isDatabaseBacked
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${termConfig.isDatabaseBacked ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span>{termConfig.isDatabaseBacked ? 'Cloud Sync' : 'Default'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/10 dark:border-white/10 space-y-3">
        {/* Row 1: Search Box & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student full name or section (e.g. BSIT 1-A)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputStyles} pl-10 text-xs h-9`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-white/70 shrink-0 flex items-center gap-1.5 text-xs font-mono"
            title="Refresh Dues List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gold' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Row 2: Uniform Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-black/5 dark:border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Academic Year
            </span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full h-9 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
            >
              <option value="all">All A.Y.</option>
              {termConfig.availableAcademicYears.map((ay) => (
                <option key={ay} value={ay}>
                  A.Y. {ay}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Semester
            </span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full h-9 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
            >
              <option value="all">All Semesters</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Year Level
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full h-9 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Section
            </span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full h-9 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
            >
              <option value="all">All Sections</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Officer
            </span>
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              className="w-full h-9 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-2 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
            >
              <option value="all">All Officers</option>
              {STANDARD_COLLECTING_OFFICERS.map((o) => (
                <option key={o.name} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Section Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar text-xs">
          <button
            onClick={() => {
              setSelectedYear('all')
              setSelectedSection('all')
            }}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all whitespace-nowrap ${
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gold text-black font-semibold'
                    : count > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40'
                }`}
              >
                <span>{sec}</span>
                <span
                  className={`text-[10px] px-1 rounded-md ${
                    isSelected
                      ? 'bg-black/20 text-black'
                      : 'bg-black/10 dark:bg-white/10'
                  }`}
                >
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
              : 'Click "+ Record Dues" above to add verified student payments.'}
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
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {row.student_name}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gold/10 text-gold border border-gold/20">
                        {row.year_section}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-white/60">
                      <div>A.Y. {row.academic_year}</div>
                      <div className="text-[10px] text-slate-400 dark:text-white/40">{row.semester}</div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-900 dark:text-white font-medium">
                      ₱{(Number(row.amount) || DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid</span>
                      </span>
                    </td>

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

                    <td className="px-4 py-3.5 text-slate-500 dark:text-white/50 font-mono text-[11px]">
                      {row.paid_at
                        ? new Date(row.paid_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>

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

          {/* Mobile Card View */}
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

      {/* Unified Record Payment Modal (Streamlined & Minimalist) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[88vh] flex flex-col bg-white dark:bg-[#111111] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-black/10 dark:border-white/10 shrink-0 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-semibold">
                  Official Ledger Entry
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Record Membership Dues
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              <form id="dues-unified-form" onSubmit={handleUnifiedSubmit} className="space-y-4">
                {/* Target Section Picker */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 dark:text-white/50 text-[11px] uppercase tracking-wider">
                      Target Section:
                    </span>
                    <span className="font-mono font-bold px-2.5 py-0.5 rounded-md bg-gold/15 text-gold border border-gold/30">
                      {computedSectionTag}
                    </span>
                  </div>

                  {/* Year Level Buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 block">
                      Year Level
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {YEAR_LEVELS.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => setYearLevel(y)}
                          className={`h-8.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                            yearLevel === y
                              ? 'bg-gold text-black font-bold border-gold shadow-xs'
                              : 'bg-white dark:bg-[#181818] text-slate-600 dark:text-white/70 border-black/10 dark:border-white/10 hover:border-gold/50'
                          }`}
                        >
                          {y === 1 ? '1st Year' : y === 2 ? '2nd Year' : y === 3 ? '3rd Year' : '4th Year'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section Letter Buttons */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 block">
                      Section
                    </span>
                    <div className="grid grid-cols-5 gap-2">
                      {SECTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSectionLetter(s)}
                          className={`h-8.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                            sectionLetter === s
                              ? 'bg-gold text-black font-bold border-gold shadow-xs'
                              : 'bg-white dark:bg-[#181818] text-slate-600 dark:text-white/70 border-black/10 dark:border-white/10 hover:border-gold/50'
                          }`}
                        >
                          Sec {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Term & Collecting Officer Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1">
                      Active Term
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full h-9 bg-slate-50 dark:bg-[#181818] border border-black/10 dark:border-white/10 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                      >
                        {termConfig.availableAcademicYears.map((ay) => (
                          <option key={ay} value={ay}>
                            A.Y. {ay}
                          </option>
                        ))}
                      </select>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full h-9 bg-slate-50 dark:bg-[#181818] border border-black/10 dark:border-white/10 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                      >
                        {SEMESTERS.map((sem) => (
                          <option key={sem} value={sem}>
                            {sem}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 mb-1">
                      Recording As
                    </label>
                    <div className="w-full h-9 bg-slate-50 dark:bg-[#181818] border border-black/10 dark:border-white/10 rounded-lg px-2.5 text-xs text-slate-900 dark:text-white flex items-center font-mono">
                      {recordedBy}
                    </div>
                  </div>
                </div>

                {/* Minimalist Student Entry with Inline Plus Sign (+) Button */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-slate-700 dark:text-white/80 font-medium flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gold" />
                      <span>Student Full Name</span>
                    </label>

                    {allActiveStudents.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ⚡ {allActiveStudents.length} {allActiveStudents.length === 1 ? 'Student' : 'Students'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-white/50">
                          ₱{(allActiveStudents.length * DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Input field with right-aligned + Add button */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Juan Dela Cruz (or paste a roster list)"
                      value={inputStudentName}
                      onChange={(e) => {
                        setInputStudentName(e.target.value)
                        if (formError) setFormError(null)
                      }}
                      onKeyDown={handleInputKeyDown}
                      onPaste={handleInputPaste}
                      className="w-full h-11 pl-3.5 pr-20 font-mono text-xs rounded-xl bg-slate-50 dark:bg-[#181818] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white outline-none focus:border-gold"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      disabled={!inputStudentName.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-2.5 rounded-lg bg-gold hover:bg-gold-light text-black font-mono font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40"
                      title="Add to student list (or press Enter)"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Plus Sign / Quick Hint Below Placeholder */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-white/40 pt-0.5">
                    <span className="flex items-center gap-1">
                      <span>Press</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px] text-slate-600 dark:text-white/60">
                        Enter ↵
                      </kbd>
                      <span>or click</span>
                      <span className="font-bold text-gold">+ Add</span>
                      <span>to queue.</span>
                    </span>

                    {queuedStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQueuedStudents([])}
                        className="text-red-500 hover:underline text-[10px] font-mono shrink-0 ml-2"
                      >
                        Clear List
                      </button>
                    )}
                  </div>

                  {/* Queued Student Badges / Chips */}
                  {queuedStudents.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-2 mt-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-white/40">
                        <span>Queued for {computedSectionTag} ({queuedStudents.length}):</span>
                        <span className="text-gold font-bold">
                          ₱{(queuedStudents.length * DEFAULT_MEMBERSHIP_FEE).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {queuedStudents.map((name, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-[#181818] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white/90 shadow-2xs"
                          >
                            <span>{name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(index)}
                              className="p-0.5 rounded hover:bg-red-500/10 hover:text-red-500 text-slate-400 dark:text-white/40 transition-colors"
                              title="Remove student"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Error Banner */}
                {formError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Sticky Fixed Footer */}
            <div className="px-6 py-4 border-t border-black/10 dark:border-white/10 shrink-0 bg-slate-50/90 dark:bg-[#0e0e0e]/90 backdrop-blur-md flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-10 px-4 rounded-xl text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="dues-unified-form"
                disabled={isSubmitting || allActiveStudents.length === 0}
                className="h-10 px-5 rounded-xl text-xs font-mono uppercase tracking-wider bg-gold hover:bg-gold-light text-black font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Recording...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {allActiveStudents.length <= 1
                        ? `Confirm & Record (₱${DEFAULT_MEMBERSHIP_FEE.toFixed(2)})`
                        : `Confirm & Record ${allActiveStudents.length} Students (₱${(allActiveStudents.length * DEFAULT_MEMBERSHIP_FEE).toFixed(2)})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Term Management Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-semibold flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-gold" />
                  <span>Global Term Management</span>
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Active Academic Year & Sem
                </h3>
              </div>
              <button
                onClick={() => setShowTermModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermConfig} className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-white/60">
                Sets the active operational term for officers and defaults the public transparency ledger view.
              </p>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-white/50 mb-1">
                  Active Academic Year
                </label>
                <select
                  value={termModalAY}
                  onChange={(e) => setTermModalAY(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  {termModalYears.map((ay) => (
                    <option key={ay} value={ay}>
                      A.Y. {ay}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-500 dark:text-white/40 block">
                  Add New Academic Year (e.g. 2027-2028):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="YYYY-YYYY (e.g. 2027-2028)"
                    value={newCustomAY}
                    onChange={(e) => setNewCustomAY(e.target.value)}
                    className={`${inputStyles} text-xs font-mono flex-1 h-9`}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAY}
                    className="h-9 px-3.5 rounded-lg text-xs font-mono uppercase bg-slate-100 dark:bg-white/10 hover:bg-gold hover:text-black font-semibold transition-all shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-white/50 mb-1">
                  Active Semester
                </label>
                <select
                  value={termModalSem}
                  onChange={(e) => setTermModalSem(e.target.value)}
                  className="w-full h-10 bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-gold"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>


              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="h-9 px-4 rounded-lg text-xs font-mono uppercase text-slate-600 dark:text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTerm}
                  className="h-9 flex items-center gap-2 px-5 rounded-lg text-xs font-mono uppercase tracking-wider bg-gold hover:bg-gold-light text-black font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingTerm ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Active Term</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Result Details Modal */}
      {batchResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Batch Recording Complete
                </h3>
                <span className="text-xs text-slate-500 dark:text-white/50 font-mono">
                  {batchResultModal.yearSection} ({batchResultModal.academicYear} · {batchResultModal.semester})
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                ✅ Successfully recorded {batchResultModal.recordedCount} student(s) as paid (₱{(batchResultModal.recordedCount * DEFAULT_MEMBERSHIP_FEE).toFixed(2)}).
              </div>

              {batchResultModal.skippedDuplicates.length > 0 && (
                <div className="space-y-2">
                  <span className="font-mono text-slate-500 dark:text-white/50 text-[11px] block">
                    ⚠️ {batchResultModal.skippedDuplicates.length} student(s) skipped (already paid for this term):
                  </span>
                  <div className="max-h-36 overflow-y-auto p-2.5 rounded-lg bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-1">
                    {batchResultModal.skippedDuplicates.map((name, i) => (
                      <div
                        key={i}
                        className="font-mono text-[11px] text-slate-700 dark:text-white/70 flex items-center gap-1.5"
                      >
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setBatchResultModal(null)}
                className="h-9 px-4 rounded-lg text-xs font-mono uppercase bg-gold hover:bg-gold-light text-black font-semibold shadow-sm transition-all"
              >
                Done
              </button>
            </div>
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
                className="h-9 px-4 rounded-lg text-xs font-mono uppercase text-slate-600 dark:text-white/60 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="h-9 px-4 rounded-lg text-xs font-mono uppercase bg-red-600 hover:bg-red-500 text-white font-semibold shadow-sm transition-all"
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
