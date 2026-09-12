'use client'

import { useState, type FormEvent } from 'react'
import {
  Plus,
  X,
  Save,
  Calendar,
  Landmark,
} from 'lucide-react'
import FormField, { inputStyles, textareaStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { useToast } from '../_components/Toast'

interface TreasuryReport {
  id: string
  title: string
  period: string
  description: string
  status: 'Draft' | 'Published'
  fileName?: string
  filePreview?: string
  createdAt: string
}

export default function TreasuryManagementPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<TreasuryReport[]>([])
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    title: '',
    period: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Published',
  })
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFile(f: File | null) {
    setFile(f)
    setFilePreview(f ? URL.createObjectURL(f) : null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const report: TreasuryReport = {
      id: `treasury-${Date.now()}`,
      title: form.title,
      period: form.period,
      description: form.description,
      status: form.status,
      fileName: file?.name,
      filePreview: filePreview || undefined,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    }
    setReports([report, ...reports])
    setForm({ title: '', period: '', description: '', status: 'Draft' })
    setFile(null)
    setFilePreview(null)
    setShowForm(false)
    console.log('[Management] Treasury report created:', report)
    toast('Treasury report uploaded successfully. (Placeholder)')
  }

  function resetForm() {
    setShowForm(false)
    setForm({ title: '', period: '', description: '', status: 'Draft' })
    setFile(null)
    setFilePreview(null)
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Treasury
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Upload and manage financial reports and treasury documents.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
          >
            <Plus size={16} />
            <span>Upload Report</span>
          </button>
        )}
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="border border-gold/20 rounded-xl bg-gold/[0.03] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white">New Financial Report</h3>
            <button onClick={resetForm} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Report Title" htmlFor="treasury-title" required>
                <input id="treasury-title" type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Monthly Financial Statement" className={inputStyles} required />
              </FormField>
              <FormField label="Period Covered" htmlFor="treasury-period" required>
                <input id="treasury-period" type="text" value={form.period} onChange={(e) => update('period', e.target.value)} placeholder="e.g. August 2026" className={inputStyles} required />
              </FormField>
            </div>

            <FormField label="Description / Summary" htmlFor="treasury-desc">
              <textarea id="treasury-desc" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Brief summary of the financial report..." className={textareaStyles} rows={3} />
            </FormField>

            <FormField label="Attachment (PDF / Image)">
              <FileUpload accept="image/*,.pdf" label="Upload financial report" value={file} preview={filePreview} onChange={handleFile} maxSizeMB={10} />
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

            <div className="flex gap-2 pt-2">
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors">
                <Save size={13} /> Save Report
              </button>
              <button type="button" onClick={resetForm} className="px-3 py-2 rounded-lg text-xs text-white/40 border border-white/8 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 && !showForm ? (
        <EmptyState
          icon={<Landmark size={24} className="text-white/20" />}
          title="No financial reports yet"
          description="Upload your first treasury report to get started. Financial records will appear here for review and management."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/25 text-gold text-sm font-medium hover:bg-gold/[0.06] transition-colors"
            >
              <Plus size={14} />
              Upload Report
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-white/6 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/8 flex items-center justify-center flex-shrink-0">
                <Landmark size={16} className="text-gold/60" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-bold text-white/85 truncate">{report.title}</h3>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                  <span className="flex items-center gap-1"><Calendar size={10} />{report.period}</span>
                  {report.fileName && <span className="text-white/20">{report.fileName}</span>}
                </div>
                {report.description && (
                  <p className="text-xs text-white/35 line-clamp-2 mt-1">{report.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
