'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  ExternalLink,
  Receipt,
  Settings,
  ToggleLeft,
  Users,
} from 'lucide-react'
import StudentDuesRegistry from './StudentDuesRegistry'
import StudentDirectoryView from './StudentDirectoryView'
import { useToast } from '../_components/Toast'
import {
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_SEMESTER,
  ACADEMIC_YEARS,
} from '@/lib/dues'
import {
  getDuesTermConfigAction,
  updateDuesTermConfigAction,
  type DuesTermConfig,
} from './actions'

type ViewTab = 'management' | 'directory'

export default function MembershipDuesManagementPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ViewTab>('management')

  const [isLoading, setIsLoading] = useState(true)

  // Global Term Configuration State
  const [termConfig, setTermConfig] = useState<DuesTermConfig>({
    activeAcademicYear: DEFAULT_ACADEMIC_YEAR,
    activeSemester: DEFAULT_SEMESTER,
    availableAcademicYears: [...ACADEMIC_YEARS],
    isDatabaseBacked: false,
  })

  // Term Management Modal State
  const [showTermModal, setShowTermModal] = useState(false)
  const [termModalAY, setTermModalAY] = useState<string>(DEFAULT_ACADEMIC_YEAR)
  const [termModalSem, setTermModalSem] = useState<string>(DEFAULT_SEMESTER)
  const [termModalYears, setTermModalYears] = useState<string[]>([...ACADEMIC_YEARS])
  const [newCustomAY, setNewCustomAY] = useState('')
  const [isSavingTerm, setIsSavingTerm] = useState(false)

  // Load configuration
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const configRes = await getDuesTermConfigAction()

    if (configRes.success && configRes.data) {
      setTermConfig(configRes.data)
      setTermModalAY(configRes.data.activeAcademicYear)
      setTermModalSem(configRes.data.activeSemester)
      setTermModalYears(configRes.data.availableAcademicYears)
    } else {
      toast(configRes.error || 'Failed to fetch configuration', 'error')
    }

    setIsLoading(false)
  }, [toast])

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

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
      updatedBy: 'Officer', // Will be replaced with actual user
    })

    if (res.success && res.data) {
      setTermConfig(res.data)
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Sleek Minimalist Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-gold font-semibold bg-gold/10 px-2 py-0.5 rounded-md">
              <Receipt className="w-3 h-3 text-gold" />
              Treasury Desk
            </span>

            {/* Integrated Term Switcher Pill */}
            <button
              onClick={handleOpenTermModal}
              className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 hover:border-gold/40 text-[11px] font-mono text-slate-700 dark:text-white/80 transition-all cursor-pointer group"
              title="Click to switch or manage active academic term"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>
                {termConfig.activeAcademicYear} · {termConfig.activeSemester}
              </span>
              <Settings className="w-3 h-3 text-slate-400 group-hover:text-gold transition-colors ml-0.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-3 mt-1.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Membership Dues Register
            </h1>
            <span className="text-xs font-mono text-slate-500 dark:text-white/40 hidden sm:inline">
              ₱25.00 / student
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Linear / Apple-Style Capsule Tab Bar */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 rounded-xl">
            <button
              onClick={() => setActiveTab('management')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'management'
                  ? 'bg-white dark:bg-[#151515] text-slate-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10'
                  : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ToggleLeft className="w-3.5 h-3.5 text-gold" />
              <span>Payment Desk</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-[#151515] text-slate-900 dark:text-white font-semibold shadow-xs border border-black/5 dark:border-white/10'
                  : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Student Directory</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/dues"
              target="_blank"
              className="h-8 px-2.5 rounded-lg text-[11px] font-mono border border-black/10 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 shrink-0"
              title="Open public transparency tracker"
            >
              <ExternalLink className="w-3 h-3 text-gold" />
              <span className="hidden sm:inline">Public Tracker</span>
            </Link>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="h-8 w-8 rounded-lg border border-black/10 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              title="Refresh term and records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-gold' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Views */}
      {activeTab === 'management' ? (
        <StudentDuesRegistry 
          academicYear={termConfig.activeAcademicYear}
          semester={termConfig.activeSemester}
        />
      ) : (
        <StudentDirectoryView 
          academicYear={termConfig.activeAcademicYear}
          semester={termConfig.activeSemester}
        />
      )}

      {/* Term Management Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0D1117] rounded-xl border border-black/10 dark:border-white/15 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Manage Active Term
            </h2>
            <form onSubmit={handleSaveTermConfig} className="space-y-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block mb-2">
                  Academic Year
                </label>
                <select
                  value={termModalAY}
                  onChange={(e) => setTermModalAY(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-gold"
                  required
                >
                  {termModalYears.map((ay) => (
                    <option key={ay} value={ay}>
                      {ay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block mb-2">
                  Semester
                </label>
                <select
                  value={termModalSem}
                  onChange={(e) => setTermModalSem(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-gold"
                  required
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block mb-2">
                  Add Custom Year (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 2027-2028"
                    value={newCustomAY}
                    onChange={(e) => setNewCustomAY(e.target.value)}
                    className="flex-1 h-10 bg-white dark:bg-[#111] border border-black/15 dark:border-white/15 rounded-lg px-3 text-sm text-slate-900 dark:text-white outline-none focus:border-gold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAY}
                    className="px-4 h-10 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-xs font-mono transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="flex-1 h-10 rounded-lg border border-black/10 dark:border-white/15 text-slate-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTerm}
                  className="flex-1 h-10 rounded-lg bg-gold hover:bg-gold-light text-black font-bold text-sm font-mono transition-colors disabled:opacity-50"
                >
                  {isSavingTerm ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
