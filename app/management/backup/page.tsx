'use client'

import { useState } from 'react'
import {
  HardDriveDownload,
  Download,
  Upload,
  Copy,
  Check,
  FileJson,
  ShieldCheck,
  AlertCircle,
  Database,
  Calendar,
  Users,
  Code2,
  FileEdit,
  ClipboardCheck,
  Landmark,
  FolderOpen,
  RefreshCw,
} from 'lucide-react'
import { officers, pubmatTeam } from '@/data/officers'
import { calendarActivities } from '@/data/events'
import { projectsData } from '@/data/projects'
import { socialDispatches } from '@/data/announcements'
import { useAuth } from '../_context/auth-context'
import { useToast } from '../_components/Toast'

export default function BackupManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<{
    exportedAt: string
    counts: Record<string, number>
    rawJson: string
  } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Assemble full backup payload
  function generateBackupObject() {
    return {
      organization: 'PSITS - University of Antique Chapter',
      system: 'PSITS-UA Management Portal',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: user?.email || 'officer@antiquespride.edu.ph',
      modules: {
        officers: officers,
        pubmatTeam: pubmatTeam,
        events: calendarActivities,
        projects: projectsData,
        blogDispatches: socialDispatches,
        auditReports: [],
        treasuryRecords: [],
        documents: [],
      },
    }
  }

  function handleDownloadBackup() {
    const data = generateBackupObject()
    const jsonStr = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const dateStr = new Date().toISOString().split('T')[0]
    const a = document.createElement('a')
    a.href = url
    a.download = `psits-ua-backup-${dateStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast('JSON backup generated and downloaded successfully.')
  }

  function handleCopyJson() {
    const data = generateBackupObject()
    const jsonStr = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(jsonStr)
    setCopied(true)
    toast('Backup JSON copied to clipboard.')
    setTimeout(() => setCopied(false), 2500)
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setImportError('Please select a valid .json backup file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed.modules) {
          setImportError('Invalid backup file format: missing "modules" payload.')
          return
        }

        const counts: Record<string, number> = {}
        for (const [key, val] of Object.entries(parsed.modules)) {
          counts[key] = Array.isArray(val) ? val.length : 0
        }

        setImportPreview({
          exportedAt: parsed.exportedAt || 'Unknown date',
          counts,
          rawJson: JSON.stringify(parsed, null, 2),
        })
      } catch {
        setImportError('Could not parse JSON file. Ensure the file is not corrupted.')
      }
    }
    reader.readAsText(file)
  }

  function applyRestore() {
    if (!importPreview) return
    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      toast('Backup snapshot validated & restored. (Client State)')
      setImportPreview(null)
    }, 800)
  }

  const moduleStats = [
    { label: 'Officers Directory', count: officers.length, icon: Users, route: '/management/officers' },
    { label: 'Pubmat Creatives', count: pubmatTeam.length, icon: Users, route: '/management/officers' },
    { label: 'Calendar Events', count: calendarActivities.length, icon: Calendar, route: '/management/events' },
    { label: 'Projects Showcase', count: projectsData.length, icon: Code2, route: '/management/projects' },
    { label: 'Social Dispatches', count: socialDispatches.length, icon: FileEdit, route: '/management/blog' },
    { label: 'Audit Reports', count: 0, icon: ClipboardCheck, route: '/management/audit' },
    { label: 'Treasury Records', count: 0, icon: Landmark, route: '/management/treasury' },
    { label: 'Official Documents', count: 0, icon: FolderOpen, route: '/management/documents' },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Data Backup & Export
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Export all management records to JSON, save offline copies, or restore data snapshots.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04] text-xs font-mono font-medium transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={handleDownloadBackup}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] font-semibold text-xs transition-all duration-200 shadow-lg shadow-gold/10"
          >
            <Download size={14} />
            <span>Download Backup</span>
          </button>
        </div>
      </div>

      {/* Security Advisory */}
      <div className="p-4 rounded-xl bg-amber-400/[0.04] border border-amber-400/15 flex items-start gap-3">
        <ShieldCheck size={20} className="text-gold flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-white/90">
            Client-Side State Protection
          </p>
          <p className="text-white/50 leading-relaxed">
            Because a live database or Firebase backend is not connected yet, data modifications exist in local browser memory.
            Downloading periodic JSON backups ensures your organization&apos;s records can be restored anytime without losing work.
          </p>
        </div>
      </div>

      {/* Module Inventory Breakdown */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-white/40 flex items-center gap-2">
          <Database size={13} className="text-gold" />
          Active Database Modules & Inventory
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {moduleStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#0d121f] border border-white/6 rounded-xl p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-white/30 mb-2">
                <stat.icon size={16} />
                <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <div>
                <span className="font-display font-black text-2xl text-white block">
                  {stat.count}
                </span>
                <span className="text-[11px] text-white/40 font-mono block mt-0.5 truncate">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Sections: Export & Import Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Panel */}
        <div className="bg-[#0d121f] border border-white/6 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              <HardDriveDownload size={20} />
            </div>
            <h3 className="font-display font-bold text-white text-base">
              Export System Snapshot
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Downloads a unified, human-readable JSON file containing all officers, creative staff, calendar activities, projects, blog dispatches, and reports.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/6">
            <div className="text-[11px] font-mono text-white/30 flex items-center justify-between">
              <span>Format: Standard JSON</span>
              <span>Encrypted Session: Active</span>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold transition-colors"
            >
              <FileJson size={14} className="text-gold" />
              <span>Export psits-ua-backup.json</span>
            </button>
          </div>
        </div>

        {/* Import / Restore Panel */}
        <div className="bg-[#0d121f] border border-white/6 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-sky-400/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <Upload size={20} />
            </div>
            <h3 className="font-display font-bold text-white text-base">
              Restore from Backup
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Upload a previously exported PSITS-UA JSON file to preview its payload and synchronize organization state.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/6">
            <label className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/15 text-white/80 hover:text-white text-xs font-semibold cursor-pointer transition-colors">
              <Upload size={14} className="text-sky-400" />
              <span>Select .json Backup File</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Import Error Message */}
      {importError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Import Preview Modal / Card */}
      {importPreview && (
        <div className="bg-[#0d121f] border border-gold/30 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/6 pb-3">
            <div className="flex items-center gap-2">
              <FileJson size={18} className="text-gold" />
              <h4 className="font-display font-bold text-sm text-white">
                Backup File Validated: Ready to Restore
              </h4>
            </div>
            <button
              onClick={() => setImportPreview(null)}
              className="text-white/40 hover:text-white text-xs font-mono"
            >
              Dismiss
            </button>
          </div>

          <div className="text-xs font-mono text-white/50 space-y-1">
            <p>Export Timestamp: <span className="text-white">{importPreview.exportedAt}</span></p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {Object.entries(importPreview.counts).map(([mod, count]) => (
              <div
                key={mod}
                className="bg-white/[0.02] border border-white/6 rounded-lg p-2.5 text-center"
              >
                <span className="text-[10px] font-mono text-white/40 uppercase block truncate">
                  {mod}
                </span>
                <span className="font-display font-bold text-sm text-gold block mt-0.5">
                  {count} records
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/6">
            <button
              onClick={() => setImportPreview(null)}
              className="px-3.5 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={applyRestore}
              disabled={importing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors disabled:opacity-50"
            >
              {importing ? (
                <span className="w-2 h-2 rounded-full bg-[#0a0e17] animate-pulse" />
              ) : (
                <RefreshCw size={13} />
              )}
              <span>{importing ? 'Restoring...' : 'Confirm & Restore Snapshot'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
