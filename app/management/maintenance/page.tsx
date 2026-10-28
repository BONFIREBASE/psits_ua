'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  ShieldAlert,
  Globe,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Save,
  RotateCcw,
  Plus,
  X,
  Lock,
} from 'lucide-react'
import { useToast } from '../_components/Toast'
import { useAuth } from '../_context/auth-context'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import {
  getMaintenanceConfigAction,
  updateMaintenanceConfigAction,
  type UpdateMaintenancePayload,
} from './actions'
import { ManagementCardGridSkeleton } from '../_components/SkeletonPreloader'

interface RouteOption {
  path: string
  label: string
  description: string
}

const PRESET_ROUTES: RouteOption[] = [
  { path: '/', label: 'Home Page', description: 'Main landing page and hero section' },
  { path: '/merch', label: 'Merch Orders', description: 'Official Polo shirt ordering and sizing' },
  { path: '/dues', label: 'Membership Dues', description: 'Dues status tracker and payment verification' },
  { path: '/events', label: 'Events & Calendar', description: 'Upcoming CCIS events and announcements' },
  { path: '/community', label: 'Community Hub', description: 'Student directory and announcements' },
  { path: '/officers', label: 'Officers Directory', description: 'PSITS council directory and advisers' },
  { path: '/projects', label: 'Projects Showcase', description: 'Student and community technical projects' },
  { path: '/polo-design', label: 'Polo Shirt Design', description: 'Design submissions and voting gallery' },
  { path: '/submission', label: 'Submissions Portal', description: 'Public design and project submission forms' },
]

export default function MaintenanceManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form State
  const [isEnabled, setIsEnabled] = useState(false)
  const [scope, setScope] = useState<'all' | 'specific'>('all')
  const [blockedRoutes, setBlockedRoutes] = useState<string[]>([])
  const [title, setTitle] = useState('System Under Scheduled Maintenance')
  const [message, setMessage] = useState('We are performing scheduled updates to improve our services. PSITS services will be restored shortly.')
  const [estimatedReturn, setEstimatedReturn] = useState<string>('')
  const [customRouteInput, setCustomRouteInput] = useState('')

  // Original state for dirty check / discard
  const [originalState, setOriginalState] = useState<UpdateMaintenancePayload | null>(null)

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const res = await getMaintenanceConfigAction()
      if (res.success && res.data) {
        const d = res.data
        setIsEnabled(d.is_enabled)
        setScope(d.scope)
        setBlockedRoutes(d.blocked_routes || [])
        setTitle(d.title || 'System Under Scheduled Maintenance')
        setMessage(d.message || '')
        setEstimatedReturn(d.estimated_return ? d.estimated_return.slice(0, 16) : '')

        setOriginalState({
          is_enabled: d.is_enabled,
          scope: d.scope,
          blocked_routes: d.blocked_routes || [],
          title: d.title,
          message: d.message,
          estimated_return: d.estimated_return,
        })
      } else {
        toast(res.error || 'Could not fetch maintenance settings.', 'error')
      }
    } catch {
      toast('Failed to load maintenance settings.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()

    let unsubscribe: (() => void) | undefined
    try {
      const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.MAINTENANCE}.documents.active`
      unsubscribe = appwrite.subscribe(channel, (response: { payload: Record<string, unknown> }) => {
        const payload = response.payload
        if (payload) {
          setIsEnabled(Boolean(payload.is_enabled))
          setScope((payload.scope as 'all' | 'specific') || 'all')
          setBlockedRoutes(Array.isArray(payload.blocked_routes) ? payload.blocked_routes : [])
          setTitle(String(payload.title || ''))
          setMessage(String(payload.message || ''))
          setEstimatedReturn(payload.estimated_return ? String(payload.estimated_return).slice(0, 16) : '')
        }
      })
    } catch {
      // Fallback
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const toggleRoute = (routePath: string) => {
    setBlockedRoutes((prev) =>
      prev.includes(routePath) ? prev.filter((r) => r !== routePath) : [...prev, routePath]
    )
  }

  const addCustomRoute = () => {
    let clean = customRouteInput.trim().toLowerCase()
    if (!clean) return
    if (!clean.startsWith('/')) clean = `/${clean}`
    if (!blockedRoutes.includes(clean)) {
      setBlockedRoutes((prev) => [...prev, clean])
    }
    setCustomRouteInput('')
  }

  const handleSave = async () => {
    if (!isAdmin) {
      toast('Only administrators can update maintenance settings.', 'error')
      return
    }

    setIsSaving(true)
    try {
      const payload: UpdateMaintenancePayload = {
        is_enabled: isEnabled,
        scope,
        blocked_routes: blockedRoutes,
        title,
        message,
        estimated_return: estimatedReturn ? new Date(estimatedReturn).toISOString() : null,
        updated_by: user?.email || user?.displayName || 'Admin',
      }

      const res = await updateMaintenanceConfigAction(payload)
      if (res.success) {
        toast(
          isEnabled
            ? `Maintenance active (${scope === 'all' ? 'Entire Site' : `${blockedRoutes.length} route(s)`})`
            : 'Maintenance mode deactivated. All systems operational.',
          'success'
        )
        loadConfig()
      } else {
        toast(res.error || 'Failed to update maintenance settings.', 'error')
      }
    } catch {
      toast('An unexpected error occurred while saving.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (originalState) {
      setIsEnabled(originalState.is_enabled)
      setScope(originalState.scope)
      setBlockedRoutes(originalState.blocked_routes)
      setTitle(originalState.title)
      setMessage(originalState.message)
      setEstimatedReturn(originalState.estimated_return ? originalState.estimated_return.slice(0, 16) : '')
      toast('Reverted to last saved settings.', 'success')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <ManagementCardGridSkeleton count={2} />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/8 dark:border-white/6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Maintenance Mode
            </h1>
            {/* Live Indicator Chip */}
            {isEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                {scope === 'all' ? 'Whole Site Active' : `${blockedRoutes.length} Route(s) Active`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Operational
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Toggle maintenance status globally or selectively lock specific public routes.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/maintenance"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Screen</span>
          </Link>
        </div>
      </div>

      {/* Main Switch Card */}
      <div className="bg-white dark:bg-[#0c121e] border border-black/8 dark:border-white/8 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        {/* Master Activation Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label htmlFor="master-toggle" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Enable Maintenance Mode</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When activated, visitors are shown the maintenance screen for targeted routes.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="master-toggle"
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Scope Selector (Only visible if enabled) */}
        <AnimatePresence>
          {isEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-4 border-t border-black/8 dark:border-white/6 space-y-4 overflow-hidden"
            >
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Target Scope
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Whole Website Option */}
                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                      scope === 'all'
                        ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 bg-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${scope === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">Whole Website</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Locks every public page. (Management area remains accessible).
                      </div>
                    </div>
                  </button>

                  {/* Specific Pages Option */}
                  <button
                    type="button"
                    onClick={() => setScope('specific')}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                      scope === 'specific'
                        ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                        : 'border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 bg-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-md ${scope === 'specific' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">Specific Pages</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Select specific features or route URLs to put under maintenance.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Specific Route Selection Checklist */}
              {scope === 'specific' && (
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Select Target Pages ({blockedRoutes.length} selected)
                    </span>
                    <button
                      type="button"
                      onClick={() => setBlockedRoutes(PRESET_ROUTES.map((p) => p.path))}
                      className="text-[11px] text-amber-500 hover:underline"
                    >
                      Select all presets
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PRESET_ROUTES.map((route) => {
                      const isSelected = blockedRoutes.includes(route.path)
                      return (
                        <div
                          key={route.path}
                          onClick={() => toggleRoute(route.path)}
                          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                            isSelected
                              ? 'border-amber-500/50 bg-amber-500/10 text-slate-900 dark:text-white'
                              : 'border-black/6 dark:border-white/6 hover:bg-black/3 dark:hover:bg-white/3 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-medium flex items-center gap-1.5">
                              <span>{route.label}</span>
                              <code className="text-[10px] text-slate-400 font-mono">({route.path})</code>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {route.description}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled via parent onClick
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4 pointer-events-none"
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* Custom Route Input */}
                  <div className="pt-2">
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">
                      Add Custom URL Route (e.g. <code>/resources</code>)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customRouteInput}
                        onChange={(e) => setCustomRouteInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRoute())}
                        placeholder="/example-route"
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={addCustomRoute}
                        disabled={!customRouteInput.trim()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Active custom badges */}
                    {blockedRoutes.filter((r) => !PRESET_ROUTES.some((p) => p.path === r)).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {blockedRoutes
                          .filter((r) => !PRESET_ROUTES.some((p) => p.path === r))
                          .map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <code>{r}</code>
                              <button
                                type="button"
                                onClick={() => toggleRoute(r)}
                                className="hover:text-red-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notice Customization Card */}
      <div className="bg-white dark:bg-[#0c121e] border border-black/8 dark:border-white/8 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Wrench className="w-3.5 h-3.5 text-slate-400" />
          <span>Notice Content & Messaging</span>
        </h2>

        <div className="space-y-3">
          {/* Title Input */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Public Banner Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="System Under Scheduled Maintenance"
              className="w-full px-3 py-2 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Public Notice Message
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the reason for maintenance or expected outcome..."
              className="w-full px-3 py-2 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Estimated Return Time */}
          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Estimated Return Time (Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={estimatedReturn}
              onChange={(e) => setEstimatedReturn(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {estimatedReturn && (
              <button
                type="button"
                onClick={() => setEstimatedReturn('')}
                className="ml-2 text-[11px] text-slate-500 hover:text-red-400 underline"
              >
                Clear time
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-4 z-20 bg-white/90 dark:bg-[#0a0e17]/90 backdrop-blur-md border border-black/8 dark:border-white/8 rounded-xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 hidden sm:block">
          {isAdmin ? 'Ready to apply maintenance configuration.' : 'Admin credentials required to publish.'}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white active:scale-[0.98] transition shadow-sm disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
