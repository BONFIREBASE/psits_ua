'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  Plus,
  X,
  Save,
  Calendar,
  Landmark,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import FormField, { inputStyles, textareaStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { useToast } from '../_components/Toast'
import { getTreasuryRecords, supabase, type TreasuryRow } from '@/lib/supabase'
import { createTreasuryRecord, deleteTreasuryRecord } from './actions'

export default function TreasuryManagementPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<TreasuryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    period: '',
    description: '',
    amount: '',
    status: 'Draft' as 'Draft' | 'Published',
  })
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  async function load() {
    try {
      const data = await getTreasuryRecords()
      setReports(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('treasury-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'treasury_records' },
        () => {
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFile(f: File | null) {
    setFile(f)
    setFilePreview(f ? URL.createObjectURL(f) : null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('period', form.period)
      formData.append('description', form.description)
      formData.append('amount', form.amount || '0')
      formData.append('status', form.status)
      if (file) formData.append('file', file)

      const res = await createTreasuryRecord(formData)
      if (!res.success) {
        toast(res.error || 'Failed to save record')
        return
      }

      toast('Treasury record saved successfully!')
      resetForm()
      await load()
    } catch {
      toast('Failed to save record')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, fileUrl?: string | null) {
    if (!window.confirm('Are you sure you want to delete this treasury report?')) return
    setDeletingId(id)
    try {
      const res = await deleteTreasuryRecord(id, fileUrl)
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== id))
        toast('Treasury record deleted.')
      } else {
        toast(res.error || 'Failed to delete record')
      }
    } finally {
      setDeletingId(null)
    }
  }

  function resetForm() {
    setShowForm(false)
    setForm({ title: '', period: '', description: '', amount: '', status: 'Draft' })
    setFile(null)
    setFilePreview(null)
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-black text-2xl text-white tracking-tight">Treasury</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Live Database
            </span>
          </div>
          <p className="text-sm text-white/35 mt-1">
            Financial reports, disbursement logs, and receipt proofs saved to cloud storage.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? 'Cancel' : 'New Report / Record'}</span>
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="p-6 rounded-xl border border-gold/20 bg-gold/[0.02] space-y-4">
          <h2 className="font-display font-bold text-base text-white">New Financial Report / Disbursement</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Report Title" htmlFor="treasury-title" required>
                <input
                  id="treasury-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="e.g. 1st Semester Financial Statement"
                  className={inputStyles}
                  required
                />
              </FormField>

              <FormField label="Period" htmlFor="treasury-period" required>
                <input
                  id="treasury-period"
                  type="text"
                  value={form.period}
                  onChange={(e) => update('period', e.target.value)}
                  placeholder="e.g. August – December 2026"
                  className={inputStyles}
                  required
                />
              </FormField>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Amount (PHP)" htmlFor="treasury-amount" hint="Total budget, disbursement, or liquidation">
                <input
                  id="treasury-amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  placeholder="0.00"
                  className={inputStyles}
                />
              </FormField>

              <FormField label="Status">
                <Select
                  id="treasury-status"
                  value={form.status}
                  onChange={(val) => update('status', val)}
                  options={[
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Published', label: 'Published' },
                  ]}
                />
              </FormField>
            </div>

            <FormField label="Description / Breakdown" htmlFor="treasury-desc">
              <textarea
                id="treasury-desc"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Breakdown of collection, expenses, and current bank balance..."
                rows={3}
                className={textareaStyles}
              />
            </FormField>

            <FormField label="Receipt / Statement File (PDF / Images)" hint="Uploads securely to cloud storage">
              <FileUpload
                accept=".pdf,.png,.jpg,.jpeg"
                label="Choose PDF report or receipt image"
                value={file}
                preview={filePreview}
                onChange={handleFile}
                maxSizeMB={15}
              />
            </FormField>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{submitting ? 'Saving Record...' : 'Save Report'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-lg text-xs text-white/40 border border-white/8 hover:text-white/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={24} className="animate-spin text-gold mx-auto mb-2" />
          <p className="text-xs text-white/30 font-mono">Loading financial records from Supabase...</p>
        </div>
      ) : reports.length === 0 && !showForm ? (
        <EmptyState
          icon={<Landmark size={24} className="text-white/20" />}
          title="No treasury reports yet"
          description="Upload your first financial statement or receipt log to keep records transparent."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/25 text-gold text-sm font-medium hover:bg-gold/[0.06] transition-colors"
            >
              <Plus size={14} />
              New Report
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-white/6 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/8 flex items-center justify-center flex-shrink-0">
                <Landmark size={16} className="text-gold/60" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-gold font-bold">
                    {rep.amount ? `₱${rep.amount.toLocaleString()}` : 'Financial Statement'}
                  </span>
                  <StatusBadge status={rep.status} />
                  {rep.file_url && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Attached
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-display font-bold text-white/85 truncate">{rep.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                  <span className="flex items-center gap-1"><Calendar size={10} />{rep.period}</span>
                  {rep.file_name && <span className="text-white/20">{rep.file_name}</span>}
                </div>
                {rep.description && (
                  <p className="text-xs text-white/35 line-clamp-2 mt-1">{rep.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {rep.file_url && (
                  <a
                    href={rep.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-white/30 hover:text-gold hover:bg-white/[0.04] transition-colors"
                    title="View Attachment"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(rep.id, rep.file_url)}
                  disabled={deletingId === rep.id}
                  className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  title="Delete Report"
                >
                  {deletingId === rep.id ? (
                    <Loader2 size={14} className="animate-spin text-red-400" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
