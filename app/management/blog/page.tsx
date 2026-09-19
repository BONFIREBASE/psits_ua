'use client'

import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Search,
  Calendar,
  Tag,
  ExternalLink,
  Trash2,
  Database,
  Loader2,
  FileEdit,
  X,
  UploadCloud,
  CheckCircle2,
  Bold,
  Italic,
  Heading,
  List,
  Link2,
  Quote,
} from 'lucide-react'
import { socialDispatches, type SocialDispatch } from '@/data/announcements'
import { getPosts, postRowToSocialDispatch, getOfficers, type OfficerRow } from '@/lib/supabase'
import { deleteBlogPost, seedInitialPosts, updateBlogPost } from './actions'
import StatusBadge from '../_components/StatusBadge'
import { ManagementListSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import Select from '../_components/Select'

export default function BlogListPage() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<SocialDispatch[]>(socialDispatches)
  const [isLiveFromDb, setIsLiveFromDb] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [allMembers, setAllMembers] = useState<OfficerRow[]>([])

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<SocialDispatch | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editHighlightQuote, setEditHighlightQuote] = useState('')
  const [editQuoteAuthor, setEditQuoteAuthor] = useState('')
  const [editPostUrl, setEditPostUrl] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCredits, setEditCredits] = useState<Array<{ role: string; name: string }>>([])
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null)
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null)

  // Load posts from database
  async function loadPosts() {
    try {
      const liveData = await getPosts()
      if (liveData && liveData.length > 0) {
        setPosts(liveData.map(postRowToSocialDispatch))
        setIsLiveFromDb(true)
      } else {
        setIsLiveFromDb(false)
      }
    } catch {
      setIsLiveFromDb(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Load all members (officers + pubmat) for credits
  async function loadMembers() {
    try {
      const members = await getOfficers()
      setAllMembers(members)
    } catch (error) {
      console.error('Failed to load members:', error)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPosts()
    loadMembers()
  }, [])

  function handleOpenEdit(post: SocialDispatch) {
    setEditingPost(post)
    setEditTitle(post.title)
    setEditCategory(post.category)
    setEditDate(post.date)
    setEditContent(post.fullContent || post.excerpt || '')
    setEditHighlightQuote(post.highlightQuote || '')
    setEditQuoteAuthor(post.quoteAuthor || '')
    setEditPostUrl(post.postUrl || '')
    setEditTags(post.tags?.join(', ') || '')
    // Parse credits object into array format
    const creditsArray: Array<{ role: string; name: string }> = []
    if (post.credits) {
      const c = post.credits as Record<string, string>
      Object.entries(c).forEach(([role, name]) => {
        if (name) {
          // Capitalize first letter of role for display
          const displayRole = role.charAt(0).toUpperCase() + role.slice(1)
          creditsArray.push({ role: displayRole, name })
        }
      })
    }
    setEditCredits(creditsArray)
    setEditThumbnail(null)
    setEditThumbnailPreview(post.imageUrl || null)
  }

  function handleCloseEdit() {
    setEditingPost(null)
    setEditThumbnail(null)
    setEditThumbnailPreview(null)
    setEditCredits([])
  }

  function insertEditFormatting(type: string) {
    const textarea = document.getElementById('edit-blog-content') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editContent.substring(start, end)
    let insert = ''

    switch (type) {
      case 'bold': insert = `**${selected || 'bold text'}**`; break
      case 'italic': insert = `*${selected || 'italic text'}*`; break
      case 'heading': insert = `\n## ${selected || 'Heading'}\n`; break
      case 'list': insert = `\n- ${selected || 'List item'}\n`; break
      case 'link': insert = `[${selected || 'link text'}](url)`; break
      case 'quote': insert = `\n> ${selected || 'Quote'}\n`; break
    }

    const newContent = editContent.substring(0, start) + insert + editContent.substring(end)
    setEditContent(newContent)
    
    // Refocus textarea after state update
    setTimeout(() => {
      textarea.focus()
      const newPos = start + insert.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  async function handleUpdateSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editingPost) return

    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.append('title', editTitle)
      formData.append('category', editCategory)
      formData.append('date', editDate)
      formData.append('fullContent', editContent)
      formData.append('highlightQuote', editHighlightQuote)
      formData.append('quoteAuthor', editQuoteAuthor)
      formData.append('postUrl', editPostUrl)
      formData.append('tags', editTags)
      formData.append('credits', JSON.stringify(editCredits))
      if (editThumbnail) {
        formData.append('thumbnail', editThumbnail)
      }

      const res = await updateBlogPost(editingPost.id, formData)
      if (res.success) {
        toast('Post updated successfully!')
        await loadPosts()
        handleCloseEdit()
      } else {
        toast(res.error || 'Failed to update post')
      }
    } catch {
      toast('Failed to update post')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete(id: string, imageUrl?: string) {
    setDeletingId(id)
    try {
      const res = await deleteBlogPost(id, imageUrl)
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
        toast('Post deleted successfully.')
      } else {
        toast(res.error || 'Failed to delete post')
      }
    } catch {
      toast('Failed to delete post')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  async function handleSeed() {
    setIsSeeding(true)
    try {
      const res = await seedInitialPosts()
      if (res.success) {
        await loadPosts()
        toast('Initial announcements synced into database!')
      } else {
        toast(res.error || 'Failed to sync initial posts')
      }
    } catch {
      toast('Error syncing to database')
    } finally {
      setIsSeeding(false)
    }
  }

  // Memoized categories and filtered posts for better performance
  const categories = useMemo(() => {
    return ['All', ...new Set(posts.map((d) => d.category))]
  }, [posts])

  const filtered = useMemo(() => {
    return posts.filter((d) => {
      const matchesSearch =
        !search ||
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.excerpt.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoryFilter === 'All' || d.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [posts, search, categoryFilter])

  // Memoized statistics
  const stats = useMemo(() => {
    return {
      total: posts.length,
      byCategory: posts.reduce((acc, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }, [posts])

  // Memoized handlers for better performance
  const handleOpenEditCallback = useCallback((post: SocialDispatch) => {
    handleOpenEdit(post)
  }, [])

  const handleDeleteCallback = useCallback((id: string) => {
    setDeleteConfirmId(id)
  }, [])

  const handleDeleteConfirmCallback = useCallback((id: string, imageUrl?: string) => {
    handleDelete(id, imageUrl)
  }, [])

  const handleDeleteCancelCallback = useCallback(() => {
    setDeleteConfirmId(null)
  }, [])

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-black text-2xl text-foreground-theme tracking-tight">
              Blog / Dispatches
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                isLiveFromDb
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold'
                  : 'bg-gold/15 text-amber-600 dark:text-gold border border-gold/25 font-bold'
              }`}
            >
              {isLiveFromDb ? 'Live Database' : 'Local Fallback'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground-theme mt-1">
            Manage social dispatches, event recaps, and announcements. {stats.total} total posts.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {!isLiveFromDb && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gold/30 bg-gold/10 hover:bg-gold/15 text-amber-600 dark:text-gold text-xs font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer"
              title="Sync the current static announcements into database"
            >
              {isSeeding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Database size={14} />
              )}
              <span>Sync Posts to Database</span>
            </button>
          )}
          <Link
            href="/management/blog/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit cursor-pointer"
          >
            <Plus size={16} />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground-theme" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-surface-theme border border-border-theme rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer
                ${categoryFilter === cat
                  ? 'bg-gold/15 text-amber-600 dark:text-gold border border-gold/25 font-bold'
                  : 'bg-surface-theme text-muted-foreground-theme border border-border-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <ManagementListSkeleton count={4} />
        ) : (
          <>
            {filtered.map((dispatch) => (
              <DispatchRow
                key={dispatch.id}
                dispatch={dispatch}
                isDeleting={deletingId === dispatch.id}
                deleteConfirmId={deleteConfirmId}
                onEdit={() => handleOpenEditCallback(dispatch)}
                onDelete={() => handleDeleteCallback(dispatch.id)}
                onDeleteConfirm={() => handleDeleteConfirmCallback(dispatch.id, dispatch.imageUrl)}
                onDeleteCancel={handleDeleteCancelCallback}
              />
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-muted-foreground-theme">No posts match your filters.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Interactive Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0d1219] border border-border-theme rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-theme bg-slate-50 dark:bg-[#0a0e17]/80">
              <div className="flex items-center gap-2">
                <FileEdit size={16} className="text-amber-600 dark:text-gold" />
                <h2 className="font-display font-bold text-foreground-theme text-base">Edit Post</h2>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="p-1 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                  Post Title <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-foreground-theme focus:outline-none focus:border-gold/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121929] border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-foreground-theme focus:outline-none focus:border-gold/50"
                  >
                    <option value="Official Advisory">Official Advisory</option>
                    <option value="Campus Event">Campus Event</option>
                    <option value="Event Recap">Event Recap</option>
                    <option value="Recruitment">Recruitment</option>
                    <option value="Announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                    Publish Date
                  </label>
                  <input
                    type="text"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    placeholder="e.g. September 18, 2026"
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-foreground-theme focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                  Cover Image Banner (Max 5MB)
                </label>
                <div className="flex items-center gap-4">
                  {editThumbnailPreview && (
                    <div className="relative w-28 h-16 rounded-lg overflow-hidden border border-border-theme shrink-0">
                      <Image
                        src={editThumbnailPreview}
                        alt="Preview"
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <label className="flex-1 flex flex-col items-center justify-center p-3 border border-dashed border-border-theme hover:border-gold/40 rounded-xl cursor-pointer bg-slate-50 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-all">
                    <UploadCloud size={18} className="text-amber-600 dark:text-gold/80 mb-0.5" />
                    <span className="text-[11px] text-muted-foreground-theme font-mono">
                      {editThumbnail ? editThumbnail.name : 'Click to replace cover photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditThumbnail(file)
                          setEditThumbnailPreview(URL.createObjectURL(file))
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                  Full Content (Markdown Supported) <span className="text-gold">*</span>
                </label>
                <div className="space-y-0">
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-100 dark:bg-white/[0.03] border border-border-theme border-b-0 rounded-t-xl">
                    {[
                      { icon: Bold, type: 'bold', label: 'Bold' },
                      { icon: Italic, type: 'italic', label: 'Italic' },
                      { icon: Heading, type: 'heading', label: 'Heading' },
                      { icon: List, type: 'list', label: 'List' },
                      { icon: Link2, type: 'link', label: 'Link' },
                      { icon: Quote, type: 'quote', label: 'Quote' },
                    ].map((btn) => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => insertEditFormatting(btn.type)}
                        title={btn.label}
                        className="p-1.5 rounded text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <btn.icon size={14} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="edit-blog-content"
                    required
                    rows={6}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-b-xl rounded-t-none p-3 text-xs text-foreground-theme placeholder:text-muted-foreground-theme/40 focus:outline-none focus:border-gold/50 leading-relaxed font-body"
                  />
                </div>
              </div>

              {/* Quotes and Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                    Highlight Quote (Optional)
                  </label>
                  <input
                    type="text"
                    value={editHighlightQuote}
                    onChange={(e) => setEditHighlightQuote(e.target.value)}
                    placeholder="Short standout statement..."
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-foreground-theme focus:outline-none focus:border-gold/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                    Quote Author (Optional)
                  </label>
                  <input
                    type="text"
                    value={editQuoteAuthor}
                    onChange={(e) => setEditQuoteAuthor(e.target.value)}
                    placeholder="e.g. Dean / President"
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-foreground-theme focus:outline-none focus:border-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80 mb-1.5">
                  External Post URL (Facebook / Article)
                </label>
                <input
                  type="url"
                  value={editPostUrl}
                  onChange={(e) => setEditPostUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3.5 py-2.5 text-xs text-foreground-theme focus:outline-none focus:border-gold/50"
                />
              </div>

              {/* Credits Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-foreground-theme/80">
                    Content Credits (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditCredits([...editCredits, { role: '', name: '' }])}
                    className="text-xs text-amber-600 dark:text-gold hover:underline font-mono cursor-pointer"
                  >
                    + Add Credit
                  </button>
                </div>
                
                {editCredits.map((credit, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground-theme mb-1.5">
                        Role
                      </label>
                      <Select
                        id={`edit-credit-role-${index}`}
                        value={credit.role}
                        onChange={(val) => {
                          const updated = [...editCredits]
                          updated[index].role = val
                          setEditCredits(updated)
                        }}
                        placeholder="Select role"
                        options={[
                          { value: 'Pubmat', label: 'Pubmat' },
                          { value: 'Writer', label: 'Writer' },
                          { value: 'Videographer', label: 'Videographer' },
                          { value: 'Photographer', label: 'Photographer' },
                          { value: 'Prepared by', label: 'Prepared by' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground-theme mb-1.5">
                        Member
                      </label>
                      <Select
                        id={`edit-credit-name-${index}`}
                        value={credit.name}
                        onChange={(val) => {
                          const updated = [...editCredits]
                          updated[index].name = val
                          setEditCredits(updated)
                        }}
                        placeholder="Select member"
                        options={allMembers.map(m => ({ value: m.name, label: m.name }))}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditCredits(editCredits.filter((_, i) => i !== index))}
                      className="mb-1 p-2 text-muted-foreground-theme hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      title="Remove credit"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                
                {editCredits.length === 0 && (
                  <p className="text-xs text-muted-foreground-theme text-center py-3">No credits added yet. Click &quot;+ Add Credit&quot; to add team members.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-border-theme flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-muted-foreground-theme hover:text-foreground-theme transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function DispatchRow({
  dispatch,
  isDeleting,
  deleteConfirmId,
  onEdit,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  dispatch: SocialDispatch
  isDeleting?: boolean
  deleteConfirmId?: string | null
  onEdit?: () => void
  onDelete?: () => void
  onDeleteConfirm?: () => void
  onDeleteCancel?: () => void
}) {
  const isConfirming = deleteConfirmId === dispatch.id

  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-border-theme hover:border-gold/30 bg-surface-theme shadow-xs transition-all duration-300">
      {/* Thumbnail */}
      <div className="w-16 h-16 sm:w-20 sm:h-14 rounded-lg bg-slate-100 dark:bg-surface/60 overflow-hidden flex-shrink-0 relative border border-border-theme">
        {dispatch.imageUrl ? (
          <Image
            src={dispatch.imageUrl}
            alt={dispatch.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag size={16} className="text-muted-foreground-theme/30" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-display font-bold text-foreground-theme group-hover:text-amber-600 dark:group-hover:text-gold transition-colors truncate">
            {dispatch.title}
          </h3>
          <StatusBadge status="Published" />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground-theme font-mono">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {dispatch.date}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-muted-foreground-theme border border-border-theme">
            {dispatch.category}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isConfirming ? (
          <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
            <span className="text-red-500 text-[11px] font-medium">Confirm delete?</span>
            <button
              onClick={onDeleteConfirm}
              disabled={isDeleting}
              className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                'Yes'
              )}
            </button>
            <button
              onClick={onDeleteCancel}
              disabled={isDeleting}
              className="px-1.5 py-0.5 rounded text-muted-foreground-theme hover:text-foreground-theme text-[11px] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {dispatch.postUrl && (
              <a
                href={dispatch.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                title="View Source Link"
              >
                <ExternalLink size={14} />
              </a>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="p-2 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                title="Edit post"
              >
                <FileEdit size={14} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-2 rounded-lg text-muted-foreground-theme hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete post"
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
