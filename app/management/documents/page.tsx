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
  Eye,
  Edit3,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import FormField, { inputStyles, textareaStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { ManagementTableSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import { getDocuments, supabase, type DocumentRow } from '@/lib/supabase'
import { createDocument, updateDocument, deleteDocument } from './actions'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<DocCategory>('Resolution')

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    referenceNo: '',
    title: '',
    date: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Published',
  })
  const [addFile, setAddFile] = useState<File | null>(null)
  const [addFilePreview, setAddFilePreview] = useState<string | null>(null)
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit Modal State
  const [editingDoc, setEditingDoc] = useState<DocumentRow | null>(null)
  const [editForm, setEditForm] = useState({
    referenceNo: '',
    title: '',
    date: '',
    description: '',
    status: 'Draft' as 'Draft' | 'Approved' | 'Published',
    category: 'Resolution' as DocCategory,
  })
  const [editFile, setEditFile] = useState<File | null>(null)
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // In-Page Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState<DocumentRow | null>(null)

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

  // Keyboard shortcut: Esc to dismiss modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowAddModal(false)
        setEditingDoc(null)
        setViewingDoc(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filtered = documents.filter((d) => d.category === activeCategory)

  function updateAddField(field: string, value: string) {
    setAddForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateEditField(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleAddFile(f: File | null) {
    if (!f) {
      setAddFile(null)
      setAddFilePreview(null)
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
    setAddFile(f)
    setAddFilePreview(URL.createObjectURL(f))
  }

  function handleEditFile(f: File | null) {
    if (!f) {
      setEditFile(null)
      setEditFilePreview(null)
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
    setEditFile(f)
    setEditFilePreview(URL.createObjectURL(f))
  }

  function resetAddForm() {
    setAddForm({ referenceNo: '', title: '', date: '', description: '', status: 'Draft' })
    setAddFile(null)
    setAddFilePreview(null)
    setShowAddModal(false)
  }

  async function handleAddSubmit(e: FormEvent) {
    e.preventDefault()
    setAddSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('category', activeCategory)
      formData.append('referenceNo', addForm.referenceNo)
      formData.append('title', addForm.title)
      formData.append('date', addForm.date)
      formData.append('description', addForm.description)
      formData.append('status', addForm.status)
      if (addFile) formData.append('file', addFile)

      const res = await createDocument(formData)
      if (!res.success) {
        toast(res.error || 'Failed to save document')
        return
      }

      toast(`${activeCategory} saved successfully!`)
      resetAddForm()
      await load()
    } catch {
      toast('Failed to upload document')
    } finally {
      setAddSubmitting(false)
    }
  }

  function startEdit(doc: DocumentRow) {
    setEditingDoc(doc)
    setEditForm({
      referenceNo: doc.reference_no,
      title: doc.title,
      date: doc.date,
      description: doc.description || '',
      status: (doc.status as 'Draft' | 'Approved' | 'Published') || 'Draft',
      category: (doc.category as DocCategory) || activeCategory,
    })
    setEditFile(null)
    setEditFilePreview(null)
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editingDoc) return
    setEditSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('id', editingDoc.id)
      formData.append('category', editForm.category)
      formData.append('referenceNo', editForm.referenceNo)
      formData.append('title', editForm.title)
      formData.append('date', editForm.date)
      formData.append('description', editForm.description)
      formData.append('status', editForm.status)
      if (editFile) formData.append('file', editFile)

      const res = await updateDocument(formData)
      if (!res.success) {
        toast(res.error || 'Failed to update document')
        return
      }

      toast(`${editForm.category} updated successfully!`)
      setEditingDoc(null)
      setEditFile(null)
      setEditFilePreview(null)
      await load()
    } catch {
      toast('Failed to update document')
    } finally {
      setEditSubmitting(false)
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
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit cursor-pointer"
        >
          <Plus size={16} />
          <span>New {activeCategory}</span>
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
              onClick={() => { setActiveCategory(tab.key); setShowAddModal(false) }}
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

      {/* Documents List */}
      {loading ? (
        <ManagementTableSkeleton rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ActiveCategoryIcon size={24} className="text-muted-foreground-theme/40" />}
          title={`No ${activeCategory.toLowerCase()}s yet`}
          description={`Upload your first ${activeCategory.toLowerCase()} to get started. Documents will be stored securely.`}
          action={
            <button
              onClick={() => setShowAddModal(true)}
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
              <div
                onClick={() => doc.file_url && setViewingDoc(doc)}
                className={`w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-border-theme flex items-center justify-center flex-shrink-0 ${doc.file_url ? 'cursor-pointer hover:border-gold/50' : ''}`}
                title={doc.file_url ? 'Click to preview document' : undefined}
              >
                {doc.category === 'Resolution' && <ScrollText size={16} className="text-amber-600 dark:text-gold/60" />}
                {doc.category === 'Memo' && <FileText size={16} className="text-amber-600 dark:text-gold/60" />}
                {doc.category === 'Minutes' && <BookOpen size={16} className="text-amber-600 dark:text-gold/60" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-amber-600 dark:text-gold/80 font-bold">{doc.reference_no}</span>
                  <StatusBadge status={doc.status} />
                  {doc.file_url && (
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium hover:bg-sky-500/20 transition-colors cursor-pointer"
                      title="Preview in-page"
                    >
                      Attached Preview
                    </button>
                  )}
                </div>
                <h3
                  onClick={() => doc.file_url && setViewingDoc(doc)}
                  className={`text-sm font-display font-bold text-foreground-theme truncate ${doc.file_url ? 'cursor-pointer hover:text-amber-600 dark:hover:text-gold transition-colors' : ''}`}
                  title={doc.file_url ? 'Click to preview document' : undefined}
                >
                  {doc.title}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground-theme font-mono">
                  <span className="flex items-center gap-1"><Calendar size={10} />{doc.date}</span>
                  {doc.file_name && <span className="text-muted-foreground-theme/70">{doc.file_name}</span>}
                </div>
                {doc.description && (
                  <p className="text-xs text-muted-foreground-theme line-clamp-2 mt-1">{doc.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {doc.file_url && (
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="p-2 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="View Document In-Page"
                  >
                    <Eye size={15} />
                  </button>
                )}
                <button
                  onClick={() => startEdit(doc)}
                  className="p-2 rounded-lg text-muted-foreground-theme hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                  title="Edit Document"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(doc.id, doc.file_url)}
                  disabled={deletingId === doc.id}
                  className="p-2 rounded-lg text-muted-foreground-theme/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Delete Document"
                >
                  {deletingId === doc.id ? (
                    <Loader2 size={15} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Standardized Add Document Modal ─── */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                  <ActiveCategoryIcon size={18} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                    Upload New {activeCategory}
                  </h2>
                  <p className="text-xs text-muted-foreground-theme">
                    Register and store official organization records in cloud storage.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 scrollbar-minimal overscroll-contain">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Reference No." htmlFor="add-doc-ref" required hint="Tracking reference">
                    <input
                      id="add-doc-ref"
                      type="text"
                      value={addForm.referenceNo}
                      onChange={(e) => updateAddField('referenceNo', e.target.value)}
                      placeholder={placeholders[activeCategory].ref}
                      className={inputStyles}
                      required
                    />
                  </FormField>

                  <FormField label="Date" htmlFor="add-doc-date" required>
                    <input
                      id="add-doc-date"
                      type="date"
                      value={addForm.date}
                      onChange={(e) => updateAddField('date', e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Title" htmlFor="add-doc-title" required>
                  <input
                    id="add-doc-title"
                    type="text"
                    value={addForm.title}
                    onChange={(e) => updateAddField('title', e.target.value)}
                    placeholder={placeholders[activeCategory].title}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <FormField label="Status">
                  <Select
                    id="add-doc-status"
                    value={addForm.status}
                    onChange={(val) => updateAddField('status', val as 'Draft' | 'Approved' | 'Published')}
                    options={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Approved', label: 'Approved' },
                      { value: 'Published', label: 'Published' },
                    ]}
                  />
                </FormField>

                <FormField label="Description / Summary" htmlFor="add-doc-desc">
                  <textarea
                    id="add-doc-desc"
                    value={addForm.description}
                    onChange={(e) => updateAddField('description', e.target.value)}
                    placeholder="Brief summary of document contents..."
                    rows={3}
                    className={textareaStyles}
                  />
                </FormField>

                <FormField label="Document File (PDF / Word / PNG / JPG)" hint="Uploads directly to encrypted cloud storage">
                  <FileUpload
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                    label="Choose PDF, Word, PNG, or JPG file"
                    value={addFile}
                    preview={addFilePreview}
                    onChange={handleAddFile}
                    maxSizeMB={20}
                  />
                </FormField>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {addSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{addSubmitting ? 'Saving Document...' : 'Save Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Standardized In-Place Edit Modal ─── */}
      {editingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingDoc(null)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                    Edit {editingDoc.category}
                  </h2>
                  <p className="text-xs text-muted-foreground-theme">
                    Update reference information, classification, or replace document attachment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 scrollbar-minimal overscroll-contain">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Reference No." htmlFor="edit-doc-ref" required hint="Tracking reference">
                    <input
                      id="edit-doc-ref"
                      type="text"
                      value={editForm.referenceNo}
                      onChange={(e) => updateEditField('referenceNo', e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>

                  <FormField label="Date" htmlFor="edit-doc-date" required>
                    <input
                      id="edit-doc-date"
                      type="date"
                      value={editForm.date}
                      onChange={(e) => updateEditField('date', e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Title" htmlFor="edit-doc-title" required>
                  <input
                    id="edit-doc-title"
                    type="text"
                    value={editForm.title}
                    onChange={(e) => updateEditField('title', e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Category">
                    <Select
                      id="edit-doc-category"
                      value={editForm.category}
                      onChange={(val) => updateEditField('category', val as DocCategory)}
                      options={[
                        { value: 'Resolution', label: 'Resolution' },
                        { value: 'Memo', label: 'Memo' },
                        { value: 'Minutes', label: 'Minutes of Meeting' },
                      ]}
                    />
                  </FormField>

                  <FormField label="Status">
                    <Select
                      id="edit-doc-status"
                      value={editForm.status}
                      onChange={(val) => updateEditField('status', val as 'Draft' | 'Approved' | 'Published')}
                      options={[
                        { value: 'Draft', label: 'Draft' },
                        { value: 'Approved', label: 'Approved' },
                        { value: 'Published', label: 'Published' },
                      ]}
                    />
                  </FormField>
                </div>

                <FormField label="Description / Summary" htmlFor="edit-doc-desc">
                  <textarea
                    id="edit-doc-desc"
                    value={editForm.description}
                    onChange={(e) => updateEditField('description', e.target.value)}
                    placeholder="Brief summary of document..."
                    rows={3}
                    className={textareaStyles}
                  />
                </FormField>

                {editingDoc.file_name && (
                  <div className="p-3 rounded-xl border border-border-theme bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-amber-500 shrink-0" />
                      <div className="truncate">
                        <span className="text-muted-foreground-theme">Current File: </span>
                        <span className="font-mono font-medium text-foreground-theme">{editingDoc.file_name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      Retained unless replaced
                    </span>
                  </div>
                )}

                <FormField label="Replace Document File (Optional)" hint="Upload to replace existing cloud file">
                  <FileUpload
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
                    label="Choose replacement PDF, Word, PNG, or JPG"
                    value={editFile}
                    preview={editFilePreview}
                    onChange={handleEditFile}
                    maxSizeMB={20}
                  />
                </FormField>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {editSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{editSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Standardized In-Page Document Viewer Modal ─── */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setViewingDoc(null)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-5xl h-[92vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold shrink-0">
                  <Eye size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-amber-600 dark:text-gold font-bold">
                      {viewingDoc.reference_no}
                    </span>
                    <StatusBadge status={viewingDoc.status} />
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground-theme font-mono">
                      <Calendar size={11} />
                      {viewingDoc.date}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-display font-bold text-foreground-theme truncate mt-0.5">
                    {viewingDoc.title}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {viewingDoc.file_url && (
                  <>
                    <a
                      href={viewingDoc.file_url}
                      download={viewingDoc.file_name || 'document'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border border-border-theme hover:border-gold/40 text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Download File"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                    <a
                      href={viewingDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                      title="Open in external tab"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </>
                )}
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Viewer Viewport */}
            <div className="flex-1 w-full bg-slate-900/40 relative overflow-hidden flex items-center justify-center">
              {(() => {
                if (!viewingDoc.file_url) {
                  return (
                    <div className="text-center p-6 space-y-2">
                      <FileText size={36} className="mx-auto text-muted-foreground-theme/40" />
                      <p className="text-xs text-muted-foreground-theme font-mono">No attached document file found.</p>
                    </div>
                  )
                }

                const fileUrlLower = viewingDoc.file_url.toLowerCase()
                const fileNameLower = (viewingDoc.file_name || '').toLowerCase()
                const isPdf = fileUrlLower.includes('.pdf') || fileNameLower.endsWith('.pdf')
                const isImage = fileUrlLower.match(/\.(png|jpg|jpeg|webp)($|\?)/i) || fileNameLower.match(/\.(png|jpg|jpeg|webp)$/i)
                const isOfficeDoc = fileUrlLower.match(/\.(doc|docx)($|\?)/i) || fileNameLower.match(/\.(doc|docx)$/i)

                if (isPdf) {
                  return (
                    <iframe
                      src={`${viewingDoc.file_url}#toolbar=1`}
                      className="w-full h-full border-0 bg-white"
                      title={viewingDoc.title}
                    />
                  )
                }

                if (isImage) {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                      <img
                        src={viewingDoc.file_url}
                        alt={viewingDoc.title}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  )
                }

                if (isOfficeDoc) {
                  return (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(viewingDoc.file_url)}`}
                      className="w-full h-full border-0 bg-white"
                      title={viewingDoc.title}
                    />
                  )
                }

                return (
                  <div className="text-center p-8 space-y-4 max-w-md">
                    <FileSpreadsheet size={40} className="mx-auto text-amber-500/80" />
                    <div>
                      <h3 className="text-sm font-bold text-foreground-theme">{viewingDoc.file_name || 'Document Asset'}</h3>
                      <p className="text-xs text-muted-foreground-theme mt-1">Direct embedded preview is not available for this file type.</p>
                    </div>
                    <a
                      href={viewingDoc.file_url}
                      download={viewingDoc.file_name || 'document'}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Download size={14} />
                      Download Document
                    </a>
                  </div>
                )
              })()}
            </div>

            {/* Pinned Footer Details */}
            {viewingDoc.description && (
              <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422] flex items-center justify-between gap-4 text-xs text-muted-foreground-theme">
                <p className="line-clamp-2">{viewingDoc.description}</p>
                {viewingDoc.file_name && (
                  <span className="font-mono text-[10px] text-muted-foreground-theme/60 shrink-0">
                    {viewingDoc.file_name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
