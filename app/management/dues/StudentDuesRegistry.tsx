'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, CheckCircle2, Circle, Users, ArrowUpDown } from 'lucide-react'
import { inputStyles } from '../_components/FormField'
import { DuesTableSkeleton, DuesPageSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import { useAuth } from '../_context/auth-context'
import {
  getStudentsWithDuesStatusAction,
  toggleStudentPaymentAction,
  batchToggleStudentPaymentsAction,
  type StudentWithDuesStatus,
} from './actions'

interface StudentDuesRegistryProps {
  academicYear: string
  semester: string
}

export default function StudentDuesRegistry({ academicYear, semester }: StudentDuesRegistryProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [students, setStudents] = useState<StudentWithDuesStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [showPaidOnly, setShowPaidOnly] = useState(false)
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const [sortBy] = useState<'name' | 'studentNo' | 'section' | 'status'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Load students with payment status
  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    const yearLevel = selectedYear === 'all' ? undefined : parseInt(selectedYear, 10)
    const section = selectedSection === 'all' ? undefined : selectedSection

    const res = await getStudentsWithDuesStatusAction({
      academicYear,
      semester,
      yearLevel,
      section,
    })

    if (res.success && res.data) {
      setStudents(res.data)
    } else {
      toast(res.error || 'Failed to load students', 'error')
      setStudents([])
    }
    setIsLoading(false)
  }, [academicYear, semester, selectedYear, selectedSection, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStudents()
  }, [loadStudents])

  // Filter students based on search and payment status
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        student.student_no.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        student.year_section.toLowerCase().includes(searchQuery.toLowerCase().trim())

      const matchesPaidFilter =
        (!showPaidOnly && !showUnpaidOnly) ||
        (showPaidOnly && student.has_paid) ||
        (showUnpaidOnly && !student.has_paid)

      return matchesSearch && matchesPaidFilter
    })
  }, [students, searchQuery, showPaidOnly, showUnpaidOnly])

  // Sort filtered students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents]
    
    sorted.sort((a, b) => {
      let compareResult = 0
      
      switch (sortBy) {
        case 'name':
          compareResult = a.full_name.localeCompare(b.full_name)
          break
        case 'studentNo':
          compareResult = a.student_no.localeCompare(b.student_no)
          break
        case 'section':
          // Sort by year_section (e.g., "BSIT 1-A")
          compareResult = a.year_section.localeCompare(b.year_section)
          break
        case 'status':
          // Paid first or unpaid first based on sort order
          compareResult = (a.has_paid === b.has_paid) ? 0 : a.has_paid ? -1 : 1
          break
        default:
          compareResult = 0
      }
      
      return sortOrder === 'asc' ? compareResult : -compareResult
    })
    
    return sorted
  }, [filteredStudents, sortBy, sortOrder])

  // Statistics
  const stats = useMemo(() => {
    const totalStudents = students.length
    const paidCount = students.filter((s) => s.has_paid).length
    const unpaidCount = totalStudents - paidCount
    const paidPercentage = totalStudents > 0 ? (paidCount / totalStudents) * 100 : 0

    return {
      totalStudents,
      paidCount,
      unpaidCount,
      paidPercentage,
    }
  }, [students])

  // Toggle individual student payment
  const handleTogglePayment = async (student: StudentWithDuesStatus) => {
    const shouldBePaid = !student.has_paid

    const res = await toggleStudentPaymentAction({
      studentId: student.id,
      studentName: student.full_name,
      studentNameNormalized: student.full_name_normalized,
      yearLevel: student.year_level,
      section: student.section,
      yearSection: student.year_section,
      academicYear,
      semester,
      recordedBy: user?.displayName || 'Officer',
      shouldBePaid,
    })

    if (res.success) {
      // Update local state
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id ? { ...s, has_paid: shouldBePaid } : s
        )
      )
      toast(
        shouldBePaid
          ? `✓ ${student.full_name} marked as paid`
          : `○ ${student.full_name} marked as unpaid`,
        'success'
      )
    } else {
      toast(res.error || 'Failed to update payment status', 'error')
    }
  }

  // Select/deselect student
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(studentId)) {
        newSet.delete(studentId)
      } else {
        newSet.add(studentId)
      }
      return newSet
    })
  }

  // Select all filtered students
  const handleSelectAll = () => {
    if (selectedStudents.size === sortedStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(sortedStudents.map((s) => s.id)))
    }
  }

  // Batch mark as paid
  const handleBatchMarkAsPaid = async () => {
    if (selectedStudents.size === 0) {
      toast('No students selected', 'error')
      return
    }

    setIsUpdating(true)

    const studentsToUpdate = students
      .filter((s) => selectedStudents.has(s.id))
      .map((s) => ({
        studentId: s.id,
        studentName: s.full_name,
        studentNameNormalized: s.full_name_normalized,
        yearLevel: s.year_level,
        section: s.section,
        yearSection: s.year_section,
        shouldBePaid: true,
      }))

    const res = await batchToggleStudentPaymentsAction({
      students: studentsToUpdate,
      academicYear,
      semester,
      recordedBy: user?.displayName || 'Officer',
    })

    if (res.success && res.data) {
      await loadStudents()
      setSelectedStudents(new Set())
      toast(`✓ Marked ${res.data.paidCount} student(s) as paid`, 'success')
    } else {
      toast(res.error || 'Failed to update payments', 'error')
    }

    setIsUpdating(false)
  }

  // Batch mark as unpaid
  const handleBatchMarkAsUnpaid = async () => {
    if (selectedStudents.size === 0) {
      toast('No students selected', 'error')
      return
    }

    setIsUpdating(true)

    const studentsToUpdate = students
      .filter((s) => selectedStudents.has(s.id))
      .map((s) => ({
        studentId: s.id,
        studentName: s.full_name,
        studentNameNormalized: s.full_name_normalized,
        yearLevel: s.year_level,
        section: s.section,
        yearSection: s.year_section,
        shouldBePaid: false,
      }))

    const res = await batchToggleStudentPaymentsAction({
      students: studentsToUpdate,
      academicYear,
      semester,
      recordedBy: user?.displayName || 'Officer',
    })

    if (res.success && res.data) {
      await loadStudents()
      setSelectedStudents(new Set())
      toast(`○ Marked ${res.data.unpaidCount} student(s) as unpaid`, 'success')
    } else {
      toast(res.error || 'Failed to update payments', 'error')
    }

    setIsUpdating(false)
  }

  if (isLoading && students.length === 0) {
    return <DuesPageSkeleton />
  }

  return (
    <div className="space-y-5">
      {/* Executive Minimalist Stats Ribbon */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 backdrop-blur-sm shadow-2xs">
        {/* Total Population */}
        <div className="flex items-center gap-2.5 sm:gap-3 col-span-1">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Enrolled Roster
            </span>
            <span className="text-sm sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
              {stats.totalStudents}{' '}
              <span className="text-xs font-normal text-slate-400 dark:text-white/40 hidden xs:inline">students</span>
            </span>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-black/5 dark:bg-white/10" />

        {/* Unpaid / Pending Balance (sits beside Enrolled Roster on mobile) */}
        <div className="flex items-center gap-2.5 sm:gap-3 col-span-1 justify-self-end md:justify-self-auto order-2 md:order-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Circle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
              Pending Balance
            </span>
            <span className="text-sm sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              ₱{(stats.unpaidCount * 25).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400 dark:text-white/40 hidden xs:inline">
                ({stats.unpaidCount})
              </span>
            </span>
          </div>
        </div>

        <div className="hidden md:block w-px h-8 bg-black/5 dark:bg-white/10" />

        {/* Paid / Collection Metric with Hairline Progress (spans full width on mobile) */}
        <div className="col-span-2 md:col-span-1 md:flex-1 w-full min-w-0 md:min-w-[200px] md:max-w-sm order-3 md:order-2 pt-2 md:pt-0 border-t border-black/5 dark:border-white/5 md:border-t-0">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{stats.paidCount} Paid</span>
              <span className="text-slate-400 font-normal">
                (₱{(stats.paidCount * 25).toLocaleString()})
              </span>
            </span>
            <span className="text-slate-500 dark:text-white/50 shrink-0">
              {stats.paidPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${stats.paidPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modern Command Search & Segmented Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
        {/* Search Bar with Keyboard Hint */}
        <div className="relative">
          <Search className="w-4 h-4 text-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Quick search by student name, ID number, or section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${inputStyles} pl-10 pr-16 text-xs h-9.5 rounded-xl`}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs font-mono cursor-pointer"
            >
              Clear
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-white/30 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/10 hidden sm:inline">
              /
            </kbd>
          )}
        </div>

        {/* Segmented Filter Pills (touch-friendly horizontal slider on mobile) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
            {/* Year Level Segmented Buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              {['all', '1', '2', '3', '4'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {yr === 'all' ? 'All Years' : `Year ${yr}`}
                </button>
              ))}
            </div>

            {/* Section Segmented Buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              {['all', 'A', 'B', 'C', 'D', 'E'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    selectedSection === sec
                      ? 'bg-gold text-black font-bold shadow-xs'
                      : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sec === 'all' ? 'All Sec' : `Sec ${sec}`}
                </button>
              ))}
            </div>

            {/* Payment Status Segmented Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              <button
                onClick={() => {
                  setShowPaidOnly(false)
                  setShowUnpaidOnly(false)
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  !showPaidOnly && !showUnpaidOnly
                    ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setShowPaidOnly(true)
                  setShowUnpaidOnly(false)
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  showPaidOnly
                    ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Paid ({stats.paidCount})</span>
              </button>
              <button
                onClick={() => {
                  setShowUnpaidOnly(true)
                  setShowPaidOnly(false)
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  showUnpaidOnly
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-500'
                }`}
              >
                <Circle className="w-3 h-3" />
                <span>Unpaid ({stats.unpaidCount})</span>
              </button>
            </div>
          </div>

          {/* Sort & Result Counter */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto pt-1 md:pt-0 border-t border-black/5 dark:border-white/5 md:border-t-0">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-7 px-2.5 rounded-lg border border-black/10 dark:border-white/10 text-[11px] font-mono text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown className="w-3 h-3 text-gold" />
              <span>{sortBy === 'name' ? 'Name' : sortBy} ({sortOrder === 'asc' ? '↑' : '↓'})</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">
              {sortedStudents.length} of {students.length}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Batch Actions Dock (Slides up smoothly when students are selected) */}
      {selectedStudents.size > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-[#141414]/95 border border-gold/40 shadow-2xl rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-[calc(100vw-24px)] w-auto">
          <span className="text-xs font-mono text-white font-semibold pr-2 border-r border-white/15 shrink-0">
            {selectedStudents.size} <span className="hidden xs:inline">sel</span>
          </span>
          <button
            onClick={handleBatchMarkAsPaid}
            disabled={isUpdating}
            className="h-8 px-2.5 sm:px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] sm:text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Paid</span>
          </button>
          <button
            onClick={handleBatchMarkAsUnpaid}
            disabled={isUpdating}
            className="h-8 px-2.5 sm:px-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] sm:text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Circle className="w-3.5 h-3.5" />
            <span>Mark Unpaid</span>
          </button>
          <button
            onClick={() => setSelectedStudents(new Set())}
            className="h-8 px-2 sm:px-2.5 rounded-lg text-xs font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Minimalist Students List */}
      {isLoading ? (
        <DuesTableSkeleton rows={8} />
      ) : sortedStudents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
          <Users className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No students found
          </h3>
          <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
            {searchQuery
              ? 'Try adjusting your search keyword or clearing the filters.'
              : 'No students match the selected filter combination.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden bg-white dark:bg-[#0d0d0d] shadow-xs">
          {/* Header Bar with Select All */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 text-[11px] font-mono text-slate-500 dark:text-white/40">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedStudents.size === sortedStudents.length && sortedStudents.length > 0}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 rounded text-gold focus:ring-gold"
              />
              <span className="uppercase tracking-wider">Select All ({sortedStudents.length})</span>
            </label>
            <span className="hidden sm:inline">Click toggle button to record or revert settlement</span>
          </div>

          {/* Student Rows */}
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {sortedStudents.map((student) => (
              <div
                key={student.id}
                className={`flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 transition-colors ${
                  selectedStudents.has(student.id)
                    ? 'bg-gold/5 dark:bg-gold/[0.04]'
                    : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
                }`}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedStudents.has(student.id)}
                  onChange={() => handleSelectStudent(student.id)}
                  className="w-3.5 h-3.5 rounded text-gold focus:ring-gold cursor-pointer shrink-0"
                />

                {/* Student Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {student.full_name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-medium shrink-0">
                      {student.year_section}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-white/35 font-mono">
                    {student.student_no}
                  </span>
                </div>

                {/* Tactile Toggle Button */}
                <button
                  onClick={() => handleTogglePayment(student)}
                  className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer select-none shrink-0 ${
                    student.has_paid
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border border-black/5 dark:border-white/10 hover:border-gold hover:text-gold'
                  }`}
                  title={student.has_paid ? 'Click to mark as unpaid' : 'Click to mark as paid'}
                >
                  {student.has_paid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-bold">Paid</span>
                      <span className="font-bold text-[10px] opacity-75 hidden xs:inline">· ₱25</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 shrink-0" />
                      <span>Unpaid</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

