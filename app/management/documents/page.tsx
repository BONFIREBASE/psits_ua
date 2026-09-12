'use client'

import { useState, type FormEvent } from 'react'
import {
  Plus,
  X,
  Save,
  Calendar,
  FolderOpen,
  FileText,
  ScrollText,
  BookOpen,
} from 'lucide-react'
import FormField, { inputStyles, textareaStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { useToast } from '../_components/Toast'

type DocCategory = 'Resolution' | 'Memo' | 'Minutes'

interface OrgDocument {
  id: string
  category: DocCategory
  referenceNo: string
  title: string
  date: string
  description: string
  status: 'Draft' | 'Approved' | 'Published'
  fileName?: string
  filePreview?: string
}

const categoryTabs: { key: DocCategory; label: string; icon: typeof FileText }[] = [
  { key: 'Resolution', label: 'Resolutions', icon: ScrollText },
  { key: 'Memo', label: 'Memos', icon: FileText },
  { key: 'Minutes', label: 'Minutes of Meetings', icon: BookOpen },
]

export default function DocumentsManagementPage() {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<OrgDocument[]>([])
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

  const filtered = documents.filter((d) => d.category === activeCategory)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFile(f: File | null) {
    setFile(f)
    setFilePreview(f ? URL.createObjectURL(f) : null)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const doc: OrgDocument = {
      id: `doc-${Date.now()}`,
      category: activeCategory,
      referenceNo: form.referenceNo,
      title: form.title,
      date: form.date,
      description: form.description,
      status: form.status,
      fileName: file?.name,
      filePreview: filePreview || undefined,
    }
    setDocuments([doc, ...documents])
    resetForm()
    console.log('[Management] Document created:', doc)
    toast(`${activeCategory} saved successfully. (Placeholder)`)
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
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Documents
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Manage resolutions, memos, and minutes of meetings.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
          >
            <Plus size={16} />
            <span>New Document</span>
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {categoryTabs.map((tab) => {
          const count = documents.filter((d) => d.category === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveCategory(tab.key); setShowForm(false) }}
              className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200
                ${activeCategory === tab.key
                  ? 'bg-gold/15 text-gold border border-gold/25'
                  : 'bg-white/[0.03] text-white/40 border border-white/8 hover:text-white/60 hover:border-white/15'
                }
              `}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-mono ${activeCategory === tab.key ? 'bg-gold/20 text-gold' : 'bg-white/[0.06] text-white/25'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="border border-gold/20 rounded-xl bg-gold/[0.03] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white">
              New {activeCategory === 'Minutes' ? 'Minutes of Meeting' : activeCategory}
            </h3>
            <button onClick={resetForm} className="text-white/30 hover:text-white/60 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Reference Number" htmlFor="doc-ref" required>
                <input id="doc-ref" type="text" value={form.referenceNo} onChange={(e) => update('referenceNo', e.target.value)} placeholder={placeholders[activeCategory].ref} className={inputStyles} required />
              </FormField>
              <FormField label="Date" htmlFor="doc-date" required>
                <input id="doc-date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} className={`${inputStyles} [color-scheme:dark]`} required />
              </FormField>
            </div>

            <FormField label="Title / Subject" htmlFor="doc-title" required>
              <input id="doc-title" type="text" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder={placeholders[activeCategory].title} className={inputStyles} required />
            </FormField>

            <FormField label="Description / Content" htmlFor="doc-desc">
              <textarea id="doc-desc" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Summary or key points of the document..." className={textareaStyles} rows={4} />
            </FormField>

            <FormField label="Attachment (PDF / Image)">
              <FileUpload accept="image/*,.pdf" label="Upload document file" value={file} preview={filePreview} onChange={handleFile} maxSizeMB={10} />
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
              <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors">
                <Save size={13} /> Save Document
              </button>
              <button type="button" onClick={resetForm} className="px-3 py-2 rounded-lg text-xs text-white/40 border border-white/8 hover:text-white/60 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      {filtered.length === 0 && !showForm ? (
        <EmptyState
          icon={<ActiveCategoryIcon size={24} className="text-white/20" />}
          title={`No ${activeCategory.toLowerCase()}s yet`}
          description={`Upload your first ${activeCategory.toLowerCase()} to get started. Documents will appear here for review and management.`}
          action={
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/25 text-gold text-sm font-medium hover:bg-gold/[0.06] transition-colors"
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
              className="flex items-start gap-4 p-4 rounded-xl border border-white/6 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/8 flex items-center justify-center flex-shrink-0">
                {doc.category === 'Resolution' && <ScrollText size={16} className="text-gold/60" />}
                {doc.category === 'Memo' && <FileText size={16} className="text-gold/60" />}
                {doc.category === 'Minutes' && <BookOpen size={16} className="text-gold/60" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-gold/60 font-bold">{doc.referenceNo}</span>
                  <StatusBadge status={doc.status} />
                </div>
                <h3 className="text-sm font-display font-bold text-white/85 truncate">{doc.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
                  <span className="flex items-center gap-1"><Calendar size={10} />{doc.date}</span>
                  {doc.fileName && <span className="text-white/20">{doc.fileName}</span>}
                </div>
                {doc.description && (
                  <p className="text-xs text-white/35 line-clamp-2 mt-1">{doc.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
