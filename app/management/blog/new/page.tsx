'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Save, Bold, Italic, Heading, List, Link2, Quote, Loader2 } from 'lucide-react'
import FormField, { inputStyles, textareaStyles } from '../../_components/FormField'
import Select from '../../_components/Select'
import FileUpload from '../../_components/FileUpload'
import { useToast } from '../../_components/Toast'
import { createBlogPost } from '../actions'

const categories = ['Event Recap', 'Campus Event', 'Recruitment', 'Official Advisory'] as const

export default function NewBlogPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    category: '' as string,
    date: '',
    excerpt: '',
    fullContent: '',
    highlightQuote: '',
    quoteAuthor: '',
    postUrl: '',
    tags: '',
    featured: false,
  })

  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleThumbnail(file: File | null) {
    setThumbnail(file)
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file))
    } else {
      setThumbnailPreview(null)
    }
  }

  function insertFormatting(type: string) {
    const textarea = document.getElementById('blog-content') as HTMLTextAreaElement
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = form.fullContent.substring(start, end)
    let insert = ''

    switch (type) {
      case 'bold': insert = `**${selected || 'bold text'}**`; break
      case 'italic': insert = `*${selected || 'italic text'}*`; break
      case 'heading': insert = `\n## ${selected || 'Heading'}\n`; break
      case 'list': insert = `\n- ${selected || 'List item'}\n`; break
      case 'link': insert = `[${selected || 'link text'}](url)`; break
      case 'quote': insert = `\n> ${selected || 'Quote'}\n`; break
    }

    const newContent = form.fullContent.substring(0, start) + insert + form.fullContent.substring(end)
    update('fullContent', newContent)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('category', form.category)
      formData.append('date', form.date)
      formData.append('excerpt', form.excerpt)
      formData.append('fullContent', form.fullContent)
      formData.append('highlightQuote', form.highlightQuote)
      formData.append('quoteAuthor', form.quoteAuthor)
      formData.append('postUrl', form.postUrl)
      formData.append('tags', form.tags)
      formData.append('featured', String(form.featured))
      if (thumbnail) {
        formData.append('thumbnail', thumbnail)
      }

      const res = await createBlogPost(formData)
      if (!res.success) {
        toast(res.error || 'Failed to publish post')
        return
      }

      toast('Blog post published to database and Cloudflare R2!')
      router.push('/management/blog')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Error publishing post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/management/blog"
          className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Create New Post
          </h1>
          <p className="text-sm text-white/35 mt-0.5">
            Write a new blog post or social dispatch.
          </p>
        </div>
      </div>

      {/* Toggle Preview */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPreview(false)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${!showPreview ? 'bg-gold/15 text-gold border border-gold/25' : 'text-white/40 border border-white/8 hover:text-white/60'}`}
        >
          Editor
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${showPreview ? 'bg-gold/15 text-gold border border-gold/25' : 'text-white/40 border border-white/8 hover:text-white/60'}`}
        >
          <Eye size={12} />
          Preview
        </button>
      </div>

      {showPreview ? (
        <PreviewPanel form={form} thumbnailPreview={thumbnailPreview} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <FormField label="Title" htmlFor="blog-title" required>
            <input
              id="blog-title"
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Enter the post title"
              className={inputStyles}
              required
            />
          </FormField>

          {/* Category + Date */}
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Category" required>
              <Select
                id="blog-category"
                value={form.category}
                onChange={(val) => update('category', val)}
                placeholder="Select category"
                options={categories.map((cat) => ({ value: cat, label: cat }))}
              />
            </FormField>

            <FormField label="Date" htmlFor="blog-date" required>
              <input
                id="blog-date"
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                className={`${inputStyles} [color-scheme:dark]`}
                required
              />
            </FormField>
          </div>

          {/* Thumbnail */}
          <FormField label="Thumbnail Image">
            <FileUpload
              accept="image/*"
              label="Upload thumbnail image"
              value={thumbnail}
              preview={thumbnailPreview}
              onChange={handleThumbnail}
              maxSizeMB={5}
            />
          </FormField>

          {/* Excerpt */}
          <FormField label="Excerpt" htmlFor="blog-excerpt" required hint="A short summary displayed in cards and previews.">
            <textarea
              id="blog-excerpt"
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
              placeholder="Brief summary of the post..."
              className={textareaStyles}
              rows={3}
              required
            />
          </FormField>

          {/* Full Content with Toolbar */}
          <FormField label="Full Content" htmlFor="blog-content" required>
            <div className="space-y-0">
              {/* Formatting Toolbar */}
              <div className="flex items-center gap-0.5 px-2 py-1.5 bg-white/[0.03] border border-white/10 border-b-0 rounded-t-lg">
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
                    onClick={() => insertFormatting(btn.type)}
                    title={btn.label}
                    className="p-1.5 rounded text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                  >
                    <btn.icon size={14} />
                  </button>
                ))}
              </div>
              <textarea
                id="blog-content"
                value={form.fullContent}
                onChange={(e) => update('fullContent', e.target.value)}
                placeholder="Write the full post content here... Markdown formatting supported."
                className={`${textareaStyles} rounded-t-none min-h-[200px]`}
                rows={8}
                required
              />
            </div>
          </FormField>

          {/* Quote */}
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Highlight Quote" htmlFor="blog-quote" hint="Optional featured quote.">
              <input
                id="blog-quote"
                type="text"
                value={form.highlightQuote}
                onChange={(e) => update('highlightQuote', e.target.value)}
                placeholder="A memorable quote..."
                className={inputStyles}
              />
            </FormField>
            <FormField label="Quote Author" htmlFor="blog-quote-author">
              <input
                id="blog-quote-author"
                type="text"
                value={form.quoteAuthor}
                onChange={(e) => update('quoteAuthor', e.target.value)}
                placeholder="Who said it"
                className={inputStyles}
              />
            </FormField>
          </div>

          {/* Facebook URL */}
          <FormField label="Facebook Post URL" htmlFor="blog-fb-url" hint="Link to the corresponding Facebook post.">
            <input
              id="blog-fb-url"
              type="url"
              value={form.postUrl}
              onChange={(e) => update('postUrl', e.target.value)}
              placeholder="https://www.facebook.com/..."
              className={inputStyles}
            />
          </FormField>

          {/* Tags */}
          <FormField label="Tags" htmlFor="blog-tags" hint="Comma-separated tags, e.g. #PSITSUA, #Event">
            <input
              id="blog-tags"
              type="text"
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder="#PSITSUA, #EventRecap, #CCIS"
              className={inputStyles}
            />
          </FormField>

          {/* Featured Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`
                w-10 h-5 rounded-full relative transition-colors duration-200
                ${form.featured ? 'bg-gold/40' : 'bg-white/10'}
              `}
              onClick={() => update('featured', !form.featured)}
            >
              <div
                className={`
                  absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
                  ${form.featured ? 'left-[22px] bg-gold' : 'left-0.5 bg-white/40'}
                `}
              />
            </div>
            <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
              Featured post
            </span>
          </label>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Uploading to R2 & DB...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Publish Post</span>
                </>
              )}
            </button>
            <Link
              href="/management/blog"
              className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 border border-white/8 hover:border-white/15 transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}

/* ── Live Preview Panel ── */

function PreviewPanel({
  form,
  thumbnailPreview,
}: {
  form: {
    title: string
    category: string
    date: string
    excerpt: string
    fullContent: string
    highlightQuote: string
    quoteAuthor: string
    tags: string
  }
  thumbnailPreview: string | null
}) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden bg-white/[0.02]">
      {/* Preview Header */}
      <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/6 flex items-center gap-2">
        <Eye size={13} className="text-white/30" />
        <span className="text-[11px] text-white/35 font-mono uppercase tracking-wider">
          Preview
        </span>
      </div>

      <div className="p-6 sm:p-8 space-y-5 max-w-2xl">
        {/* Thumbnail */}
        {thumbnailPreview && (
          <div className="aspect-video rounded-lg overflow-hidden bg-surface/50 border border-white/6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Category + Date */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          {form.category && (
            <span className="px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">
              {form.category}
            </span>
          )}
          {form.date && <span className="text-white/30">{form.date}</span>}
        </div>

        {/* Title */}
        <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-tight">
          {form.title || 'Untitled Post'}
        </h2>

        {/* Excerpt */}
        {form.excerpt && (
          <p className="text-sm text-white/60 leading-relaxed">{form.excerpt}</p>
        )}

        {/* Quote */}
        {form.highlightQuote && (
          <blockquote className="border-l-2 border-gold/30 pl-4 py-2">
            <p className="text-sm text-white/70 italic">
              &ldquo;{form.highlightQuote}&rdquo;
            </p>
            {form.quoteAuthor && (
              <cite className="text-[11px] text-white/35 mt-1 block not-italic">
                — {form.quoteAuthor}
              </cite>
            )}
          </blockquote>
        )}

        {/* Content */}
        {form.fullContent && (
          <div className="text-sm text-white/55 leading-relaxed whitespace-pre-wrap">
            {form.fullContent}
          </div>
        )}

        {/* Tags */}
        {form.tags && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/6">
            {form.tags.split(',').map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-mono text-white/30 bg-white/[0.04] border border-white/6"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
