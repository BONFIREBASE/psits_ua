'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  Plus,
  X,
  Save,
  Calendar,
  FolderOpen,
  FileText,
  ScrollText,
  BookOpen,
  Loader2,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import FormField, { inputStyles, textareaStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { ManagementTableSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import { getDocuments, supabase, type DocumentRow } from '@/lib/supabase'
import { createDocument, deleteDocument } from './actions'

type DocCategory = 'Resolution' | 'Memo' | 'Minutes'

const categoryTabs: { key: DocCategory; label: string; icon: typeof FileText }[] = [
  { key: 'Resolution', label: 'Resolutions', icon: ScrollText },
  { key: 'Memo', label: 'Memos', icon: FileText },
  { key: 'Minutes', label: 'Minutes of Meetings', icon: BookOpen },
]

export default function DocumentsManagementPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<DocCategory>('Resolution')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    referenceNo: '',
    title: '',
    date: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Published',
  })
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  async function load() {
    try {
      const data = await getDocuments()
      setDocuments(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel('documents-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => {
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = documents.filter((d) => d.category === activeCategory)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFile(f: File | null) {
    if (!f) {
      setFile(null)
      setFilePreview(null)
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      toast('Selected document exceeds the 20MB limit. Please choose a smaller file.')
      return
    }
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg']
    const hasValidExt = allowed.some((ext) => f.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      toast('Please upload a valid document: PDF, Word (.docx, .doc), or Image (.png, .jpg).')
      return
    }
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('category', activeCategory)
      formData.append('referenceNo', form.referenceNo)
      formData.append('title', form.title)
      formData.append('date', form.date)
      formData.append('description', form.description)
      formData.append('status', form.status)
      if (file) formData.append('file', file)

      const res = await createDocument(formData)
      if (!res.success) {
        toast(res.error || 'Failed to save document')
        return
      }

      toast(`${activeCategory} saved successfully!`)
      resetForm()
      await load()
    } catch {
      toast('Failed to upload document')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string, fileUrl?: string | null) {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    setDeletingId(id)
    try {
      const res = await deleteDocument(id, fileUrl)
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id))
        toast('Document deleted from database and storage.')
      } else {
        toast(res.error || 'Failed to delete document')
      }
    } finally {
      setDeletingId(null)
    }
  }

  function resetForm() {
    setShowForm(false)
    setForm({ referenceNo: '', title: '', date: '', description: '', status: 'Draft' })
    setFile(null)
    setFilePreview(null)
  }

  const placeholders: Record<DocCategory, { ref: string; title: string }> = {
    Resolution: { ref: 'e.g. Resolution No. 2026-001', title: 'e.g. Approval of Annual Budget' },
    Memo: { ref: 'e.g. Memo No. 2026-001', title: 'e.g. Schedule of General Assembly' },
    Minutes: { ref: 'e.g. MIN-2026-09-01', title: 'e.g. September Regular Meeting' },
  }

  const ActiveCategoryIcon = categoryTabs.find((t) => t.key === activeCategory)?.icon || FolderOpen

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-black text-2xl text-foreground-theme tracking-tight">Documents</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-semibold">
              Live Database
            </span>
          </div>
          <p className="text-sm text-muted-foreground-theme mt-1">
            Official resolutions, memorandums, and minutes of meetings stored securely in cloud storage.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit cursor-pointer"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showForm ? 'Cancel' : `New ${activeCategory}`}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-border-theme pb-3">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon
          const count = documents.filter((d) => d.category === tab.key).length
          const isActive = activeCategory === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveCategory(tab.key); setShowForm(false) }}
              className={`
                flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                ${isActive
                  ? 'bg-gold/15 text-amber-600 dark:text-gold border border-gold/30 shadow-xs font-bold'
                  : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }
              `}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? 'bg-gold/20 text-amber-600 dark:text-gold font-bold' : 'bg-slate-100 dark:bg-white/[0.06] text-muted-foreground-theme'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="p-6 rounded-xl border border-border-theme bg-surface-theme shadow-sm space-y-4">
          <h2 className="font-display font-bold text-base text-foreground-theme">Upload New {activeCategory}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Reference No." htmlFor="doc-ref" required hint="Official tracking reference">
                <input
                  id="doc-ref"
                  type="text"
                  value={form.referenceNo}
                  onChange={(e) => update('referenceNo', e.target.value)}
                  placeholder={placeholders[activeCategory].ref}
                  className={inputStyles}
                  required
                />
              </FormField>

              <FormField label="Date" htmlFor="doc-date" required>
                <input
                  id="doc-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  className={inputStyles}
                  required
                />
              </FormField>
            </div>

            <FormField label="Title" htmlFor="doc-title" required>
              <input
                id="doc-title"
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder={placeholders[activeCategory].title}
                className={inputStyles}
                required
              />
            </FormField>

            <FormField label="Description / Summary" htmlFor="doc-desc">
              <textarea
                id="doc-desc"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Brief summary of the document contents..."
                rows={3}
                className={textareaStyles}
              />
            </FormField>

            <FormField label="Document File (PDF / Word / PNG / JPG)" hint="Uploads directly to cloud storage">
              <FileUpload
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                label="Choose PDF, Word, PNG, or JPG file"
                value={file}
                preview={filePreview}
                onChange={handleFile}
                maxSizeMB={20}
              />
            </FormField>

            <FormField label="Status">
              <Select
                id="doc-status"
                value={form.status}
                onChange={(val) => update('status', val)}
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Published', label: 'Published' },
                ]}
              />
            </FormField>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-bold text-xs hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>{submitting ? 'Saving Document...' : 'Save Document'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 rounded-lg text-xs text-muted-foreground-theme border border-border-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <ManagementTableSkeleton rows={5} />
      ) : filtered.length === 0 && !showForm ? (
        <EmptyState
          icon={<ActiveCategoryIcon size={24} className="text-muted-foreground-theme/40" />}
          title={`No ${activeCategory.toLowerCase()}s yet`}
          description={`Upload your first ${activeCategory.toLowerCase()} to get started. Documents will be stored securely.`}
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/30 text-amber-600 dark:text-gold text-sm font-medium hover:bg-gold/[0.06] transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Add {activeCategory}
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-4 p-4 rounded-xl border border-border-theme hover:border-gold/30 bg-surface-theme hover:shadow-xs transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-border-theme flex items-center justify-center flex-shrink-0">
                {doc.category === 'Resolution' && <ScrollText size={16} className="text-amber-600 dark:text-gold/60" />}
                {doc.category === 'Memo' && <FileText size={16} className="text-amber-600 dark:text-gold/60" />}
                {doc.category === 'Minutes' && <BookOpen size={16} className="text-amber-600 dark:text-gold/60" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-amber-600 dark:text-gold/80 font-bold">{doc.reference_no}</span>
                  <StatusBadge status={doc.status} />
                  {doc.file_url && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
                      Attached
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-display font-bold text-foreground-theme truncate">{doc.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground-theme font-mono">
                  <span className="flex items-center gap-1"><Calendar size={10} />{doc.date}</span>
                  {doc.file_name && <span className="text-muted-foreground-theme/70">{doc.file_name}</span>}
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground-theme line-clamp-2 mt-1">{doc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="Download / View Document"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(doc.id, doc.file_url)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded-lg text-muted-foreground-theme/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Delete Document"
                >
                  {deletingId === doc.id ? (
                    <Loader2 size={14} className="animate-spin text-red-500" />
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
