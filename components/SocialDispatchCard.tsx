'use client'

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import ProgressiveImage from './ProgressiveImage'
import { X, ArrowUpRight, MapPin, Calendar, Quote, PenTool, Camera, Palette, Clock, Video, FileText, Maximize2, Link as LinkIcon, Check, Heart, Bookmark } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SocialDispatch } from '@/data/announcements'
import MarkdownContent from './MarkdownContent'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import { getArticleReactionsAction, toggleArticleReactionAction } from '@/app/community/actions'
import { getClientUserIdentifier } from '@/lib/client-identity'

interface SocialDispatchCardProps {
  dispatch: SocialDispatch
  isActive?: boolean
}

const emptySubscribe = () => () => {}

export default function SocialDispatchCard({ dispatch, isActive = true }: SocialDispatchCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  const open = useCallback(() => {
    if (isActive) setIsOpen(true)
  }, [isActive])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  const [copied, setCopied] = useState(false)

  const getArticleUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/blog/${dispatch.slug || dispatch.id}`
    }
    return `https://psitsua.vercel.app/blog/${dispatch.slug || dispatch.id}`
  }, [dispatch.slug, dispatch.id])

  const handleCopy = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const url = getArticleUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [getArticleUrl])

  const handleFacebookShare = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const url = getArticleUrl()
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500')
  }, [getArticleUrl])

  const itemKey = dispatch.slug || dispatch.id
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubmittingLike, setIsSubmittingLike] = useState(false)
  const userIdentifierRef = useRef<string>('')

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | undefined

    try {
      const likedPosts = JSON.parse(localStorage.getItem('psits_community_liked_posts') || '[]')
      if (likedPosts.includes(itemKey)) {
        setIsLiked(true)
      }

      const savedPosts = JSON.parse(localStorage.getItem('psits_community_saved_posts') || '[]')
      setIsSaved(savedPosts.includes(itemKey))
    } catch {}

    async function loadAppwriteReactions() {
      const id = await getClientUserIdentifier()
      userIdentifierRef.current = id

      const res = await getArticleReactionsAction({
        articleId: itemKey,
        userIdentifier: id,
      })

      if (isMounted && res.success) {
        setLikesCount(res.likesCount)
        if (res.hasReacted) {
          setIsLiked(true)
        }
      }

      // Appwrite Realtime WebSocket subscription
      try {
        const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.REACTIONS}.documents`
        unsubscribe = appwrite.subscribe(channel, (response: { events: string[]; payload: Record<string, unknown> }) => {
          if (!isMounted) return
          const payload = response.payload
          const safeKey = itemKey.slice(0, 50)
          if (payload && String(payload.post_id) === safeKey) {
            const isCreate = response.events.some((e) => e.includes('.create'))
            const isDelete = response.events.some((e) => e.includes('.delete'))
            if (isCreate) {
              setLikesCount((prev) => prev + 1)
            } else if (isDelete) {
              setLikesCount((prev) => Math.max(0, prev - 1))
            }
          }
        })
      } catch (err) {
        console.warn('[Appwrite Realtime Reaction warning]:', err)
      }
    }

    loadAppwriteReactions()

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [itemKey])

  const handleToggleLike = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isSubmittingLike) return
    setIsSubmittingLike(true)

    const nextLiked = !isLiked
    setIsLiked(nextLiked)
    setLikesCount((prev) => Math.max(0, prev + (nextLiked ? 1 : -1)))

    try {
      const likedPosts = JSON.parse(localStorage.getItem('psits_community_liked_posts') || '[]')
      const updated = nextLiked
        ? Array.from(new Set([...likedPosts, itemKey]))
        : likedPosts.filter((id: string) => id !== itemKey)
      localStorage.setItem('psits_community_liked_posts', JSON.stringify(updated))
    } catch {}

    const id = userIdentifierRef.current || (await getClientUserIdentifier())
    userIdentifierRef.current = id

    try {
      const res = await toggleArticleReactionAction({
        articleId: itemKey,
        userIdentifier: id,
      })
      if (res.success) {
        setLikesCount(res.newLikesCount)
        setIsLiked(res.hasReacted)
      }
    } catch (err) {
      console.error('[Error toggling reaction in modal]:', err)
    } finally {
      setIsSubmittingLike(false)
    }
  }, [isLiked, isSubmittingLike, itemKey])

  const handleToggleSave = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nextSaved = !isSaved
    setIsSaved(nextSaved)

    try {
      const savedPosts = JSON.parse(localStorage.getItem('psits_community_saved_posts') || '[]')
      const updated = nextSaved
        ? Array.from(new Set([...savedPosts, itemKey]))
        : savedPosts.filter((id: string) => id !== itemKey)
      localStorage.setItem('psits_community_saved_posts', JSON.stringify(updated))
    } catch {}
  }, [isSaved, itemKey])

  return (
    <>
      <article
        role="button"
        tabIndex={isActive ? 0 : -1}
        onClick={open}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && isActive) { e.preventDefault(); open() } }}
        className={`
          group relative cursor-pointer rounded-2xl overflow-hidden
          bg-surface border border-black/10 dark:border-white/10 transition-all duration-500 flex flex-col
          ${isActive ? 'hover:border-gold/60 dark:hover:border-white/25 shadow-sm dark:shadow-2xl hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_24px_60px_rgba(0,0,0,0.85)]' : 'border-black/5 dark:border-white/5 opacity-75'}
        `}
      >
        {dispatch.imageUrl && (
          <div className="relative w-full aspect-[16/9] sm:aspect-[16/8.5] md:aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-[#0a0e17] shrink-0">
            <ProgressiveImage
              src={dispatch.imageUrl}
              alt={dispatch.title}
              fill
              className={`object-cover object-center transition-transform duration-700 ease-out ${isActive ? 'group-hover:scale-[1.03]' : ''}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 650px, 750px"
              priority
              ambientGlow
            />
          </div>
        )}

        <div className="relative p-4 sm:p-5 flex flex-col justify-between bg-surface/95 border-t border-black/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-[11px] sm:text-[12px] font-mono mb-2">
              <span
                className="uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-gold/15 border border-gold/30 text-gold"
              >
                {dispatch.category}
              </span>
              <span className="text-slate-400 dark:text-white/30">•</span>
              <span className="font-medium text-slate-600 dark:text-white/80">
                {dispatch.date}
              </span>
            </div>

            <h3
              className="font-display font-bold text-[14px] sm:text-[15px] md:text-[16px] leading-[1.35] tracking-tight text-slate-900 dark:text-white"
            >
              {dispatch.title}
            </h3>
          </div>

          {isActive && (
            <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <span
                className="text-[11px] sm:text-[12px] font-mono tracking-wider uppercase transition-all duration-300 group-hover:translate-x-1 text-gold"
              >
                Tap to read full details →
              </span>
              <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gold/40 bg-surface shadow-sm">
                  <Image
                    src="/assets/logo/PSITS logo.png"
                    alt="PSITS-UA"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  key="dispatch-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={close}
                  className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md"
                />

                <motion.div
                  key="dispatch-modal"
                  initial={{ opacity: 0, y: 30, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center overflow-y-auto pt-14 pb-0 sm:py-8 sm:px-6"
                  onClick={close}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full sm:max-w-3xl lg:max-w-4xl bg-surface border-t border-x border-black/10 dark:border-white/10 sm:border sm:border-black/10 sm:dark:border-white/15 rounded-t-3xl sm:rounded-2xl overflow-hidden overflow-y-auto max-h-[92dvh] sm:max-h-[88vh] shadow-[0_25px_70px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.95)] scrollbar-minimal flex flex-col"
                  >
                    <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-surface/90 backdrop-blur-md border-b border-black/10 dark:border-white/10">
                      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                        <div className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden shrink-0 border border-gold/40">
                          <Image
                            src="/assets/logo/PSITS logo.png"
                            alt="PSITS-UA"
                            fill
                            className="object-contain p-0.5"
                          />
                        </div>
                        <span className="font-display font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-white truncate max-w-[110px] xs:max-w-[160px] sm:max-w-none">
                          PSITS-UA Announcement
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* React / Heart Button (Just like community) */}
                        <button
                          type="button"
                          onClick={handleToggleLike}
                          disabled={isSubmittingLike}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-rose-500/10 dark:bg-white/[0.08] dark:hover:bg-rose-500/20 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer text-xs font-mono select-none active:scale-95 disabled:opacity-70"
                          title={isLiked ? "Unlike announcement" : "React to announcement"}
                          aria-label="React to announcement"
                        >
                          <Heart
                            size={14}
                            className={`transition-transform duration-200 ${
                              isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-600 dark:text-slate-300 hover:text-rose-500"
                            }`}
                          />
                          <span className={`text-[11px] font-bold ${isLiked ? "text-rose-500" : "text-slate-600 dark:text-slate-300"}`}>
                            {likesCount}
                          </span>
                        </button>

                        {/* Save / Bookmark Button (Reflects in community profile) */}
                        <button
                          type="button"
                          onClick={handleToggleSave}
                          className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-gold/15 dark:bg-white/[0.08] dark:hover:bg-gold/20 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer select-none active:scale-95"
                          title={isSaved ? "Saved (Remove from saved)" : "Save to community profile"}
                          aria-label="Save announcement"
                        >
                          <Bookmark
                            size={15}
                            className={`transition-transform duration-200 ${
                              isSaved ? "fill-gold text-gold scale-110" : "text-slate-600 dark:text-slate-300 hover:text-gold"
                            }`}
                          />
                        </button>

                        {/* Open Article Page (Beside Saved) */}
                        <Link
                          href={`/blog/${dispatch.slug || dispatch.id}`}
                          onClick={close}
                          className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-amber-500/10 dark:bg-white/[0.08] dark:hover:bg-gold/15 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-gold hover:border-amber-500/30 dark:hover:border-gold/30 transition-colors cursor-pointer"
                          title="Open full article page"
                          aria-label="Open full article page"
                        >
                          <Maximize2 size={15} />
                        </Link>

                        {/* Copy Link Icon */}
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="relative p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.08] dark:hover:bg-white/[0.16] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-gold transition-colors cursor-pointer"
                          title={copied ? "Link Copied!" : "Copy article link"}
                          aria-label="Copy article link"
                        >
                          {copied ? (
                            <Check size={15} className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <LinkIcon size={15} />
                          )}
                        </button>

                        {/* Share to Facebook */}
                        <button
                          type="button"
                          onClick={handleFacebookShare}
                          className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-[#1877F2]/10 dark:bg-white/[0.08] dark:hover:bg-[#1877F2]/20 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-[#1877F2] dark:hover:text-[#4294ff] hover:border-[#1877F2]/30 transition-colors cursor-pointer"
                          title="Share on Facebook"
                          aria-label="Share on Facebook"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                        </button>

                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/15 mx-0.5 hidden sm:block" />

                        <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] rounded border border-slate-200/80 dark:border-white/10">
                          ESC
                        </kbd>

                        <button
                          onClick={close}
                          className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:bg-white/[0.08] dark:hover:bg-rose-500/20 dark:hover:border-rose-500/40 dark:hover:text-rose-400 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          aria-label="Close announcement"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {dispatch.imageUrl && (
                      <div className="relative w-full aspect-[16/9] sm:aspect-[2.2/1] bg-slate-100 dark:bg-[#0a0e17] shrink-0 border-b border-black/10 dark:border-white/10">
                        <ProgressiveImage
                          src={dispatch.imageUrl}
                          alt={dispatch.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 800px, 950px"
                          priority
                          ambientGlow
                        />
                      </div>
                    )}

                    <div className="px-6 sm:px-10 lg:px-12 py-8 space-y-6">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
                        <span
                          className="uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold"
                        >
                          {dispatch.category}
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-slate-700 dark:text-white/80">
                          <Calendar size={13} className="text-gold" />
                          {dispatch.date}
                        </span>
                        {dispatch.venue && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 text-slate-700 dark:text-white/80">
                            <MapPin size={13} className="text-gold" />
                            {dispatch.venue}
                          </span>
                        )}
                        {dispatch.deadline && (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 font-bold text-gold">
                            <Clock size={13} className="text-gold" />
                            Deadline: {dispatch.deadline}
                          </span>
                        )}
                      </div>

                      <h1
                        className="font-display font-black text-2xl sm:text-3xl md:text-4xl leading-[1.2] tracking-tight text-slate-900 dark:text-white"
                      >
                        {dispatch.title}
                      </h1>

                      {dispatch.highlightQuote && (
                        <div className="my-6 p-5 sm:p-6 rounded-xl border-l-4 border-gold bg-black/[0.02] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-sm">
                          <div className="flex items-start gap-3">
                            <Quote size={22} className="shrink-0 mt-1 text-gold" />
                            <p
                              className="font-display italic font-bold text-base sm:text-lg md:text-xl leading-relaxed text-slate-900 dark:text-white"
                            >
                              &ldquo;{dispatch.highlightQuote}&rdquo;
                            </p>
                          </div>
                          {dispatch.quoteAuthor && (
                            <p
                              className="text-xs font-mono font-semibold mt-2.5 pl-8 text-gold"
                            >
                              — {dispatch.quoteAuthor}
                            </p>
                          )}
                        </div>
                      )}

                      {Boolean(
                        dispatch.excerpt &&
                          (!dispatch.fullContent ||
                            !dispatch.fullContent
                              .replace(/^[\s\u200B-\u200D\uFEFF\u200E\u200F]+/, '')
                              .replace(/\s+/g, ' ')
                              .toLowerCase()
                              .startsWith(
                                dispatch.excerpt
                                  .replace(/^[\s\u200B-\u200D\uFEFF\u200E\u200F]+/, '')
                                  .replace(/\.\.\.$/, '')
                                  .slice(0, 40)
                                  .replace(/\s+/g, ' ')
                                  .toLowerCase()
                              ))
                      ) && (
                        <div className="pb-6 border-b border-black/10 dark:border-white/10">
                          <p
                            className="text-base sm:text-lg leading-[1.8] font-medium text-slate-900 dark:text-white"
                          >
                            {dispatch.excerpt}
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <MarkdownContent content={dispatch.fullContent} />
                      </div>

                      {dispatch.involvedColleges && dispatch.involvedColleges.length > 0 && (
                        <div className="pt-4">
                          <p
                            className="text-[11px] font-mono uppercase tracking-widest font-bold mb-3 text-gold"
                          >
                            Participating Academic Departments
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {dispatch.involvedColleges.map((college) => (
                              <span
                                key={college}
                                className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/15 font-mono font-medium text-slate-800 dark:text-white"
                              >
                                {college}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono text-slate-600 dark:text-white/70">
                          {dispatch.credits.writer && (
                            <span className="flex items-center gap-1.5">
                              <PenTool size={13} className="text-gold" />
                              Writer: <strong className="text-slate-900 dark:text-white">{dispatch.credits.writer}</strong>
                            </span>
                          )}
                          {dispatch.credits.photographer && (
                            <>
                              {dispatch.credits.writer && <span className="text-black/20 dark:text-white/20">·</span>}
                              <span className="flex items-center gap-1.5">
                                <Camera size={13} className="text-gold" />
                                Photography: <strong className="text-slate-900 dark:text-white">{dispatch.credits.photographer}</strong>
                              </span>
                            </>
                          )}
                          {dispatch.credits.pubmat && (
                            <>
                              {(dispatch.credits.writer || dispatch.credits.photographer) && <span className="text-black/20 dark:text-white/20">·</span>}
                              <span className="flex items-center gap-1.5">
                                <Palette size={13} className="text-gold" />
                                Pubmat: <strong className="text-slate-900 dark:text-white">{dispatch.credits.pubmat}</strong>
                              </span>
                            </>
                          )}
                          {dispatch.credits.videographer && (
                            <>
                              {(dispatch.credits.writer || dispatch.credits.photographer || dispatch.credits.pubmat) && <span className="text-black/20 dark:text-white/20">·</span>}
                              <span className="flex items-center gap-1.5">
                                <Video size={13} className="text-gold" />
                                Videographer: <strong className="text-slate-900 dark:text-white">{dispatch.credits.videographer}</strong>
                              </span>
                            </>
                          )}
                          {(dispatch.credits.publish_by || dispatch.credits.prepared_by) && (
                            <>
                              {(dispatch.credits.writer || dispatch.credits.photographer || dispatch.credits.pubmat || dispatch.credits.videographer) && <span className="text-black/20 dark:text-white/20">·</span>}
                              <span className="flex items-center gap-1.5">
                                <FileText size={13} className="text-gold" />
                                Publish by: <strong className="text-slate-900 dark:text-white">{dispatch.credits.publish_by || dispatch.credits.prepared_by}</strong>
                              </span>
                            </>
                          )}
                        </div>

                        {dispatch.applyUrl && (
                          <a
                            href={dispatch.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold transition-colors cursor-pointer self-start sm:self-auto"
                          >
                            <span>Apply</span>
                            <ArrowUpRight size={13} />
                          </a>
                        )}
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2">
                        {dispatch.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-mono font-medium hover:text-slate-900 dark:hover:text-white transition-colors text-gold/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  )
}
