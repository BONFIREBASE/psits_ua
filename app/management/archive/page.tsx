'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  RefreshCw,
  Eye,
  Camera,
  ExternalLink,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import FormField, { inputStyles } from '../_components/FormField'
import FileUpload from '../_components/FileUpload'
import { ManagementCardGridSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import type { ArchivePhotoRow } from '@/lib/supabase'
import {
  getArchivePhotosAction,
  createArchivePhotoAction,
  updateArchivePhotoAction,
  deleteArchivePhotoAction,
  reorderArchivePhotosAction,
  seedDefaultArchivePhotosAction,
} from './actions'

export default function ArchiveManagementPage() {
  const { toast } = useToast()

  const [photos, setPhotos] = useState<ArchivePhotoRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<ArchivePhotoRow | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form State
  const [formAlt, setFormAlt] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [formYear, setFormYear] = useState('')
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1)
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formUrl, setFormUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Fast Replace Image Modal
  const [replaceTarget, setReplaceTarget] = useState<ArchivePhotoRow | null>(null)
  const [replaceFile, setReplaceFile] = useState<File | null>(null)
  const [replacePreview, setReplacePreview] = useState<string | null>(null)
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null)

  // Load photos
  const loadPhotos = useCallback(async () => {
    try {
      const res = await getArchivePhotosAction()
      if (res.success && res.data) {
        setPhotos(res.data)
      } else {
        toast(res.error || 'Failed to retrieve archive items.', 'error')
      }
    } catch {
      toast('Network error: unable to load photos.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhotos()
  }, [loadPhotos])

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const updated = [...photos]
    const [movedItem] = updated.splice(draggedIndex, 1)
    updated.splice(dropIndex, 0, movedItem)

    // Resequence display_order
    const resequenced = updated.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }))

    setPhotos(resequenced)
    setDraggedIndex(null)

    try {
      const payload = resequenced.map((p, idx) => ({ id: p.id, display_order: idx + 1 }))
      await reorderArchivePhotosAction(payload)
      toast('Stack order reordered.', 'success')
    } catch {
      toast('Failed to save new order.', 'error')
      loadPhotos()
    }
  }

  // Keyboard / Click Up or Down Reorder
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= photos.length) return

    const updated = [...photos]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    const resequenced = updated.map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }))
    setPhotos(resequenced)

    try {
      const payload = resequenced.map((p, idx) => ({ id: p.id, display_order: idx + 1 }))
      await reorderArchivePhotosAction(payload)
      toast('Photo moved.', 'success')
    } catch {
      toast('Failed to save order update.', 'error')
      loadPhotos()
    }
  }

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingPhoto(null)
    setFormAlt(`PSITS-UA Archive Photo ${String(photos.length + 1).padStart(2, '0')}`)
    setFormCaption('')
    setFormYear(new Date().getFullYear().toString())
    setFormDisplayOrder(photos.length + 1)
    setFormFile(null)
    setFormUrl('')
    setPreviewUrl(null)
    setShowModal(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (photo: ArchivePhotoRow) => {
    setEditingPhoto(photo)
    setFormAlt(photo.alt || '')
    setFormCaption(photo.caption || '')
    setFormYear(photo.year || '')
    setFormDisplayOrder(photo.display_order ?? 1)
    setFormFile(null)
    setFormUrl(photo.url || '')
    setPreviewUrl(photo.url || null)
    setShowModal(true)
  }

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formAlt.trim()) {
      toast('Photo description / alt text is required.', 'error')
      return
    }

    if (!editingPhoto && !formFile && !formUrl.trim()) {
      toast('Please upload an image file or provide an image URL.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const fd = new FormData()
      fd.append('alt', formAlt.trim())
      fd.append('caption', formCaption.trim())
      fd.append('year', formYear.trim())
      fd.append('display_order', formDisplayOrder.toString())

      if (formFile) {
        fd.append('photo', formFile)
      }

      if (editingPhoto) {
        fd.append('id', editingPhoto.id)
        fd.append('existingUrl', editingPhoto.url)
        if (formUrl.trim()) fd.append('url', formUrl.trim())

        const res = await updateArchivePhotoAction(fd)
        if (res.success) {
          toast('Photo details updated.', 'success')
          setShowModal(false)
          loadPhotos()
        } else {
          toast(res.error || 'Failed to update photo.', 'error')
        }
      } else {
        if (formUrl.trim()) fd.append('url', formUrl.trim())
        const res = await createArchivePhotoAction(fd)
        if (res.success) {
          toast('New photo added to the archive.', 'success')
          setShowModal(false)
          loadPhotos()
        } else {
          toast(res.error || 'Failed to add photo.', 'error')
        }
      }
    } catch {
      toast('An unexpected error occurred.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fast Replace Image Submit
  const handleQuickReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replaceTarget || !replaceFile) {
      toast('Please choose a replacement image.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const fd = new FormData()
      fd.append('id', replaceTarget.id)
      fd.append('existingUrl', replaceTarget.url)
      fd.append('alt', replaceTarget.alt)
      fd.append('caption', replaceTarget.caption || '')
      fd.append('year', replaceTarget.year || '')
      fd.append('display_order', (replaceTarget.display_order ?? 1).toString())
      fd.append('photo', replaceFile)

      const res = await updateArchivePhotoAction(fd)
      if (res.success) {
        toast(`Image replaced for "${replaceTarget.alt}".`, 'success')
        setReplaceTarget(null)
        setReplaceFile(null)
        setReplacePreview(null)
        loadPhotos()
      } else {
        toast(res.error || 'Failed to replace image.', 'error')
      }
    } catch {
      toast('Error uploading replacement photo.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Handler
  const handleDelete = async (photo: ArchivePhotoRow) => {
    try {
      setDeletingId(photo.id)
      const res = await deleteArchivePhotoAction(photo.id, photo.url)
      if (res.success) {
        toast('Photo deleted.', 'success')
        setDeleteConfirmId(null)
        loadPhotos()
      } else {
        toast(res.error || 'Could not delete photo.', 'error')
      }
    } catch {
      toast('Error deleting photo.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // Seed default 11 photos
  const handleSeedDefaults = async () => {
    if (!confirm('Seed or reset the 11 default PSITS historical batch photos?')) {
      return
    }
    try {
      setIsSeeding(true)
      const res = await seedDefaultArchivePhotosAction()
      if (res.success) {
        toast('11 default archive photos loaded.', 'success')
        loadPhotos()
      } else {
        toast(res.error || 'Failed to seed photos.', 'error')
      }
    } catch {
      toast('Network error during seeding.', 'error')
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ─── Minimalist Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/8 dark:border-white/6 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              PSITS Archive
            </h1>
            <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-white/80">
              {photos.length} Photos
            </span>
          </div>
          <p className="text-slate-500 dark:text-white/50 text-xs sm:text-sm mt-1">
            Drag cards freely to reorder the interactive 3D stack on the{' '}
            <a
              href="/about"
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline inline-flex items-center gap-1 font-medium"
            >
              About Page <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-white/80 transition-colors disabled:opacity-50"
            title="Seed default 11 batch photos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>Reset Defaults</span>
          </button>

          <a
            href="/about"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-white/80 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>View Live</span>
          </a>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gold hover:bg-gold/90 text-navy transition-all shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* ─── Minimalist Reorderable Photo Grid ─── */}
      {isLoading ? (
        <ManagementCardGridSkeleton count={8} />
      ) : photos.length === 0 ? (
        <div className="border border-dashed border-black/15 dark:border-white/15 rounded-2xl p-12 text-center space-y-4">
          <p className="text-sm text-slate-500 dark:text-white/50">
            No archive photos yet. You can load the official 11 default photos or upload a new one.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedDefaults}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Load 11 Defaults
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gold text-navy hover:bg-gold/90"
            >
              + Add First Photo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            const isCover = index === 0
            const isDragging = draggedIndex === index
            const isOver = dragOverIndex === index
            const isConfirmingDelete = deleteConfirmId === photo.id
            const isDeleting = deletingId === photo.id

            return (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`
                  group relative bg-white dark:bg-[#0e1320] border rounded-xl overflow-hidden
                  transition-all duration-200 select-none cursor-grab active:cursor-grabbing
                  flex flex-col justify-between
                  ${isCover
                    ? 'border-gold/60 ring-1 ring-gold/40 shadow-sm'
                    : 'border-black/8 dark:border-white/8 hover:border-black/20 dark:hover:border-white/20 hover:shadow-md'
                  }
                  ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}
                  ${isOver ? 'ring-2 ring-gold border-gold bg-gold/5 scale-[1.02]' : ''}
                `}
              >
                {/* Top Overlay Badge & Drag Handle */}
                <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold backdrop-blur-md shadow-xs ${
                      isCover
                        ? 'bg-gold text-navy font-black'
                        : 'bg-black/70 text-white/90 border border-white/10'
                    }`}>
                      #{index + 1}
                    </span>
                    {isCover && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/80 text-gold border border-gold/40 backdrop-blur-md">
                        Cover
                      </span>
                    )}
                  </div>

                  {/* Drag Handle Icon Indicator */}
                  <div className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md text-white/70 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* 3:2 Photo Container */}
                <div className="relative aspect-[3/2] w-full bg-[#121212] overflow-hidden">
                  {photo.url ? (
                    <Image
                      src={photo.url}
                      alt={photo.alt || 'Archive photo'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-103 pointer-events-none"
                      unoptimized={photo.url.includes('r2.dev')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      No photo
                    </div>
                  )}

                  {/* Hover Fast Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setReplaceTarget(photo)
                        setReplaceFile(null)
                        setReplacePreview(null)
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-gold text-navy text-xs font-bold flex items-center gap-1.5 hover:bg-gold/90 transition-transform active:scale-95 shadow-md"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Replace</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Information & Actions */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {photo.alt}
                    </h3>
                    {photo.year && (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 shrink-0">
                        {photo.year}
                      </span>
                    )}
                  </div>

                  {photo.caption && (
                    <p className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-1 leading-tight">
                      {photo.caption}
                    </p>
                  )}

                  {/* Minimalist Controls: Reorder arrows, Edit, and Delete */}
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                    {/* Reorder Arrows */}
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveOrder(index, 'up')
                        }}
                        disabled={index === 0}
                        title="Move Earlier in Stack"
                        className="p-1 rounded text-slate-400 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMoveOrder(index, 'down')
                        }}
                        disabled={index === photos.length - 1}
                        title="Move Later in Stack"
                        className="p-1 rounded text-slate-400 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Edit & Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenEdit(photo)
                        }}
                        title="Edit Info"
                        className="p-1.5 rounded text-slate-400 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isConfirmingDelete ? (
                        <div
                          className="flex items-center gap-1 bg-red-500/10 p-0.5 rounded border border-red-500/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleDelete(photo)}
                            disabled={isDeleting}
                            className="px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/20 rounded"
                          >
                            {isDeleting ? '...' : 'Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1 py-0.5 text-[10px] text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(photo.id)
                          }}
                          title="Delete photo"
                          className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Add / Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#0d121f] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-white/6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center font-bold">
                  {editingPhoto ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {editingPhoto ? 'Edit Photo Info' : 'Add Archive Photo'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    {editingPhoto ? 'Modify details or replace image file' : 'Upload an authentic batch memory image'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Photo Upload / Preview */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-white/80 block">
                  Archive Photo Image <span className="text-red-500">*</span>
                </label>

                {previewUrl ? (
                  <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-slate-900 border border-black/10 dark:border-white/10 group">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      unoptimized={previewUrl.includes('r2.dev') || previewUrl.startsWith('blob:')}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 bg-gold text-navy rounded-lg text-xs font-bold cursor-pointer hover:bg-gold/90 transition-colors flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Change Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setFormFile(file)
                              setPreviewUrl(URL.createObjectURL(file))
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    onChange={(file: File | null) => {
                      setFormFile(file)
                      if (file) {
                        setPreviewUrl(URL.createObjectURL(file))
                      } else {
                        setPreviewUrl(null)
                      }
                    }}
                    accept="image/*"
                    maxSizeMB={5}
                    label="Upload Batch Image"
                  />
                )}
              </div>

              {/* Direct URL Alternative */}
              <FormField label="Or Image Direct URL (Optional)" htmlFor="archive-url">
                <input
                  id="archive-url"
                  type="url"
                  value={formUrl}
                  onChange={(e) => {
                    setFormUrl(e.target.value)
                    if (e.target.value && !formFile) {
                      setPreviewUrl(e.target.value)
                    }
                  }}
                  placeholder="https://... (Cloudflare R2 or direct public URL)"
                  className={inputStyles}
                />
              </FormField>

              {/* Alt Text / Title */}
              <FormField label="Photo Title / Description" htmlFor="archive-alt" required>
                <input
                  id="archive-alt"
                  type="text"
                  value={formAlt}
                  onChange={(e) => setFormAlt(e.target.value)}
                  placeholder="e.g. PSITS-UA Batch Archive Photo 01"
                  className={inputStyles}
                  required
                />
              </FormField>

              {/* Year & Order */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Batch / Year" htmlFor="archive-year">
                  <input
                    id="archive-year"
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="e.g. 2024, 2016–2017"
                    className={inputStyles}
                  />
                </FormField>

                <FormField label="Stack Position Order" htmlFor="archive-order">
                  <input
                    id="archive-order"
                    type="number"
                    min="1"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 1)}
                    className={inputStyles}
                  />
                </FormField>
              </div>

              {/* Caption (Optional) */}
              <FormField label="Caption / Note (Optional)" htmlFor="archive-caption">
                <textarea
                  id="archive-caption"
                  rows={2}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="e.g. CCIS IT Assembly, Induction ceremony at UA AVR"
                  className={inputStyles}
                />
              </FormField>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-black/8 dark:border-white/6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-700 dark:text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-gold hover:bg-gold/90 text-navy transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : editingPhoto ? 'Update Photo' : 'Add Photo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Fast Replace Image Modal ─── */}
      {replaceTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0d121f] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/8 dark:border-white/6">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Replace Image
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReplaceTarget(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickReplaceSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-white/60 mb-2">
                  Replace image for: <strong className="text-slate-900 dark:text-white font-medium">{replaceTarget.alt}</strong>
                </p>

                {replacePreview ? (
                  <div className="relative aspect-[3/2] w-full rounded-xl overflow-hidden bg-slate-900 border border-gold/40">
                    <Image
                      src={replacePreview}
                      alt="Replacement preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-gold">
                      New Replacement
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="aspect-[3/2] w-full rounded-xl border-2 border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 transition-all flex flex-col items-center justify-center cursor-pointer p-4 text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Click to choose replacement photo
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5">
                      JPG, PNG, WebP up to 5MB
                    </span>
                  </div>
                )}

                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setReplaceFile(file)
                      setReplacePreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </div>

              {replacePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setReplaceFile(null)
                    setReplacePreview(null)
                  }}
                  className="text-xs text-slate-500 dark:text-white/50 hover:text-gold underline"
                >
                  Choose a different file
                </button>
              )}

              <div className="pt-3 border-t border-black/8 dark:border-white/6 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReplaceTarget(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !replaceFile}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gold hover:bg-gold/90 text-navy transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Uploading...' : 'Confirm Replace'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
