'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  Plus,
  X,
  Save,
  Calendar,
  ClipboardCheck,
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
import { getAuditReports, type AuditReportRow } from '@/lib/supabase'
import { createAuditReportAction, deleteAuditReportAction } from './actions'

export default function AuditManagementPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<AuditReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    academicYear: '2026–2027',
    semester: '1st Semester',
    summary: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Archived',
  })
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  async function load() {
    try {
      const data = await getAuditReports()
      setReports(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
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
      formData.append('academicYear', form.academicYear)
      formData.append('semester', form.semester)
      formData.append('summary', form.summary)
      formData.append('status', form.status)
      if (file) formData.append('file', file)

      const res = await createAuditReportAction(formData)
      if (!res.success) {
        toast(res.error || 'Failed to save audit report')
        return
      }

      toast('Audit report saved successfully!')
      resetForm()
      await load()
    } catch {
      toast('Failed to save audit report')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, fileUrl?: string | null) {
    if (!window.confirm('Are you sure you want to delete this audit report?')) return
    setDeletingId(id)
    try {
      const res = await deleteAuditReportAction(id, fileUrl)
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== id))
        toast('Audit report deleted.')
      } else {
        toast(res.error || 'Failed to delete report')
      }
    } finally {
      setDeletingId(null)
    }
  }

  function resetForm() {
    setShowForm(false)
    setForm({ title: '', academicYear: '2026–2027', semester: '1st Semester', summary: '', status: 'Draft' })
    setFile(null)
    setFilePreview(null)
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-black text-2xl text-white tracking-tight">Audit Reports</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              Live Database
            </span>
          </div>
          <p className="text-sm text-white/35 mt-1">
            Official semester audits, inventory reviews, and signed clearances stored securely in cloud storage.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? 'Cancel' : 'New Audit Report'}</span>
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="p-6 rounded-xl border border-gold/20 bg-gold/[0.02] space-y-4">
          <h2 className="font-display font-bold text-base text-white">Upload New Audit Report</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Report Title" htmlFor="audit-title" required>
              <input
                id="audit-title"
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. End-of-Semester Comprehensive Audit"
                className={inputStyles}
                required
              />
            </FormField>

            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Academic Year" htmlFor="audit-ay" required>
                <input
                  id="audit-ay"
                  type="text"
                  value={form.academicYear}
                  onChange={(e) => update('academicYear', e.target.value)}
                  placeholder="2026–2027"
                  className={inputStyles}
                  required
                />
              </FormField>

              <FormField label="Semester">
                <Select
                  id="audit-sem"
                  value={form.semester}
                  onChange={(val) => update('semester', val)}
                  options={[
                    { value: '1st Semester', label: '1st Semester' },
                    { value: '2nd Semester', label: '2nd Semester' },
                    { value: 'Summer / Midyear', label: 'Summer / Midyear' },
                  ]}
                />
              </FormField>
            </div>

            <FormField label="Summary & Observations" htmlFor="audit-summary">
              <textarea
                id="audit-summary"
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                placeholder="Audit committee observations, inventory verification, and compliance notes..."
                rows={3}
                className={textareaStyles}
              />
            </FormField>

            <FormField label="Signed Audit Document (PDF)" hint="Stored securely in cloud storage">
              <FileUpload
                accept=".pdf,.doc,.docx"
                label="Choose signed audit PDF"
                value={file}
                preview={filePreview}
                onChange={handleFile}
                maxSizeMB={15}
              />
            </FormField>

            <FormField label="Status">
              <Select
                id="audit-status"
                value={form.status}
                onChange={(val) => update('status', val)}
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Archived', label: 'Archived' },
                ]}
              />
            </FormField>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{submitting ? 'Saving Audit...' : 'Save Audit'}</span>
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
          <p className="text-xs text-white/30 font-mono">Loading audit reports from Supabase...</p>
        </div>
      ) : reports.length === 0 && !showForm ? (
        <EmptyState
          icon={<ClipboardCheck size={24} className="text-white/20" />}
          title="No audit reports yet"
          description="Upload your first signed audit report or inventory clearance."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/25 text-gold text-sm font-medium hover:bg-gold/[0.06] transition-colors"
            >
              <Plus size={14} />
              New Audit Report
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
                <ClipboardCheck size={16} className="text-gold/60" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-gold font-bold">{rep.academic_year} · {rep.semester}</span>
                  <StatusBadge status={(rep.status as any) || 'Draft'} />
                  {rep.file_url && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      Attached
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-display font-bold text-white/85 truncate">{rep.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                  <span className="flex items-center gap-1"><Calendar size={10} />{new Date(rep.created_at).toLocaleDateString()}</span>
                  {rep.file_name && <span className="text-white/20">{rep.file_name}</span>}
                </div>
                {rep.summary && (
                  <p className="text-xs text-white/35 line-clamp-2 mt-1">{rep.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {rep.file_url && (
                  <a
                    href={rep.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-white/30 hover:text-gold hover:bg-white/[0.04] transition-colors"
                    title="Download Audit PDF"
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
