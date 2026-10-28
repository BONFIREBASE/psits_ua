'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Wrench,
  Globe,
  Layers,
  Clock,
  ExternalLink,
  Save,
  Plus,
  X,
  Unlock,
  Power,
  RefreshCw,
  Pencil,
} from 'lucide-react'
import { useToast } from '../_components/Toast'
import { useAuth } from '../_context/auth-context'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import {
  getMaintenanceConfigAction,
  updateMaintenanceConfigAction,
  type UpdateMaintenancePayload,
} from './actions'
import type { MaintenanceConfigData } from '@/lib/maintenance'
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

function formatPSTDateTime(isoString: string | null | undefined): string | null {
  if (!isoString) return null
  try {
    return new Date(isoString).toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return null
  }
}

export default function MaintenanceManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const editorRef = useRef<HTMLDivElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLifting, setIsLifting] = useState(false)

  // Live persisted state directly from Appwrite
  const [persistedConfig, setPersistedConfig] = useState<MaintenanceConfigData | null>(null)

  // Editable Form State
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
        setPersistedConfig(d)
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
          const updated: MaintenanceConfigData = {
            id: String(payload.$id || 'active'),
            is_enabled: Boolean(payload.is_enabled),
            scope: (payload.scope as 'all' | 'specific') || 'all',
            blocked_routes: Array.isArray(payload.blocked_routes) ? payload.blocked_routes : [],
            title: String(payload.title || ''),
            message: String(payload.message || ''),
            estimated_return: payload.estimated_return ? String(payload.estimated_return) : null,
            updated_at: payload.updated_at ? String(payload.updated_at) : undefined,
            updated_by: payload.updated_by ? String(payload.updated_by) : undefined,
          }
          setPersistedConfig(updated)
        }
      })
    } catch {
      // Fallback
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const scrollToEditor = () => {
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const titleInput = editorRef.current.querySelector('input')
      if (titleInput) {
        setTimeout(() => titleInput.focus(), 300)
      }
    }
  }

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

  // Quick 1-click Lift Maintenance action
  const handleLiftMaintenance = async () => {
    if (!isAdmin) {
      toast('Only administrators can lift maintenance.', 'error')
      return
    }

    setIsLifting(true)
    try {
      const payload: UpdateMaintenancePayload = {
        is_enabled: false,
        scope,
        blocked_routes: blockedRoutes,
        title,
        message,
        estimated_return: estimatedReturn ? new Date(estimatedReturn).toISOString() : null,
        updated_by: user?.email || user?.displayName || 'Admin',
      }

      const res = await updateMaintenanceConfigAction(payload)
      if (res.success && res.data) {
        setIsEnabled(false)
        setPersistedConfig(res.data)
        if (originalState) {
          setOriginalState({ ...originalState, is_enabled: false })
        }
        toast('Maintenance mode lifted. All public routes are now accessible.', 'success')
      } else {
        toast(res.error || 'Failed to lift maintenance.', 'error')
      }
    } catch {
      toast('An unexpected error occurred while lifting maintenance.', 'error')
    } finally {
      setIsLifting(false)
    }
  }

  // Quick 1-click Activate Maintenance action
  const handleActivateMaintenance = async () => {
    if (!isAdmin) {
      toast('Only administrators can activate maintenance.', 'error')
      return
    }

    setIsLifting(true)
    try {
      const payload: UpdateMaintenancePayload = {
        is_enabled: true,
        scope,
        blocked_routes: blockedRoutes,
        title,
        message,
        estimated_return: estimatedReturn ? new Date(estimatedReturn).toISOString() : null,
        updated_by: user?.email || user?.displayName || 'Admin',
      }

      const res = await updateMaintenanceConfigAction(payload)
      if (res.success && res.data) {
        setIsEnabled(true)
        setPersistedConfig(res.data)
        if (originalState) {
          setOriginalState({ ...originalState, is_enabled: true })
        }
        toast('Maintenance activated successfully.', 'success')
      } else {
        toast(res.error || 'Failed to activate maintenance.', 'error')
      }
    } catch {
      toast('An unexpected error occurred while activating maintenance.', 'error')
    } finally {
      setIsLifting(false)
    }
  }

  // Save / apply entire configuration
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
      if (res.success && res.data) {
        setPersistedConfig(res.data)
        toast(
          isEnabled
            ? `Maintenance active (${scope === 'all' ? 'Entire Site' : `${blockedRoutes.length} route(s)`})`
            : 'Maintenance settings saved successfully.',
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

  const isDirty =
    originalState &&
    (originalState.is_enabled !== isEnabled ||
      originalState.scope !== scope ||
      originalState.title !== title ||
      originalState.message !== message ||
      (originalState.estimated_return ? originalState.estimated_return.slice(0, 16) : '') !== estimatedReturn ||
      JSON.stringify(originalState.blocked_routes) !== JSON.stringify(blockedRoutes))

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        <ManagementCardGridSkeleton count={2} />
      </div>
    )
  }

  const isCurrentlyActive = persistedConfig?.is_enabled ?? isEnabled

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Top Header - Clean, No Fluff */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/8 dark:border-white/6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Maintenance Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inspect existing maintenance rules, lift restrictions, or edit settings in real time.
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
          <button
            type="button"
            onClick={loadConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Refresh current live status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 1. EXISTING MAINTENANCE RULES TABLE */}
      <div className="bg-white dark:bg-[#0c121e] border border-black/8 dark:border-white/8 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-black/6 dark:border-white/6 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Existing Maintenance Rules
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review current rule targets and trigger actions directly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCurrentlyActive ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Lifted
              </span>
            )}
          </div>
        </div>

        {/* Rule Detail Item */}
        <div className="divide-y divide-black/6 dark:divide-white/6">
          <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Scope:
                </span>
                {persistedConfig?.scope === 'all' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Globe className="w-3.5 h-3.5" /> Entire Website
                  </span>
                ) : (
                  <div className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Specific Pages:
                    </span>
                    {(persistedConfig?.blocked_routes || []).map((route) => (
                      <span
                        key={route}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white"
                      >
                        {route}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Return:{' '}
                  <strong className="text-slate-700 dark:text-slate-300 font-medium">
                    {formatPSTDateTime(persistedConfig?.estimated_return) || 'Returning shortly'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Updated:{' '}
                  {formatPSTDateTime(persistedConfig?.updated_at) || 'Recently'}
                  {persistedConfig?.updated_by ? ` by ${persistedConfig.updated_by}` : ''}
                </span>
              </div>
            </div>

            {/* Direct Action Buttons: EDIT & LIFT */}
            <div className="flex items-center gap-2 shrink-0">
              {/* EDIT BUTTON */}
              <button
                type="button"
                onClick={scrollToEditor}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Edit</span>
              </button>

              {/* LIFT OR ACTIVATE BUTTON */}
              {isCurrentlyActive ? (
                <button
                  type="button"
                  onClick={handleLiftMaintenance}
                  disabled={isLifting || isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{isLifting ? 'Lifting...' : 'Lift'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleActivateMaintenance}
                  disabled={isLifting || isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition shadow-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isLifting ? 'Activating...' : 'Activate'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. EDIT MAINTENANCE RULE SECTION */}
      <div
        ref={editorRef}
        id="edit-section"
        className="bg-white dark:bg-[#0c121e] border border-black/8 dark:border-white/8 rounded-xl p-5 sm:p-6 shadow-sm space-y-6"
      >
        <div className="flex items-center justify-between border-b border-black/6 dark:border-white/6 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              <span>Edit Maintenance Rule</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Modify the target routes, activation status, or notice details.
            </p>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {isEnabled ? 'Active' : 'Lifted'}
            </span>
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
        </div>

        {/* Scope Selector */}
        <div className="space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Select Target Scope
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Whole Website Option */}
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  scope === 'all'
                    ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 bg-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-md ${
                    scope === 'all'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Whole Website
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Locks every public page. (Management area remains accessible).
                  </div>
                </div>
              </button>

              {/* Specific Pages Option */}
              <button
                type="button"
                onClick={() => setScope('specific')}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                  scope === 'specific'
                    ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                    : 'border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 bg-transparent'
                }`}
              >
                <div
                  className={`p-2 rounded-md ${
                    scope === 'specific'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Specific Pages
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select individual routes or modules to put under maintenance.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Specific Route Checklist */}
          {scope === 'specific' && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Pages Checklist ({blockedRoutes.length} selected)
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBlockedRoutes(PRESET_ROUTES.map((p) => p.path))}
                    className="text-[11px] text-amber-500 hover:underline cursor-pointer"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockedRoutes([])}
                    className="text-[11px] text-slate-500 hover:text-red-400 hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
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
                        onChange={() => {}}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 h-4 w-4 pointer-events-none"
                      />
                    </div>
                  )
                })}
              </div>

              {/* Custom Route Input */}
              <div className="pt-2">
                <label className="text-[11px] font-medium text-slate-500 block mb-1">
                  Add Custom Route Path (e.g. <code>/resources</code>)
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition cursor-pointer"
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
                            className="hover:text-red-400 cursor-pointer"
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
        </div>

        {/* Public Notice Content & Return Time */}
        <div className="pt-4 border-t border-black/6 dark:border-white/6 space-y-3">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Public Notice Message & Return Time</span>
          </h3>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Banner Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="System Under Scheduled Maintenance"
              className="w-full px-3 py-2 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Notice Description
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain the reason for maintenance or expected outcome..."
              className="w-full px-3 py-2 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Estimated Return Time (PST, Asia/Manila)</span>
              </label>
              {estimatedReturn && (
                <button
                  type="button"
                  onClick={() => setEstimatedReturn('')}
                  className="text-[11px] text-slate-500 hover:text-red-400 underline cursor-pointer"
                >
                  Clear time
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={estimatedReturn}
              onChange={(e) => setEstimatedReturn(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Preview on maintenance screen: &quot;Available again: {formatPSTDateTime(estimatedReturn ? new Date(estimatedReturn).toISOString() : null) || 'Returning shortly'}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* 3. STICKY BOTTOM ACTIONS BAR */}
      <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-[#0a0e17]/95 backdrop-blur-md border border-black/8 dark:border-white/8 rounded-xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500 hidden sm:block">
          {isDirty ? (
            <span className="text-amber-500 font-medium">● Unsaved edits pending</span>
          ) : (
            <span>Settings synchronized with Appwrite.</span>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">

          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSaving || !isDirty}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition cursor-pointer"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white active:scale-[0.98] transition shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
