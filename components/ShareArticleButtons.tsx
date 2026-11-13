'use client'

import { useState, useEffect, useRef } from 'react'
import { Check, Link as LinkIcon, Heart, Bookmark } from 'lucide-react'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import { getArticleReactionsAction, toggleArticleReactionAction } from '@/app/community/actions'
import { getClientUserIdentifier } from '@/lib/client-identity'

interface ShareArticleButtonsProps {
  url: string
  title: string
  articleId?: string
}

export default function ShareArticleButtons({ url, title, articleId }: ShareArticleButtonsProps) {
  const [copied, setCopied] = useState(false)

  const itemKey = articleId || url.split('/').filter(Boolean).pop() || 'article'
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isSubmittingLike, setIsSubmittingLike] = useState(false)
  const userIdentifierRef = useRef<string>('')

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | undefined

    // 1. Initial cached bookmarks & local storage sync
    try {
      const savedPosts = JSON.parse(localStorage.getItem('psits_community_saved_posts') || '[]')
      setIsSaved(savedPosts.includes(itemKey))

      const likedPosts = JSON.parse(localStorage.getItem('psits_community_liked_posts') || '[]')
      if (likedPosts.includes(itemKey)) {
        setIsLiked(true)
      }
    } catch {}

    // 2. Fetch authoritative reactions from Appwrite Cloud & set up Realtime
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

  const handleToggleLike = async () => {
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
      console.error('[Error toggling reaction]:', err)
    } finally {
      setIsSubmittingLike(false)
    }
  }

  const handleToggleSave = () => {
    const nextSaved = !isSaved
    setIsSaved(nextSaved)

    try {
      const savedPosts = JSON.parse(localStorage.getItem('psits_community_saved_posts') || '[]')
      const updated = nextSaved
        ? Array.from(new Set([...savedPosts, itemKey]))
        : savedPosts.filter((id: string) => id !== itemKey)
      localStorage.setItem('psits_community_saved_posts', JSON.stringify(updated))
    } catch {}
  }

  const handleCopy = async () => {
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
  }

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0">
      {/* React / Like Button */}
      <button
        onClick={handleToggleLike}
        type="button"
        disabled={isSubmittingLike}
        className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 hover:bg-rose-500/10 dark:bg-white/[0.04] dark:hover:bg-rose-500/15 border border-slate-200 hover:border-rose-500/30 dark:border-white/10 text-slate-800 dark:text-slate-200 transition-all shadow-sm cursor-pointer select-none active:scale-95 shrink-0 disabled:opacity-70"
        title={isLiked ? "Unlike article" : "React to article"}
        aria-label="React to article"
      >
        <Heart
          size={14}
          className={`transition-transform duration-200 shrink-0 ${
            isLiked ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-600 dark:text-slate-400 hover:text-rose-500"
          }`}
        />
        <span className={isLiked ? "text-rose-500" : ""}>{likesCount}</span>
      </button>

      {/* Bookmark / Save Button */}
      <button
        onClick={handleToggleSave}
        type="button"
        className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 hover:bg-amber-500/10 dark:bg-white/[0.04] dark:hover:bg-gold/15 border border-slate-200 hover:border-amber-500/30 dark:border-white/10 text-slate-800 dark:text-slate-200 transition-all shadow-sm cursor-pointer select-none active:scale-95 shrink-0"
        title={isSaved ? "Saved to community profile (Click to remove)" : "Save to community profile"}
        aria-label="Save to community profile"
      >
        <Bookmark
          size={14}
          className={`transition-transform duration-200 shrink-0 ${
            isSaved ? "fill-gold text-gold scale-110" : "text-slate-600 dark:text-slate-400 hover:text-gold"
          }`}
        />
        <span className={`hidden sm:inline ${isSaved ? "text-amber-600 dark:text-gold" : ""}`}>
          {isSaved ? "Saved" : "Save"}
        </span>
      </button>

      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        type="button"
        className="inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono font-bold bg-slate-100 hover:bg-amber-500/10 dark:bg-white/[0.04] dark:hover:bg-gold/10 border border-slate-200 hover:border-amber-500/30 dark:border-white/10 dark:hover:border-gold/30 text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-gold transition-all shadow-sm cursor-pointer shrink-0"
        title={copied ? "Link Copied!" : "Copy article link"}
        aria-label="Copy article link"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">Link Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon size={14} className="text-amber-600 dark:text-gold shrink-0" />
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </button>

      {/* Facebook Share Button */}
      <button
        onClick={handleFacebookShare}
        type="button"
        className="inline-flex items-center gap-1.5 sm:gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono font-bold bg-[#1877F2]/10 border border-[#1877F2]/30 hover:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#4294ff] transition-all shadow-sm cursor-pointer shrink-0"
        title="Share on Facebook"
        aria-label="Share on Facebook"
      >
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="hidden sm:inline">Share</span>
      </button>
    </div>
  )
}
