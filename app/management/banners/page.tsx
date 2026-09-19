'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  Megaphone,
  Calendar,
  UserPlus,
  FileText,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import FormField, { inputStyles } from '../_components/FormField'
import FileUpload from '../_components/FileUpload'
import { ManagementCardGridSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import { getBanners, type BannerRow } from '@/lib/supabase'
import {
  createBannerAction,
  updateBannerAction,
  deleteBannerAction,
  toggleBannerActiveAction,
  seedDefaultBannerAction,
} from './actions'
import { useAuth } from '../_context/auth-context'

type BannerType = 'announcement' | 'meeting' | 'recruitment' | 'forms' | 'general'

const bannerTypeOptions: { value: BannerType; label: string; icon: typeof Megaphone; color: string }[] = [
  { value: 'announcement', label: 'Announcement', icon: Megaphone, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'recruitment', label: 'Recruitment', icon: UserPlus, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'forms', label: 'Forms & Surveys', icon: FileText, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'general', label: 'General Info', icon: Sparkles, color: 'text-muted-foreground-theme bg-slate-100 dark:bg-white/5 border-border-theme' },
]

export default function BannersManagementPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [banners, setBanners] = useState<BannerRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form State
  const [formTitle, setFormTitle] = useState('')
  const [formSubtitle, setFormSubtitle] = useState('')
  const [formCredit, setFormCredit] = useState('')
  const [formType, setFormType] = useState<BannerType>('recruitment')
  const [formLinkText, setFormLinkText] = useState('Join Organization')
  const [formLinkUrl, setFormLinkUrl] = useState('')
  const [formSecondaryLinkText, setFormSecondaryLinkText] = useState('View Projects')
  const [formSecondaryLinkUrl, setFormSecondaryLinkUrl] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formThumbnail, setFormThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const loadBanners = useCallback(async () => {
    try {
      const data = await getBanners()
      setBanners(data)
    } catch {
      toast('Failed to load banners')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBanners()
  }, [loadBanners])

  function handleOpenCreate() {
    setEditingBanner(null)
    setFormTitle('')
    setFormSubtitle('')
    setFormCredit('')
    setFormType('recruitment')
    setFormLinkText('Join Organization')
    setFormLinkUrl('')
    setFormSecondaryLinkText('View Projects')
    setFormSecondaryLinkUrl('')
    setFormIsActive(true)
    setFormThumbnail(null)
    setThumbnailPreview(null)
    setShowModal(true)
  }

  function handleOpenEdit(banner: BannerRow) {
    setEditingBanner(banner)
    setFormTitle(banner.title)

    const creditMatch = banner.subtitle?.match(/\[by:(.*?)\]/)
    if (creditMatch) {
      setFormCredit(creditMatch[1].trim())
      setFormSubtitle(banner.subtitle.replace(/\[by:.*?\]/, '').trim())
    } else {
      setFormCredit('')
      setFormSubtitle(banner.subtitle || '')
    }

    setFormType(banner.type as BannerType)
    setFormLinkText(banner.link_text || 'Join Organization')
    setFormLinkUrl(banner.link_url || '')
    setFormSecondaryLinkText(banner.secondary_link_text || '')
    setFormSecondaryLinkUrl(banner.secondary_link_url || '')
    setFormIsActive(banner.is_active)
    setFormThumbnail(null)
    setThumbnailPreview(banner.image_url || null)
    setShowModal(true)
  }

  function handleThumbnailChange(file: File | null) {
    if (file && file.size > 20 * 1024 * 1024) {
      toast('Selected image exceeds the 20MB limit. Please choose a smaller file.')
      return
    }
    setFormThumbnail(file)
    setThumbnailPreview(file ? URL.createObjectURL(file) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast('Title is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const finalSubtitle = formCredit.trim()
        ? `${formSubtitle.trim()} [by:${formCredit.trim()}]`
        : formSubtitle.trim()

      const formData = new FormData()
      formData.append('title', formTitle.trim())
      formData.append('subtitle', finalSubtitle)
      formData.append('type', formType)
      formData.append('link_text', formLinkText.trim())
      formData.append('link_url', formLinkUrl.trim())
      formData.append('secondary_link_text', formSecondaryLinkText.trim())
      formData.append('secondary_link_url', formSecondaryLinkUrl.trim())
      formData.append('is_active', String(formIsActive))

      if (formThumbnail) {
        formData.append('thumbnail', formThumbnail)
      } else if (editingBanner?.image_url) {
        formData.append('existing_image_url', editingBanner.image_url)
      }

      let res
      if (editingBanner) {
        res = await updateBannerAction(editingBanner.id, formData)
      } else {
        res = await createBannerAction(formData)
      }

      if (res.success) {
        toast(editingBanner ? 'Banner updated successfully!' : 'Banner created successfully!')
        setShowModal(false)
        await loadBanners()
      } else {
        toast(res.error || 'Failed to save banner')
      }
    } catch {
      toast('Error saving banner')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(banner: BannerRow) {
    const nextState = !banner.is_active
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextState } : b))
    )
    try {
      const res = await toggleBannerActiveAction(banner.id, nextState)
      if (!res.success) {
        toast(res.error || 'Failed to update status')
        await loadBanners()
      } else {
        toast(nextState ? 'Banner activated' : 'Banner deactivated')
      }
    } catch {
      toast('Failed to toggle status')
      await loadBanners()
    }
  }

  async function handleDelete(banner: BannerRow) {
    setDeletingId(banner.id)
    try {
      const res = await deleteBannerAction(banner.id, banner.image_url)
      if (res.success) {
        toast('Banner deleted successfully.')
        setBanners((prev) => prev.filter((b) => b.id !== banner.id))
      } else {
        toast(res.error || 'Failed to delete banner')
      }
    } catch {
      toast('Failed to delete banner')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  async function handleSeed() {
    try {
      const res = await seedDefaultBannerAction()
      if (res.success) {
        toast('Default banner loaded!')
        await loadBanners()
      } else {
        toast(res.error || 'Failed to seed banner')
      }
    } catch {
      toast('Error seeding default banner')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-foreground-theme tracking-tight">
            Banner Management
          </h1>
          <p className="text-sm text-muted-foreground-theme mt-1">
            Configure announcement, meeting, and recruitment hero banners displayed on the home page.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {banners.length === 0 && (
            <button
              onClick={handleSeed}
              className="px-3.5 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/5 font-mono text-xs transition-colors cursor-pointer"
            >
              Load Default
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              <Plus size={16} />
              <span>Create Banner</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <ManagementCardGridSkeleton count={2} />
        ) : banners.map((banner) => {
            const typeConfig =
              bannerTypeOptions.find((t) => t.value === banner.type) || bannerTypeOptions[4]
          const isConfirmingDelete = deleteConfirmId === banner.id

          return (
            <div
              key={banner.id}
              className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden shadow-xs ${
                banner.is_active
                  ? 'border-gold/30 bg-surface-theme'
                  : 'border-border-theme bg-surface-theme opacity-70'
              }`}
            >
              <div className="relative min-h-[220px] md:min-h-[260px] flex items-center p-6 sm:p-8">
                {/* Background Image / Thumbnail with dark gradient fade */}
                <div className="absolute inset-0 z-0">
                  {banner.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover object-right md:object-[80%_center] opacity-40 dark:opacity-65"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-[#0a0e17] dark:to-[#121927]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white/95 dark:from-[#0a0e17] from-35% via-white/80 dark:via-[#0a0e17]/95 via-55% to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold border ${typeConfig.color}`}
                    >
                      <typeConfig.icon size={11} />
                      {typeConfig.label}
                    </span>
                    {banner.is_active ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                        <CheckCircle2 size={10} /> Active on Home
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground-theme bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-border-theme">
                        <XCircle size={10} /> Inactive
                      </span>
                    )}
                  </div>

                  <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-foreground-theme leading-tight tracking-tight">
                    {banner.title}
                  </h2>

                  {banner.subtitle && (
                    <p className="text-muted-foreground-theme text-xs sm:text-sm leading-relaxed max-w-md">
                      {banner.subtitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {banner.link_text && (
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-mono font-bold text-xs shadow-md">
                        <span>{banner.link_text}</span>
                        <ArrowUpRight size={13} />
                      </div>
                    )}
                    {banner.secondary_link_text && (
                      <div className="text-xs font-mono text-muted-foreground-theme">
                        {banner.secondary_link_text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Management Action Buttons */}
                {isAdmin && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-[#0a0e17]/80 backdrop-blur-md p-1.5 rounded-xl border border-border-theme shadow-md">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        banner.is_active
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-slate-100 dark:bg-white/5 text-muted-foreground-theme hover:text-foreground-theme'
                      }`}
                      title={banner.is_active ? 'Deactivate banner' : 'Activate banner'}
                    >
                      {banner.is_active ? 'Live' : 'Draft'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-gold/10 transition-colors cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit2 size={14} />
                    </button>

                    {/* Delete */}
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(banner)}
                          disabled={deletingId === banner.id}
                          className="px-2 py-1 bg-red-500 text-white font-bold text-[10px] rounded hover:bg-red-600 transition-colors cursor-pointer"
                        >
                          {deletingId === banner.id ? '...' : 'Del'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 text-muted-foreground-theme hover:text-foreground-theme cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(banner.id)}
                        className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete Banner"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {!isLoading && banners.length === 0 && (
          <div className="border border-border-theme rounded-2xl p-12 text-center space-y-4 bg-surface-theme">
            <Megaphone size={32} className="mx-auto text-muted-foreground-theme/40" />
            <div>
              <h3 className="text-foreground-theme font-display font-bold text-base">No Banners Created Yet</h3>
              <p className="text-muted-foreground-theme text-xs mt-1 max-w-sm mx-auto">
                Create a customized announcement or recruitment banner to greet visitors on the home page.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Create First Banner</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d1117] border border-border-theme rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-theme">
              <div>
                <h3 className="font-display font-black text-xl text-foreground-theme">
                  {editingBanner ? 'Edit Banner' : 'Create New Banner'}
                </h3>
                <p className="text-xs text-muted-foreground-theme mt-0.5">
                  Decide what kind of banner to display on the home page hero section.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Banner Type */}
              <FormField label="Banner Type" required>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {bannerTypeOptions.map((opt) => {
                    const isSelected = formType === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormType(opt.value)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-gold/50 bg-gold/10 text-amber-600 dark:text-gold shadow-xs font-bold'
                            : 'border-border-theme bg-slate-50 dark:bg-white/[0.02] text-muted-foreground-theme hover:border-gold/30 hover:text-foreground-theme'
                        }`}
                      >
                        <opt.icon size={14} className={isSelected ? 'text-amber-600 dark:text-gold' : 'text-muted-foreground-theme'} />
                        <span>{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </FormField>

              {/* Title */}
              <FormField label="Banner Title" htmlFor="banner-title" required>
                <input
                  id="banner-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Shape the future of tech with PSITS-UA."
                  className={inputStyles}
                  required
                />
              </FormField>

              {/* Subtitle */}
              <FormField label="Subtitle / Description" htmlFor="banner-subtitle">
                <textarea
                  id="banner-subtitle"
                  rows={3}
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Connect with student developers, designers, and tech innovators across the University of Antique."
                  className={inputStyles}
                />
              </FormField>

              {/* Primary Action Button */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Primary Button Text" htmlFor="banner-link-text">
                  <input
                    id="banner-link-text"
                    type="text"
                    value={formLinkText}
                    onChange={(e) => setFormLinkText(e.target.value)}
                    placeholder="e.g. Join Organization, Register Now"
                    className={inputStyles}
                  />
                </FormField>
                <FormField label="Primary Action URL" htmlFor="banner-link-url">
                  <input
                    id="banner-link-url"
                    type="text"
                    value={formLinkUrl}
                    onChange={(e) => setFormLinkUrl(e.target.value)}
                    placeholder="https://... or /forms/..."
                    className={inputStyles}
                  />
                </FormField>
              </div>

              {/* Secondary Action Button (Optional) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Secondary Button Text (Optional)" htmlFor="banner-sec-text">
                  <input
                    id="banner-sec-text"
                    type="text"
                    value={formSecondaryLinkText}
                    onChange={(e) => setFormSecondaryLinkText(e.target.value)}
                    placeholder="e.g. View Projects, Read Advisory"
                    className={inputStyles}
                  />
                </FormField>
                <FormField label="Secondary Action URL" htmlFor="banner-sec-url">
                  <input
                    id="banner-sec-url"
                    type="text"
                    value={formSecondaryLinkUrl}
                    onChange={(e) => setFormSecondaryLinkUrl(e.target.value)}
                    placeholder="/projects"
                    className={inputStyles}
                  />
                </FormField>
              </div>

              {/* Thumbnail / Cover Image */}
              <FormField label="Cover Thumbnail (R2 Storage)">
                <FileUpload
                  accept="image/*"
                  label="Upload banner thumbnail image"
                  value={formThumbnail}
                  preview={thumbnailPreview}
                  onChange={handleThumbnailChange}
                  maxSizeMB={5}
                />
              </FormField>

              {/* Creator Credit */}
              <FormField
                label="Thumbnail / Artwork Credit (Optional)"
                htmlFor="banner-credit"
                hint="Designer or team member credited for this thumbnail (visible on the homepage info tooltip)."
              >
                <input
                  id="banner-credit"
                  type="text"
                  value={formCredit}
                  onChange={(e) => setFormCredit(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz (Pubmat Lead) or PSITS Pubmat"
                  className={inputStyles}
                />
              </FormField>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.02] border border-border-theme rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground-theme select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-border-theme text-gold focus:ring-gold/30 bg-surface-theme"
                  />
                  <span className="font-semibold text-foreground-theme">Active (Display on Home Page)</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-muted-foreground-theme hover:text-foreground-theme transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-[#0D1117] font-display font-bold text-xs hover:bg-[#FFA726] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save size={14} />
                  <span>{isSubmitting ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
