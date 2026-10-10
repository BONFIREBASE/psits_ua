'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Hash,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  UserCheck,
} from 'lucide-react'
import { inputStyles } from '../_components/FormField'
import { DuesTableSkeleton, DuesPageSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import {
  getStudentRegistryAction,
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  type StudentRegistryData,
  type StudentRegistryStudent,
} from './actions'

interface StudentDirectoryViewProps {
  academicYear: string
  semester: string
}

function SortIcon({
  field,
  sortField,
  sortAsc,
}: {
  field: string
  sortField: string
  sortAsc: boolean
}) {
  if (sortField !== field) return null
  return sortAsc ? (
    <ChevronUp className="w-3 h-3 inline-block ml-0.5" />
  ) : (
    <ChevronDown className="w-3 h-3 inline-block ml-0.5" />
  )
}

export default function StudentDirectoryView({
  academicYear,
  semester,
}: StudentDirectoryViewProps) {
  const { toast } = useToast()

  const [data, setData] = useState<StudentRegistryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [duesFilter, setDuesFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [sortField, setSortField] = useState<'name' | 'student_no' | 'section'>('name')
  const [sortAsc, setSortAsc] = useState(true)

  // CRUD Modal States
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentRegistryStudent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudentRegistryStudent | null>(null)
  const [deleteType, setDeleteType] = useState<'archive' | 'permanent'>('archive')

  // Form Fields
  const [formStudentNo, setFormStudentNo] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formYearLevel, setFormYearLevel] = useState<number>(1)
  const [formSection, setFormSection] = useState<string>('A')
  const [formIsActive, setFormIsActive] = useState<boolean>(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    const res = await getStudentRegistryAction({
      academicYear,
      semester,
      status: statusFilter,
    })
    if (res.success && res.data) {
      setData(res.data)
    } else {
      toast(res.error || 'Failed to load student registry', 'error')
    }
    setIsLoading(false)
  }, [academicYear, semester, statusFilter, toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormStudentNo('')
    setFormFullName('')
    setFormYearLevel(1)
    setFormSection('A')
    setFormIsActive(true)
    setSelectedStudent(null)
    setShowModal('add')
  }

  // Open Edit Modal
  const handleOpenEdit = (student: StudentRegistryStudent) => {
    setSelectedStudent(student)
    setFormStudentNo(student.student_no)
    setFormFullName(student.full_name)
    setFormYearLevel(student.year_level)
    setFormSection(student.section)
    setFormIsActive(student.is_active ?? true)
    setShowModal('edit')
  }

  // Handle Quick Reactivate for Returning / Moved-In Student
  const handleReactivateStudent = async (student: StudentRegistryStudent) => {
    try {
      const res = await updateStudentAction({
        studentId: student.id,
        studentNo: student.student_no,
        fullName: student.full_name,
        yearLevel: student.year_level,
        section: student.section,
        isActive: true,
        activeAcademicYear: academicYear,
        activeSemester: semester,
      })
      if (res.success) {
        toast(`✓ ${student.full_name} successfully re-enrolled for ${academicYear}`, 'success')
        await loadData()
      } else {
        toast(res.error || 'Failed to reactivate student', 'error')
      }
    } catch {
      toast('Failed to reactivate student', 'error')
    }
  }

  // Handle Save (Add or Update)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formStudentNo.trim()) {
      toast('Student ID number is required', 'error')
      return
    }
    if (!formFullName.trim() || formFullName.trim().length < 2) {
      toast('Student full name is required', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      if (showModal === 'add') {
        const res = await createStudentAction({
          studentNo: formStudentNo.trim(),
          fullName: formFullName.trim(),
          yearLevel: formYearLevel,
          section: formSection,
        })
        if (res.success) {
          toast(`✓ ${formFullName.trim()} successfully added to the registry`, 'success')
          setShowModal(null)
          await loadData()
        } else {
          toast(res.error || 'Failed to add student', 'error')
        }
      } else if (showModal === 'edit' && selectedStudent) {
        const res = await updateStudentAction({
          studentId: selectedStudent.id,
          studentNo: formStudentNo.trim(),
          fullName: formFullName.trim(),
          yearLevel: formYearLevel,
          section: formSection,
          isActive: formIsActive,
          activeAcademicYear: academicYear,
          activeSemester: semester,
        })
        if (res.success) {
          toast(`✓ ${formFullName.trim()} updated successfully`, 'success')
          setShowModal(null)
          await loadData()
        } else {
          toast(res.error || 'Failed to update student', 'error')
        }
      }
    } catch {
      toast('An unexpected error occurred while saving', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Delete Modal
  const handleOpenDelete = (student: StudentRegistryStudent) => {
    setDeleteTarget(student)
    setDeleteType('archive')
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await deleteStudentAction({
        studentId: deleteTarget.id,
        permanent: deleteType === 'permanent',
      })
      if (res.success) {
        toast(
          deleteType === 'permanent'
            ? `✓ ${deleteTarget.full_name} permanently removed`
            : `✓ ${deleteTarget.full_name} marked as dropped / archived`,
          'success'
        )
        setDeleteTarget(null)
        await loadData()
      } else {
        toast(res.error || 'Failed to remove student', 'error')
      }
    } catch {
      toast('An error occurred during removal', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    if (!data) return []

    let list = data.students

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          s.student_no.toLowerCase().includes(q) ||
          s.year_section.toLowerCase().includes(q)
      )
    }

    // Year level filter
    if (selectedYearLevel !== 'all') {
      list = list.filter((s) => String(s.year_level) === selectedYearLevel)
    }

    // Section filter
    if (selectedSection !== 'all') {
      list = list.filter((s) => s.section === selectedSection)
    }

    // Dues status filter
    if (duesFilter === 'paid') {
      list = list.filter((s) => s.has_paid_current_term)
    } else if (duesFilter === 'unpaid') {
      list = list.filter((s) => !s.has_paid_current_term)
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.full_name.localeCompare(b.full_name)
      } else if (sortField === 'student_no') {
        cmp = a.student_no.localeCompare(b.student_no)
      } else if (sortField === 'section') {
        cmp = a.year_section.localeCompare(b.year_section) || a.full_name.localeCompare(b.full_name)
      }
      return sortAsc ? cmp : -cmp
    })

    return list
  }, [data, searchQuery, selectedYearLevel, selectedSection, duesFilter, sortField, sortAsc])

  // Stats
  const paidCount = useMemo(() => {
    if (!data) return 0
    return filteredStudents.filter((s) => s.has_paid_current_term).length
  }, [data, filteredStudents])

  const unpaidCount = useMemo(() => {
    return filteredStudents.length - paidCount
  }, [filteredStudents, paidCount])

  // Available sections
  const availableSections = useMemo(() => {
    if (!data) return ['A', 'B', 'C', 'D', 'E']
    const sections = new Set(data.students.map((s) => s.section))
    return Array.from(sections).sort()
  }, [data])

  const handleSort = (field: 'name' | 'student_no' | 'section') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  if (isLoading && !data) {
    return <DuesPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Executive Population Ribbon */}
      {data && (
        <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 shadow-2xs">
          {/* Total Enrolled Metric */}
          <div className="flex items-center gap-2.5 sm:gap-3 col-span-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
                Total Enrolled
              </span>
              <span className="text-sm sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
                {data.stats.totalStudents}{' '}
                <span className="text-xs font-normal text-slate-400 dark:text-white/40 hidden xs:inline">
                  ({data.stats.bySectionCount.length} sections)
                </span>
              </span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-8 bg-black/5 dark:bg-white/10" />

          {/* Unpaid / Pending Balance */}
          <div className="flex items-center gap-2.5 sm:gap-3 col-span-1 justify-self-end lg:justify-self-auto order-2 lg:order-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-white/40 block">
                Pending Dues
              </span>
              <span className="text-sm sm:text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                ₱{(unpaidCount * 25).toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400 dark:text-white/40 hidden xs:inline">
                  ({unpaidCount})
                </span>
              </span>
            </div>
          </div>

          <div className="hidden lg:block w-px h-8 bg-black/5 dark:bg-white/10" />

          {/* Dues Collection Metric with Hairline Progress */}
          <div className="col-span-2 lg:col-span-1 lg:flex-1 w-full min-w-0 lg:min-w-[200px] lg:max-w-sm order-3 lg:order-2 pt-2 lg:pt-0 border-t border-black/5 dark:border-white/5 lg:border-t-0">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{paidCount} Paid</span>
                <span className="text-slate-400 font-normal">
                  (₱{(paidCount * 25).toLocaleString()})
                </span>
              </span>
              <span className="text-slate-500 dark:text-white/50 shrink-0">
                {data.stats.totalStudents > 0
                  ? Math.round((paidCount / data.stats.totalStudents) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    data.stats.totalStudents > 0
                      ? (paidCount / data.stats.totalStudents) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="hidden lg:block w-px h-8 bg-black/5 dark:bg-white/10" />

          {/* Quick Year Level Distribution (scrollable pills on mobile) */}
          <div className="col-span-2 lg:col-span-auto flex items-center gap-1.5 order-4 overflow-x-auto pb-0.5 no-scrollbar w-full lg:w-auto">
            {data.stats.byYearLevel.map((yl) => {
              const isSelected = selectedYearLevel === String(yl.year)
              return (
                <button
                  key={yl.year}
                  onClick={() => {
                    setSelectedYearLevel(isSelected ? 'all' : String(yl.year))
                    setSelectedSection('all')
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'border-gold bg-gold/10 text-gold-dark dark:text-gold font-bold shadow-xs'
                      : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-slate-600 dark:text-white/60 hover:border-black/15 dark:hover:border-white/15'
                  }`}
                  title={`Filter Year ${yl.year}`}
                >
                  <span className="text-[10px] font-mono uppercase block leading-none">
                    Y{yl.year}
                  </span>
                  <span className="text-xs font-bold font-mono">{yl.count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Modern Command Search & Segmented Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
        {/* Search Bar + Add Student Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, ID number, or section..."
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

          <button
            type="button"
            onClick={handleOpenAdd}
            className="h-9.5 px-3.5 rounded-xl text-xs font-mono uppercase tracking-wider font-bold bg-gold hover:bg-gold-light text-black flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Filter Controls Row (touch-friendly horizontal slider on mobile) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full xl:w-auto">
            {/* Year Segmented Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              {['all', '1', '2', '3', '4'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => {
                    setSelectedYearLevel(yr)
                    setSelectedSection('all')
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedYearLevel === yr
                      ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {yr === 'all' ? 'All Years' : `Year ${yr}`}
                </button>
              ))}
            </div>

            {/* Section Segmented Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              {['all', ...availableSections].map((sec) => (
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

            {/* Enrollment Status Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'active'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Active ({data?.stats.totalActive ?? 0})</span>
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'inactive'
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Dropped ({data?.stats.totalInactive ?? 0})</span>
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Dues Status Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-black/5 dark:bg-white/5 rounded-lg text-xs font-mono shrink-0">
              <button
                onClick={() => setDuesFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  duesFilter === 'all'
                    ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDuesFilter('paid')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  duesFilter === 'paid'
                    ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Paid ({paidCount})</span>
              </button>
              <button
                onClick={() => setDuesFilter('unpaid')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  duesFilter === 'unpaid'
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'text-amber-600 dark:text-amber-400 hover:text-amber-500'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>Unpaid ({unpaidCount})</span>
              </button>
            </div>
          </div>

          {/* Result Count Badge */}
          <div className="text-[11px] font-mono text-slate-500 dark:text-white/40 ml-auto pt-1 xl:pt-0">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Section Quick Chips (when a year is selected) */}
        {data && selectedYearLevel !== 'all' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-black/5 dark:border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/30 mr-1 shrink-0">
              Year {selectedYearLevel} Sections:
            </span>
            {data.stats.bySectionCount
              .filter((sc) => sc.yearSection.startsWith(`${selectedYearLevel}-`))
              .map((sc) => {
                const sec = sc.yearSection.split('-')[1]
                const paidInSec = data.students.filter(
                  (s) => s.year_section === sc.yearSection && s.has_paid_current_term
                ).length
                const isSelected = selectedSection === sec

                return (
                  <button
                    key={sc.yearSection}
                    onClick={() => setSelectedSection(isSelected ? 'all' : sec!)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-gold text-black font-semibold shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <span>{sc.yearSection}</span>
                    <span
                      className={`text-[10px] px-1 rounded-md ${
                        isSelected ? 'bg-black/20' : 'bg-black/10 dark:bg-white/10'
                      }`}
                    >
                      {paidInSec}/{sc.count}
                    </span>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {/* Students Table */}
      {isLoading ? (
        <DuesTableSkeleton rows={8} />
      ) : filteredStudents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
          <Users className="w-12 h-12 text-slate-300 dark:text-white/20 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No Students Found
          </h3>
          <p className="text-sm text-slate-500 dark:text-white/50 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'Try a different search query or clear filters.'
              : 'No students loaded yet. Click "+ Add Student" to register one.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gold text-black hover:bg-gold-light transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Student
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden bg-white dark:bg-[#0c0c0c] shadow-xs">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-black/10 dark:border-white/10 text-slate-500 dark:text-white/50 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">#</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gold transition-colors select-none"
                    onClick={() => handleSort('student_no')}
                  >
                    Student No.
                    <SortIcon field="student_no" sortField={sortField} sortAsc={sortAsc} />
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gold transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    Full Name
                    <SortIcon field="name" sortField={sortField} sortAsc={sortAsc} />
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gold transition-colors select-none"
                    onClick={() => handleSort('section')}
                  >
                    Year & Section
                    <SortIcon field="section" sortField={sortField} sortAsc={sortAsc} />
                  </th>
                  <th className="px-4 py-3 text-center">Dues Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {filteredStudents.map((student, idx) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-[11px] text-slate-400 dark:text-white/30 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-slate-400 dark:text-white/25" />
                        <span className="font-mono text-slate-700 dark:text-white/80 text-[12px]">
                          {student.student_no}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900 dark:text-white text-[13px]">
                        {student.full_name}
                      </span>
                      {student.is_active === false && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-500">
                          Dropped
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-medium">
                        {student.year_section}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.has_paid_current_term ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-medium">
                          <XCircle className="w-3 h-3" />
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!student.is_active && (
                          <button
                            type="button"
                            onClick={() => handleReactivateStudent(student)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                            title="Reactivate / Re-enroll Student for this term"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(student)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete / Drop Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
            {filteredStudents.map((student, idx) => (
              <div key={student.id} className="p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-white/40 font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                    {student.full_name}
                  </p>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                    <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-white/50">
                      {student.student_no}
                    </span>
                    <span className="text-[10px] font-mono text-blue-500 font-medium">
                      {student.year_section}
                    </span>
                    {student.is_active === false && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/10 font-mono text-red-400">Dropped</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {student.has_paid_current_term ? (
                    <span className="p-1" title="Dues Settled">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
                    </span>
                  ) : (
                    <span className="p-1" title="Pending Dues">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                    </span>
                  )}
                  {!student.is_active && (
                    <button
                      type="button"
                      onClick={() => handleReactivateStudent(student)}
                      className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                      title="Reactivate"
                    >
                      <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(student)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(student)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                    title="Delete / Drop"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                  {showModal === 'add' ? <Plus className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {showModal === 'add' ? 'Register New Student' : 'Edit Student Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Term Protection Notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-mono space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                <span>Academic Term Isolation Active</span>
              </div>
              <p className="text-[11px] text-blue-600/90 dark:text-blue-300/80 leading-relaxed">
                Changes apply to <strong>A.Y. {academicYear} ({semester})</strong>. Historical dues receipts from past semesters remain strictly preserved and frozen.
              </p>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Student Number */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-white/50 mb-1">
                  Student ID Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-S02978 or 2023-5001-A"
                  value={formStudentNo}
                  onChange={(e) => setFormStudentNo(e.target.value)}
                  className={`${inputStyles} text-xs font-mono h-10`}
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 dark:text-white/50 mb-1">
                  Full Name (Last, First Middle) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZARANDONA, JERICHO MATIAS"
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className={`${inputStyles} text-xs h-10`}
                />
              </div>

              {/* Year & Section Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-500 dark:text-white/50 mb-1">
                    Year Level
                  </label>
                  <select
                    value={formYearLevel}
                    onChange={(e) => setFormYearLevel(parseInt(e.target.value, 10))}
                    className="w-full h-10 bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-gold font-mono"
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-500 dark:text-white/50 mb-1">
                    Section
                  </label>
                  <select
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full h-10 bg-slate-50 dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-lg px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-gold font-mono"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="E">Section E</option>
                  </select>
                </div>
              </div>

              {/* Active / Enrolled status when editing */}
              {showModal === 'edit' && (
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-gold focus:ring-gold"
                    />
                    <span className="text-xs font-mono text-slate-700 dark:text-white/80">
                      Currently Active / Enrolled (uncheck if student dropped)
                    </span>
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-4 h-9 rounded-lg text-xs font-mono uppercase border border-black/10 dark:border-white/15 text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 h-9 rounded-lg text-xs font-mono uppercase font-bold bg-gold hover:bg-gold-light text-black flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Student</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Drop Student Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#141414] border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove Student Record?
              </h3>
              <p className="text-xs text-slate-600 dark:text-white/70 mt-1 font-mono">
                {deleteTarget.full_name} ({deleteTarget.student_no})
              </p>
            </div>

            {/* Action choice: Archive vs Permanent */}
            <div className="space-y-2 pt-1 text-xs font-mono">
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-black/10 dark:border-white/10 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                <input
                  type="radio"
                  name="deleteType"
                  value="archive"
                  checked={deleteType === 'archive'}
                  onChange={() => setDeleteType('archive')}
                  className="mt-0.5 text-gold"
                />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Mark as Dropped / Inactive (Recommended)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-white/50">
                    Retains historical records while removing them from active class tallies.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 cursor-pointer hover:bg-red-500/10">
                <input
                  type="radio"
                  name="deleteType"
                  value="permanent"
                  checked={deleteType === 'permanent'}
                  onChange={() => setDeleteType('permanent')}
                  className="mt-0.5 text-red-500"
                />
                <div>
                  <span className="font-semibold text-red-600 dark:text-red-400 block">
                    Permanently Delete from Database
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-white/50">
                    Completely deletes this student and any associated dues payment record.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 h-9 rounded-lg text-xs font-mono uppercase text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 h-9 rounded-lg text-xs font-mono uppercase font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <span>Processing...</span>
                ) : deleteType === 'permanent' ? (
                  <span>Delete Permanently</span>
                ) : (
                  <span>Mark as Dropped</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
