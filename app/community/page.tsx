'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  FileText,
  ThumbsUp,
  MessageSquare,
  Share2,
  ShieldAlert,
  UserCheck,
  User,
  Sparkles,
  UploadCloud,
  WifiOff,
  Trash2,
  Send,
  X,
  RefreshCw,
  Search,
  Terminal,
  Code2,
  Cpu,
  Layers,
  GraduationCap,
  ShieldCheck,
  Bell,
  Clock,
  Flame,
  Bookmark,
  Check,
  Copy,
  FileCode,
  ImageIcon,
  CheckCircle2,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  CornerDownLeft,
} from 'lucide-react'
import { appwrite, appwriteStorage, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS, APPWRITE_STORAGE_BUCKET_ID } from '@/lib/appwrite'
import {
  getCommunityFeedAction,
  createCommunityPostAction,
  moderatorTakedownPostAction,
  togglePostReactionAction,
  addCommentAction,
  getCommentsForPostAction,
  type CommunityPostItem,
  type CommunityCommentItem
} from './actions'
import { supabase } from '@/lib/supabase'
import { compressImageToWebP } from '@/lib/image-compress'
import { ID } from 'appwrite'
import ScrollReveal from '@/components/ScrollReveal'
import CommunityOnboardingModal, { type CommunityUserProfile } from '@/components/CommunityOnboardingModal'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger } from '@/components/motion/tabs'
import { NumberTicker } from '@/components/motion/number-ticker'

const LOCAL_STORAGE_KEY = 'psits_community_cached_posts_v4'
const TAGS = ['All', 'Announcements', 'Academics', 'Tech & Code', 'Projects', 'Discussions', 'Campus Life'] as const

function formatRelativeTime(dateStr: string): string {
  try {
    const now = Date.now()
    const past = new Date(dateStr).getTime()
    const diffSec = Math.max(0, Math.floor((now - past) / 1000))

    if (diffSec < 60) return 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Recently'
  }
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-[#0c1017] shadow-xl text-left">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/[0.06] text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-slate-400 text-[11px] uppercase tracking-wider pl-1 font-semibold flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-gold" />
            {language || 'code'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px] font-mono"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed scrollbar-thin max-h-96">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function PostMarkdownContent({ content }: { content: string }) {
  const hasMarkdown = /[`#*_[\]<>]/.test(content)

  if (!hasMarkdown) {
    return <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-1">{content}</div>
  }

  return (
    <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed pt-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')
            if (match || codeString.includes('\n')) {
              return <CodeBlock language={match ? match[1] : 'snippet'} code={codeString} />
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.08] font-mono text-[12px] text-amber-600 dark:text-amber-400 font-semibold" {...props}>
                {children}
              </code>
            )
          },
          pre({ children }: React.ComponentPropsWithoutRef<'pre'>) {
            return <div className="my-1">{children}</div>
          },
          a({ href, children }: React.ComponentPropsWithoutRef<'a'>) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline font-medium inline-flex items-center gap-0.5"
              >
                {children}
              </a>
            )
          },
          p({ children }: React.ComponentPropsWithoutRef<'p'>) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>
          },
          ul({ children }: React.ComponentPropsWithoutRef<'ul'>) {
            return <ul className="list-disc list-inside space-y-1 mb-2.5 text-slate-800 dark:text-slate-200">{children}</ul>
          },
          ol({ children }: React.ComponentPropsWithoutRef<'ol'>) {
            return <ol className="list-decimal list-inside space-y-1 mb-2.5 text-slate-800 dark:text-slate-200">{children}</ol>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function renderAvatarIcon(avatarStr?: string, nameStr?: string, className = 'w-5 h-5 text-gold') {
  if (avatarStr?.startsWith('preset:')) {
    const id = avatarStr.replace('preset:', '')
    switch (id) {
      case 'avatar_terminal':
        return <Terminal className={className} />
      case 'avatar_code':
        return <Code2 className={className} />
      case 'avatar_chip':
        return <Cpu className={className} />
      case 'avatar_shield':
        return <ShieldCheck className={className} />
      case 'avatar_layers':
        return <Layers className={className} />
      case 'avatar_student':
        return <GraduationCap className={className} />
      default:
        return <Code2 className={className} />
    }
  }
  return <span className="font-bold text-gold text-xs">{nameStr ? nameStr.charAt(0).toUpperCase() : 'K'}</span>
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTag, setSelectedTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [user, setUser] = useState<{ email: string; name: string; avatar?: string } | null>(null)
  const [userProfile, setUserProfile] = useState<CommunityUserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Onboarding Modal Flow
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<1 | 2 | 3 | 4>(1)

  // Post Creator State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [selectedPostTag, setSelectedPostTag] = useState('Discussions')
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string; type: string }[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Feed Controls & Engagement State
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'discussed'>('latest')
  const [filterOnlyWithFiles, setFilterOnlyWithFiles] = useState(false)
  const [filterOnlyOfficers, setFilterOnlyOfficers] = useState(false)
  const [filterOnlySaved, setFilterOnlySaved] = useState(false)
  const [filterOnlyMyPosts, setFilterOnlyMyPosts] = useState(false)
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([])

  // Minimalist Topic Slider Ref & Smooth Scroll Helper
  const sliderRef = useRef<HTMLDivElement>(null)
  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Hydration-Safe Client Cache Initialization
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed)
          setLoading(false)
        }
      }
      const cachedSaved = localStorage.getItem('psits_community_saved_posts')
      if (cachedSaved) setSavedPostIds(JSON.parse(cachedSaved))
      const cachedLiked = localStorage.getItem('psits_community_liked_posts')
      if (cachedLiked) setUserLikedPosts(JSON.parse(cachedLiked))
      setIsOffline(!navigator.onLine)
    } catch {}
  }, [])

  const handleToggleSavePost = (postId: string) => {
    setSavedPostIds(prev => {
      const updated = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
      try {
        localStorage.setItem('psits_community_saved_posts', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const handleCopyPostLink = (post: CommunityPostItem) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/community#post-${post.$id}` : ''
    if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url)
      setCopiedPostId(post.$id)
      setTimeout(() => setCopiedPostId(null), 2500)
    }
  }

  const handleQuickStarter = (starterText: string, tag: string) => {
    setSelectedPostTag(tag)
    setPostContent(starterText)
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }
    setIsCreateOpen(true)
  }

  // Active Comment Thread Modal
  const [activeCommentPost, setActiveCommentPost] = useState<CommunityPostItem | null>(null)
  const activeCommentPostRef = useRef<CommunityPostItem | null>(null)
  const [comments, setComments] = useState<CommunityCommentItem[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Keep ref in sync with state so the realtime callback always reads the latest value
  useEffect(() => {
    activeCommentPostRef.current = activeCommentPost
  }, [activeCommentPost])

  // Moderator Takedown State
  const [takedownTarget, setTakedownTarget] = useState<CommunityPostItem | null>(null)
  const [takedownReason, setTakedownReason] = useState('')
  const [isTakingDown, setIsTakingDown] = useState(false)

  // Floating New Post Indicator
  const [hasNewPosts, setHasNewPosts] = useState(false)

  /* ─── 1. Feed Fetching with Cache Sync Helper ─── */
  const reloadFeed = useCallback((tag: string) => {
    getCommunityFeedAction(tag)
      .then(res => {
        if (res.success && res.posts) {
          setPosts(res.posts)
          setHasNewPosts(false)
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.posts))
          } catch {
            // ignore
          }
        }
      })
      .catch(err => {
        console.warn('Feed fetch error:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  /* ─── 2. Offline Detection Listeners ─── */
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      reloadFeed(selectedTag)
    }
    const handleOffline = () => {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [reloadFeed, selectedTag])

  /* ─── 2.5 Navbar Action Listeners (Profile, Onboarding & My Posts Triggers) ─── */
  useEffect(() => {
    const handleOpenProfile = () => {
      setOnboardingInitialStep(4)
      setIsOnboardingOpen(true)
    }
    const handleOpenOnboarding = () => {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
    }
    const handleFilterMyPosts = () => {
      setFilterOnlyMyPosts(prev => !prev)
    }
    window.addEventListener('psits:open-profile', handleOpenProfile)
    window.addEventListener('psits:open-onboarding', handleOpenOnboarding)
    window.addEventListener('psits:filter-my-posts', handleFilterMyPosts)
    return () => {
      window.removeEventListener('psits:open-profile', handleOpenProfile)
      window.removeEventListener('psits:open-onboarding', handleOpenOnboarding)
      window.removeEventListener('psits:filter-my-posts', handleFilterMyPosts)
    }
  }, [])

  /* ─── 3. Auth State Sync & Institutional Onboarding Check ─── */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || ''
        const metadata = session.user.user_metadata || {}
        const name = metadata.full_name || email.split('@')[0]
        const avatar = metadata.community_avatar || metadata.avatar_url || ''
        const username = metadata.community_username || ''
        setUser({ email, name, avatar })

        const initialProf: CommunityUserProfile = {
          email,
          name,
          username,
          avatar,
          yearSection: metadata.year_section || 'BSIT 1-A',
          bio: metadata.bio || '',
          hobbies: metadata.hobbies || ['Gaming & Esports', 'Programming'],
          github: metadata.social_github || '',
          linkedin: metadata.social_linkedin || '',
          portfolio: metadata.social_portfolio || '',
          tosAccepted: Boolean(metadata.community_tos_accepted),
          tosAcceptedAt: metadata.community_tos_accepted_at,
        }
        setUserProfile(initialProf)

        if (email.toLowerCase() === 'psits-ua@antiquespride.edu.ph' || email.toLowerCase().includes('admin')) {
          setIsAdmin(true)
        }

        // Check if returned from Google OAuth redirect for Community profile setup or requested step/tour
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const stepParam = urlParams.get('step')
          if (stepParam && ['1', '2', '3', '4'].includes(stepParam)) {
            setOnboardingInitialStep(Number(stepParam) as 1 | 2 | 3 | 4)
            setIsOnboardingOpen(true)
            window.history.replaceState({}, '', window.location.pathname)
          } else if (urlParams.get('onboard') === '1') {
            setOnboardingInitialStep(1)
            setIsOnboardingOpen(true)
            window.history.replaceState({}, '', window.location.pathname)
          } else if (urlParams.get('setup') === '1') {
            setOnboardingInitialStep(4)
            setIsOnboardingOpen(true)
            window.history.replaceState({}, '', window.location.pathname)
          }
        }
      } else {
        // Guest user requested onboarding tour via URL
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const stepParam = urlParams.get('step')
          if (stepParam && ['1', '2', '3', '4'].includes(stepParam)) {
            setOnboardingInitialStep(Number(stepParam) as 1 | 2 | 3 | 4)
            setIsOnboardingOpen(true)
            window.history.replaceState({}, '', window.location.pathname)
          } else if (urlParams.get('onboard') === '1') {
            setOnboardingInitialStep(1)
            setIsOnboardingOpen(true)
            window.history.replaceState({}, '', window.location.pathname)
          }
        }
      }
    }).catch(() => {
      // Guest
    })
  }, [])

  /* ─── 4. Re-fetch Feed on Tag Change ─── */
  useEffect(() => {
    let isMounted = true
    getCommunityFeedAction(selectedTag)
      .then(res => {
        if (isMounted && res.success && res.posts) {
          setPosts(res.posts)
          setHasNewPosts(false)
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.posts))
          } catch {
            // ignore
          }
        }
      })
      .catch(err => {
        console.warn('Feed fetch error:', err)
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedTag])

  /* ─── 4.5 Suppress Appwrite SDK non-fatal WebSocket reconnect logs (dev only) ─── */
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const originalConsoleError = console.error
    console.error = (...args: unknown[]) => {
      // The Appwrite SDK logs "Realtime got disconnected. Reconnect will be attempted in X seconds."
      // This is a non-fatal informational message — the SDK handles reconnection automatically.
      // Next.js Turbopack intercepts ALL console.error calls and renders a full-screen overlay,
      // which is disruptive. Downgrade to console.warn instead.
      if (
        typeof args[0] === 'string' &&
        args[0].includes('Realtime got disconnected')
      ) {
        console.warn('[Appwrite SDK]', ...args)
        return
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [])

  /* ─── 5. Appwrite Realtime Subscriptions (Live Feed & Instant Moderator Takedown) ─── */
  /* Subscribe ONCE on mount. Uses activeCommentPostRef to avoid re-subscribing on every comment toggle. */
  useEffect(() => {
    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.POSTS}.documents`

    const unsubscribe = appwrite.subscribe(channel, (response: { events: string[]; payload: Record<string, unknown> }) => {
      const events = response.events || []
      const payload = response.payload

      const docId = String(payload.$id || '')
      const docStatus = String(payload.status || 'active')

      // Case A: Moderator Takedown / Delete Event -> Purge from screen instantly
      if (
        events.some(e => e.includes('.delete')) ||
        (events.some(e => e.includes('.update')) && docStatus === 'hidden')
      ) {
        setPosts(prev => {
          const filtered = prev.filter(p => p.$id !== docId)
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered))
          } catch {}
          return filtered
        })
        // Read from ref instead of state to avoid re-mounting the subscription
        if (activeCommentPostRef.current?.$id === docId) {
          setActiveCommentPost(null)
        }
        return
      }

      // Case B: Post Created -> Prepend or trigger Floating Indicator
      if (events.some(e => e.includes('.create'))) {
        if (docStatus === 'active') {
          setHasNewPosts(true)
        }
        return
      }

      // Case C: Post Updated (Reactions or Comments Count)
      if (events.some(e => e.includes('.update'))) {
        setPosts(prev =>
          prev.map(p =>
            p.$id === docId
              ? {
                  ...p,
                  likes_count: typeof payload.likes_count === 'number' ? payload.likes_count : p.likes_count,
                  comments_count: typeof payload.comments_count === 'number' ? payload.comments_count : p.comments_count,
                  is_locked: Boolean(payload.is_locked ?? p.is_locked),
                }
              : p
          )
        )
      }
    })

    return () => {
      try {
        unsubscribe()
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ─── 6. Handle File Upload (Compressed WebP / Direct to Appwrite Storage) ─── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingFile(true)
    try {
      let uploadFile: File = file

      // Auto-compress photos to lightweight WebP before uploading
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImageToWebP(file, { maxWidth: 1920, quality: 0.8 })
      }

      // Upload directly to Appwrite Singapore Bucket (0 MB server load!)
      const createdFile = await appwriteStorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        uploadFile
      )

      const sizeStr = (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB'
      setAttachments(prev => [
        ...prev,
        {
          id: createdFile.$id,
          name: file.name,
          size: sizeStr,
          type: file.type.includes('pdf') ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'doc',
        },
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Please verify file size and type.'
      alert(`Upload failed: ${msg}`)
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  /* ─── 7. Handle Create Post Submission ─── */
  const handleCreatePost = async () => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }

    if (!userProfile?.username) {
      setOnboardingInitialStep(4)
      setIsOnboardingOpen(true)
      return
    }

    if (!postContent.trim()) return

    setIsSubmittingPost(true)
    try {
      const authorHandle = userProfile.username.startsWith('@')
        ? userProfile.username
        : `@${userProfile.username}`
      const authorAvatar = userProfile?.avatar || user.avatar
      const authorYearSection = userProfile?.yearSection || 'BSIT'

      const res = await createCommunityPostAction({
        content: postContent,
        userEmail: user.email,
        userName: authorHandle,
        userAvatar: authorAvatar,
        userYearSection: authorYearSection,
        isAnonymous: false,
        tags: [selectedPostTag],
        attachments: attachments.map(a => a.id),
        attachmentNames: attachments.map(a => a.name),
        attachmentTypes: attachments.map(a => a.type),
        attachmentSizes: attachments.map(a => a.size),
      })

      if (res.success && res.post) {
        setPosts(prev => [res.post!, ...prev])
        setPostContent('')
        setAttachments([])
        setIsCreateOpen(false)
      } else {
        alert(res.error || 'Failed to submit post.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.'
      alert(msg)
    } finally {
      setIsSubmittingPost(false)
    }
  }

  /* ─── 8. Handle Reaction Toggle (Optimistic UI & Cache Sync) ─── */
  const handleReaction = async (post: CommunityPostItem) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }

    const isLiked = userLikedPosts.includes(post.$id)
    const nextLiked = !isLiked

    // Optimistic UI update in 0ms
    setUserLikedPosts(prev => {
      const updated = nextLiked ? [...prev, post.$id] : prev.filter(id => id !== post.$id)
      try {
        localStorage.setItem('psits_community_liked_posts', JSON.stringify(updated))
      } catch {}
      return updated
    })

    setPosts(prev =>
      prev.map(p =>
        p.$id === post.$id
          ? { ...p, likes_count: Math.max(0, p.likes_count + (nextLiked ? 1 : -1)) }
          : p
      )
    )

    try {
      const res = await togglePostReactionAction({
        postId: post.$id,
        userEmail: user.email,
        reactionType: 'like',
      })
      if (res.success && typeof res.newLikesCount === 'number') {
        setPosts(prev =>
          prev.map(p =>
            p.$id === post.$id ? { ...p, likes_count: res.newLikesCount! } : p
          )
        )
      }
    } catch {
      // Revert if network failed
      setUserLikedPosts(prev => {
        const reverted = isLiked ? [...prev, post.$id] : prev.filter(id => id !== post.$id)
        try {
          localStorage.setItem('psits_community_liked_posts', JSON.stringify(reverted))
        } catch {}
        return reverted
      })
      setPosts(prev =>
        prev.map(p =>
          p.$id === post.$id
            ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? 1 : -1)) }
            : p
        )
      )
    }
  }

  /* ─── 9. Handle Comments Modal & Submission ─── */
  const openComments = async (post: CommunityPostItem) => {
    setActiveCommentPost(post)
    setCommentsLoading(true)
    try {
      const res = await getCommentsForPostAction(post.$id)
      if (res.success) {
        setComments(res.comments)
      }
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }

    if (!userProfile?.username) {
      setOnboardingInitialStep(4)
      setIsOnboardingOpen(true)
      return
    }

    if (!activeCommentPost || !newCommentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const authorHandle = userProfile.username.startsWith('@')
        ? userProfile.username
        : `@${userProfile.username}`
      const authorAvatar = userProfile?.avatar || user.avatar

      const res = await addCommentAction({
        postId: activeCommentPost.$id,
        content: newCommentText,
        userEmail: user.email,
        userName: authorHandle,
        userAvatar: authorAvatar,
        isAnonymous: false,
      })

      if (res.success && res.comment) {
        setComments(prev => [...prev, res.comment!])
        setNewCommentText('')
        // Optimistically increment post comment counter
        setPosts(prev =>
          prev.map(p =>
            p.$id === activeCommentPost.$id ? { ...p, comments_count: p.comments_count + 1 } : p
          )
        )
      } else {
        alert(res.error || 'Failed to post comment.')
      }
    } finally {
      setIsSubmittingComment(false)
    }
  }

  /* ─── 10. Handle Moderator Content Takedown ─── */
  const handleConfirmTakedown = async () => {
    if (!takedownTarget) return

    setIsTakingDown(true)
    try {
      const res = await moderatorTakedownPostAction({
        postId: takedownTarget.$id,
        reason: takedownReason || 'Violates community guidelines',
        moderatorEmail: user?.email || 'admin',
      })

      if (res.success) {
        setPosts(prev => prev.filter(p => p.$id !== takedownTarget.$id))
        setTakedownTarget(null)
        setTakedownReason('')
      } else {
        alert(res.error || 'Failed to take down post.')
      }
    } finally {
      setIsTakingDown(false)
    }
  }

  // Notification sidebar memoized items (Option C Hybrid)
  const broadcastItems = useMemo(() => {
    return posts.filter(p => p.is_officer || p.tags?.includes('Announcements') || p.tags?.includes('Academics')).slice(0, 5)
  }, [posts])

  const userActivityItems = useMemo(() => {
    if (!user) return []
    const myName = (userProfile?.name || user.name || '').toLowerCase()
    const myUsername = (userProfile?.username || '').replace(/^@/, '').toLowerCase()
    return posts.filter(p => {
      const author = p.author_display_name.toLowerCase()
      const isMine = (myName && author === myName) || (myUsername && author.includes(myUsername))
      return isMine && (p.comments_count > 0 || p.likes_count > 0)
    }).slice(0, 5)
  }, [posts, user, userProfile])

  // Filtered & Sorted post results based on search input, category, tags, and quick-filters
  const filteredPosts = useMemo(() => {
    let list = posts.filter(post => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          post.content.toLowerCase().includes(q) ||
          post.author_display_name.toLowerCase().includes(q) ||
          (post.author_year_section && post.author_year_section.toLowerCase().includes(q)) ||
          (post.tags && post.tags.some(t => t.toLowerCase().includes(q))) ||
          (post.attachment_names && post.attachment_names.some(n => n.toLowerCase().includes(q)))
        if (!matches) return false
      }

      // 2. Attachments Only Filter
      if (filterOnlyWithFiles && (!post.attachments || post.attachments.length === 0)) {
        return false
      }

      // 3. Officers Only Filter
      if (filterOnlyOfficers && !post.is_officer) {
        return false
      }

      // 4. Saved / Bookmarked Only Filter
      if (filterOnlySaved && !savedPostIds.includes(post.$id)) {
        return false
      }

      // 5. My Posts Only Filter
      if (filterOnlyMyPosts) {
        const myName = (userProfile?.name || user?.name || '').toLowerCase()
        const myUsername = (userProfile?.username || '').replace(/^@/, '').toLowerCase()
        const author = post.author_display_name.toLowerCase()
        const isMine = (myName && author === myName) || (myUsername && author.includes(myUsername))
        if (!isMine) return false
      }

      return true
    })

    // 6. Sorting
    if (sortBy === 'popular') {
      list = [...list].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    } else if (sortBy === 'discussed') {
      list = [...list].sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))
    } else {
      // Latest first
      list = [...list].sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    }

    return list
  }, [posts, searchQuery, filterOnlyWithFiles, filterOnlyOfficers, filterOnlySaved, filterOnlyMyPosts, savedPostIds, sortBy, user, userProfile])

  return (
    <div className="pt-20 sm:pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
      {/* ─── Sticky Offline Resilience Banner ─── */}
      {isOffline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] bg-gold text-slate-950 font-semibold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center justify-center gap-2 border border-gold/40 animate-pulse">
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span className="truncate">Offline Mode: Viewing cached threads. Actions will sync when connected.</span>
        </div>
      )}

      {/* ─── Minimalist Topic Slider & Search Bar ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        {/* Minimalist Topic Slider */}
        <div className="relative flex items-center min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => scrollSlider('left')}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-surface hover:bg-surface-subtle text-slate-500 hover:text-slate-900 dark:hover:text-white border border-black/[0.08] dark:border-white/10 shadow-xs mr-1.5 shrink-0 transition-all cursor-pointer opacity-80 hover:opacity-100"
            aria-label="Scroll topics left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={sliderRef}
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth py-1 px-0.5"
          >
            {TAGS.map((tag) => {
              const isSelected = selectedTag === tag
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`relative isolate px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 active:scale-[0.98] ${
                    isSelected
                      ? 'text-slate-950 font-bold'
                      : 'bg-surface hover:bg-surface-subtle text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-black/[0.06] dark:border-white/[0.08] hover:border-gold/30'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="active-category-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-gold rounded-full shadow-xs -z-10"
                    />
                  )}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 inline-block animate-pulse" />}
                  <span>{tag}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollSlider('right')}
            className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-surface hover:bg-surface-subtle text-slate-500 hover:text-slate-900 dark:hover:text-white border border-black/[0.08] dark:border-white/10 shadow-xs ml-1.5 shrink-0 transition-all cursor-pointer opacity-80 hover:opacity-100"
            aria-label="Scroll topics right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions & notes..."
            className="w-full bg-surface border border-black/[0.08] dark:border-white/10 rounded-full pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Reddit 2-Column Layout Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── Main Feed Column (Left / Center, 8 cols) ─── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Realtime Post Update Floating Alert */}
          {hasNewPosts && (
            <div className="sticky top-20 z-40 flex justify-center">
              <button
                onClick={() => reloadFeed(selectedTag)}
                className="px-5 py-2 rounded-full bg-gold text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>↑ New discussions published — Reload</span>
              </button>
            </div>
          )}

          {/* Reddit Compact Create Post Box */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-3.5 sm:p-4 flex items-center gap-3 shadow-sm dark:shadow-none">
            <div className="w-9 h-9 rounded-full bg-surface-subtle border border-gold/30 flex items-center justify-center shrink-0 ring-2 ring-gold/20 overflow-hidden text-gold font-bold text-xs">
              {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                <Image src={userProfile.avatar} alt="Avatar" width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name)
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setOnboardingInitialStep(1)
                  setIsOnboardingOpen(true)
                  return
                }
                setIsCreateOpen(true)
              }}
              className="flex-1 bg-surface-subtle hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-left px-4 py-2.5 rounded-xl text-slate-400 dark:text-white/40 text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Create Post...
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setOnboardingInitialStep(1)
                    setIsOnboardingOpen(true)
                    return
                  }
                  setSelectedPostTag('Academics')
                  setIsCreateOpen(true)
                  setTimeout(() => fileInputRef.current?.click(), 100)
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-gold hover:bg-surface-subtle transition-colors cursor-pointer"
                title="Attach Course Module PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setOnboardingInitialStep(1)
                    setIsOnboardingOpen(true)
                    return
                  }
                  setSelectedPostTag('Tech & Code')
                  setPostContent('```typescript\n// Share code snippet, debugging issue, or architecture question\n\n```\n')
                  setIsCreateOpen(true)
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-gold hover:bg-surface-subtle transition-colors cursor-pointer"
                title="Share Code Snippet"
              >
                <Code2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feed Sort & Quick Filters Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs py-1">
            {/* Sort Modes (beUI animated spring tabs) */}
            <Tabs
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'latest' | 'popular' | 'discussed')}
              variant="pill"
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto flex items-center justify-between p-1 bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] rounded-xl shrink-0">
                <TabsTrigger
                  value="latest"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 text-[10px] sm:text-[11px]"
                >
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Latest</span>
                </TabsTrigger>
                <TabsTrigger
                  value="popular"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 text-[10px] sm:text-[11px]"
                >
                  <Flame className="w-3 h-3 shrink-0" />
                  <span>Trending</span>
                </TabsTrigger>
                <TabsTrigger
                  value="discussed"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 text-[10px] sm:text-[11px]"
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span>Active</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Quick Filter Toggles (Smooth horizontal scroll on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0 w-full sm:w-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setFilterOnlyWithFiles(!filterOnlyWithFiles)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg border font-mono text-[10px] transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  filterOnlyWithFiles
                    ? 'bg-gold/15 border-gold text-gold font-bold shadow-sm'
                    : 'bg-surface border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3 shrink-0" />
                <span>Modules Only</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOnlyOfficers(!filterOnlyOfficers)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg border font-mono text-[10px] transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  filterOnlyOfficers
                    ? 'bg-gold/15 border-gold text-gold font-bold shadow-sm'
                    : 'bg-surface border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>Officers</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOnlySaved(!filterOnlySaved)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg border font-mono text-[10px] transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  filterOnlySaved
                    ? 'bg-gold/15 border-gold text-gold font-bold shadow-sm'
                    : 'bg-surface border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bookmark className="w-3 h-3 shrink-0" />
                <span>Saved ({savedPostIds.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOnlyMyPosts(!filterOnlyMyPosts)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg border font-mono text-[10px] transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                  filterOnlyMyPosts
                    ? 'bg-gold/15 border-gold text-gold font-bold shadow-sm'
                    : 'bg-surface border-black/[0.06] dark:border-white/[0.08] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-3 h-3 shrink-0" />
                <span>My Posts</span>
              </button>
            </div>
          </div>

          {/* ─── Discussions Feed ─── */}
          {loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-surface p-6 space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-subtle" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-32 h-3 bg-surface-subtle rounded-md" />
                      <div className="w-20 h-2 bg-surface-subtle/70 rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="w-full h-3 bg-surface-subtle rounded-md" />
                    <div className="w-3/4 h-3 bg-surface-subtle rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-8 bg-surface/50 space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-inner">
                <MessageSquare className="w-7 h-7" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="font-display font-black text-base text-slate-900 dark:text-white uppercase tracking-wider">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : filterOnlySaved
                    ? 'No bookmarked discussions yet'
                    : filterOnlyWithFiles
                    ? 'No discussions with modules attached'
                    : `No discussions in ${selectedTag}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
                  {searchQuery
                    ? 'Try different keywords or clearing active filters.'
                    : filterOnlySaved
                    ? 'Save discussions with the bookmark icon to review them here.'
                    : 'Be the first student to publish notes or ask an engineering question.'}
                </p>
              </div>

              {/* Quick Discussion Starter Chips */}
              {!searchQuery && !filterOnlySaved && (
                <div className="pt-1 space-y-2 max-w-md mx-auto">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 uppercase tracking-widest block font-semibold">
                    Starter Topics:
                  </span>
                  <div className="flex flex-col gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStarter(
                          '📚 CC104: Algorithm Complexity & Tree Traversal Practice Reviewer\n\nSharing lecture notes and midterm problem sets for fellow BSIT 2nd years...',
                          'Academics'
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-surface hover:bg-gold/15 text-slate-700 dark:text-slate-300 hover:text-gold border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono transition-all text-left cursor-pointer"
                    >
                      📚 CC104 Reviewer Notes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStarter(
                          '⚡ What are the best state management patterns for Next.js 15 App Router?\n\n```typescript\n// How are you structuring shared state across server and client components?\n```\n',
                          'Tech & Code'
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-surface hover:bg-gold/15 text-slate-700 dark:text-slate-300 hover:text-gold border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono transition-all text-left cursor-pointer"
                    >
                      ⚡ Next.js Architecture Question
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStarter(
                          '🛠️ Looking for Capstone Project Teammates (IoT / Mobile / Web)\n\nSeeking collaborators proficient in Flutter or Next.js for our upcoming BSIT capstone...',
                          'Projects'
                        )
                      }
                      className="px-3 py-2 rounded-xl bg-surface hover:bg-gold/15 text-slate-700 dark:text-slate-300 hover:text-gold border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono transition-all text-left cursor-pointer"
                    >
                      🛠️ Capstone Team Callout
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                {(searchQuery || filterOnlyWithFiles || filterOnlyOfficers || filterOnlySaved) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterOnlyWithFiles(false)
                      setFilterOnlyOfficers(false)
                      setFilterOnlySaved(false)
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-slate-500 hover:text-slate-900 dark:hover:text-white border border-black/[0.08] dark:border-white/[0.1] cursor-pointer transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setOnboardingInitialStep(1)
                      setIsOnboardingOpen(true)
                      return
                    }
                    setSelectedPostTag(selectedTag === 'All' ? 'Discussions' : selectedTag)
                    setIsCreateOpen(true)
                  }}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                >
                  Create Post
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, idx) => {
                const isLiked = userLikedPosts.includes(post.$id)
                const isSaved = savedPostIds.includes(post.$id)
                const isCopied = copiedPostId === post.$id

                return (
                  <ScrollReveal key={post.$id} delay={(idx % 3) * 0.04}>
                    <article
                      id={`post-${post.$id}`}
                      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 sm:p-6 space-y-4 shadow-sm dark:shadow-none ${
                        post.is_officer
                          ? 'border-gold/40 dark:border-gold/30 hover:border-gold bg-surface dark:bg-gradient-to-b dark:from-gold/[0.04] dark:to-surface'
                          : 'border-black/[0.08] dark:border-white/[0.08] hover:border-gold/50 dark:hover:border-gold/40 bg-surface'
                      }`}
                    >
                      {/* Officer Accent Top Glow */}
                      {post.is_officer && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
                      )}

                      {/* Reddit-Style Post Header */}
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Community Flair */}
                          <span className="font-mono text-[11px] font-bold text-gold px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/30">
                            c/{post.tags?.[0] || 'Discussions'}
                          </span>
                          <span className="text-slate-300 dark:text-white/20">•</span>
                          {/* Author */}
                          <span className="font-mono text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                            u/{post.author_display_name.startsWith('@') ? post.author_display_name.slice(1) : post.author_display_name}
                          </span>
                          {/* Officer Badge */}
                          {post.is_officer && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-mono font-bold uppercase tracking-wider">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>PSITS {post.officer_title || 'Officer'}</span>
                            </span>
                          )}
                          <span className="text-slate-300 dark:text-white/20">•</span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">
                            {post.author_year_section || 'BSIT'}
                          </span>
                          <span className="text-slate-300 dark:text-white/20">•</span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-white/40" title={new Date(post.$createdAt).toLocaleString()}>
                            {formatRelativeTime(post.$createdAt)}
                          </span>
                        </div>

                        {/* Admin Takedown */}
                        {isAdmin && (
                          <button
                            onClick={() => setTakedownTarget(post)}
                            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Moderator Action: Takedown Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Post Markdown & Code Content */}
                      <PostMarkdownContent content={post.content} />

                      {/* Document Attachments */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {post.attachments.map((fileId, i) => {
                            const name = post.attachment_names?.[i] || 'Document Attachment'
                            const size = post.attachment_sizes?.[i] || ''
                            const isPdf = name.toLowerCase().endsWith('.pdf')
                            const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
                            const isCode = /\.(zip|rar|tar|gz|json|js|ts|py|cpp|java|sql)$/i.test(name)

                            return (
                              <div
                                key={fileId}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] hover:border-gold/40 transition-colors group"
                              >
                                <div className="flex items-center gap-3 overflow-hidden pr-3">
                                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                    isPdf
                                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                                      : isImg
                                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                                      : 'bg-gold/15 border-gold/30 text-gold'
                                  }`}>
                                    {isPdf ? (
                                      <FileText className="w-4 h-4" />
                                    ) : isImg ? (
                                      <ImageIcon className="w-4 h-4" />
                                    ) : isCode ? (
                                      <FileCode className="w-4 h-4" />
                                    ) : (
                                      <FileText className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                      {name}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 dark:text-white/40 flex items-center gap-2 pt-0.5">
                                      <span>{isPdf ? 'PDF Module' : isImg ? 'Image' : isCode ? 'Code Archive' : 'File'}</span>
                                      {size && <span>• {size}</span>}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={appwriteStorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-surface hover:bg-gold hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-black/[0.08] dark:border-white/[0.1] font-bold text-[11px] font-mono transition-colors shrink-0 shadow-sm"
                                >
                                  Download
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Reddit-Style Bottom Action Strip */}
                      <div className="flex items-center gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs text-slate-500 dark:text-white/40 flex-wrap">
                        {/* Reaction / Upvote Pill with beUI Number Ticker */}
                        <button
                          type="button"
                          onClick={() => handleReaction(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors font-mono text-[11px] cursor-pointer active:scale-95 ${
                            isLiked
                              ? 'bg-gold/15 text-gold font-bold border border-gold/40'
                              : 'bg-surface-subtle hover:bg-gold/10 hover:text-gold border border-black/[0.06] dark:border-white/[0.08]'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-gold text-gold' : ''}`} />
                          <NumberTicker value={post.likes_count} duration={0.4} />
                        </button>

                        {/* Comments Pill with beUI Number Ticker */}
                        <button
                          type="button"
                          onClick={() => openComments(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle hover:bg-gold/10 hover:text-gold border border-black/[0.06] dark:border-white/[0.08] transition-colors font-mono text-[11px] cursor-pointer active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="flex items-center gap-1">
                            <NumberTicker value={post.comments_count} duration={0.4} />
                            <span>Replies</span>
                          </span>
                        </button>

                        {/* Share Pill */}
                        <button
                          type="button"
                          onClick={() => handleCopyPostLink(post)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle hover:bg-black/5 dark:hover:bg-white/10 border border-black/[0.06] dark:border-white/[0.08] transition-colors font-mono text-[11px] cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Share</span>
                            </>
                          )}
                        </button>

                        {/* Bookmark Pill */}
                        <button
                          type="button"
                          onClick={() => handleToggleSavePost(post.$id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors font-mono text-[11px] cursor-pointer ${
                            isSaved
                              ? 'bg-gold/15 text-gold font-bold border-gold/40'
                              : 'bg-surface-subtle hover:bg-black/5 dark:hover:bg-white/10 border-black/[0.06] dark:border-white/[0.08]'
                          }`}
                          title={isSaved ? 'Saved to bookmarks' : 'Save discussion'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-gold text-gold' : ''}`} />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </article>
                  </ScrollReveal>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Reddit-Style Right Sidebar (4 cols, Sticky) ─── */}
        <aside className="hidden lg:flex flex-col gap-5 lg:col-span-4 sticky top-20">
          {/* About PSITS Community Card */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs shrink-0 shadow-xs">
                UA
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  PSITS Community
                </h3>
                <p className="text-[11px] font-mono text-slate-400 dark:text-white/40 truncate">
                  University of Antique · CCS
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              The official hub for BS Information Technology students at UA. Connect, collaborate on code, exchange academic resources, and participate in peer discussions.
            </p>

            <div className="space-y-2 py-1 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-slate-500 dark:text-slate-400">Active Topic</span>
                <span className="font-semibold text-gold font-mono">{selectedTag}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <span className="text-slate-500 dark:text-slate-400">Total Discussions</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">{posts.length}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Moderation</span>
                <span className="text-emerald-500 font-mono text-[11px] font-semibold">Active · Student Run</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  setOnboardingInitialStep(1)
                  setIsOnboardingOpen(true)
                  return
                }
                setIsCreateOpen(true)
              }}
              className="w-full py-2.5 rounded-xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start Discussion</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOnboardingInitialStep(1)
                setIsOnboardingOpen(true)
              }}
              className="w-full text-center text-[11px] font-mono text-slate-400 hover:text-gold transition-colors cursor-pointer pt-1"
            >
              View Community Guidelines &amp; Tour →
            </button>
          </div>

          {/* Unified Community Notifications Card (No Double Tabs) */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-5 space-y-3.5 shadow-sm dark:shadow-none text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                <Bell className="w-4 h-4 text-gold" />
                <span>Notifications</span>
              </div>
            </div>

            {/* Unified Notification Stream */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
              {/* User personal reply & activity alerts */}
              {user && userActivityItems.length > 0 && userActivityItems.map(post => (
                <div
                  key={`activity-${post.$id}`}
                  onClick={() => openComments(post)}
                  className="group p-2.5 rounded-xl bg-surface-subtle hover:bg-gold/10 border border-black/[0.04] dark:border-white/[0.04] hover:border-gold/30 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-emerald-500 font-mono flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.comments_count} {post.comments_count === 1 ? 'reply' : 'replies'}
                    </span>
                    <span className="text-gold font-mono text-[9px]">{post.likes_count} upvotes</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-white/70 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))}

              {/* Official broadcasts / dispatches */}
              {broadcastItems.length > 0 && broadcastItems.map(post => (
                <div
                  key={`broadcast-${post.$id}`}
                  onClick={() => openComments(post)}
                  className="group p-2.5 rounded-xl bg-surface-subtle hover:bg-gold/10 border border-black/[0.04] dark:border-white/[0.04] hover:border-gold/30 transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-gold truncate max-w-[130px]">
                      {post.is_officer ? `PSITS ${post.officer_title || 'Officer'}` : (post.tags?.[0] ? `c/${post.tags[0]}` : 'c/Community')}
                    </span>
                    <span className="text-slate-400 font-mono text-[9px]">
                      {new Date(post.$createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-white/70 line-clamp-2 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {post.content}
                  </p>
                </div>
              ))}

              {/* Empty / Clean fallback */}
              {(!user || userActivityItems.length === 0) && broadcastItems.length === 0 && (
                <div className="py-5 text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-surface-subtle mx-auto flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-white/80">All caught up!</div>
                  <p className="text-[10px] text-slate-400 leading-tight">No unread notifications.</p>
                </div>
              )}

              {/* Connect student ID callout if not logged in */}
              {!user && (
                <div className="p-3 rounded-xl bg-surface-subtle border border-dashed border-gold/30 text-center space-y-1.5 mt-2">
                  <p className="text-[10px] text-slate-500 dark:text-white/50 leading-relaxed">
                    Connect your student ID to receive mention alerts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOnboardingInitialStep(1)
                      setIsOnboardingOpen(true)
                    }}
                    className="px-2.5 py-1 rounded-lg bg-gold hover:bg-gold-muted text-slate-950 font-bold text-[10px] tracking-wide transition-colors cursor-pointer w-full"
                  >
                    Connect Student ID
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Resource Shortcuts Card */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-5 space-y-3 shadow-sm dark:shadow-none text-xs font-mono">
            <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-white/40">
              Quick Shortcuts
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setFilterOnlyWithFiles(prev => !prev)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-left ${
                  filterOnlyWithFiles ? 'bg-gold/15 text-gold font-bold' : 'hover:bg-surface-subtle text-slate-600 dark:text-white/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                  <span>PDF Course Modules</span>
                </span>
                <span className="text-[10px] text-slate-400">Filter</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOnlyOfficers(prev => !prev)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-left ${
                  filterOnlyOfficers ? 'bg-gold/15 text-gold font-bold' : 'hover:bg-surface-subtle text-slate-600 dark:text-white/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>Executive Dispatches</span>
                </span>
                <span className="text-[10px] text-slate-400">Filter</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOnlySaved(prev => !prev)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-left ${
                  filterOnlySaved ? 'bg-gold/15 text-gold font-bold' : 'hover:bg-surface-subtle text-slate-600 dark:text-white/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-gold" />
                  <span>My Saved Posts</span>
                </span>
                <span className="text-[10px] text-slate-400">({savedPostIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOnlyMyPosts(prev => !prev)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-left ${
                  filterOnlyMyPosts ? 'bg-gold/15 text-gold font-bold' : 'hover:bg-surface-subtle text-slate-600 dark:text-white/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>My Published Posts</span>
                </span>
                <span className="text-[10px] text-slate-400">Filter</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Premium iOS-Style Community Onboarding Modal ─── */}
      <CommunityOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        user={user}
        currentProfile={userProfile}
        onProfileUpdated={(updated) => {
          setUserProfile(updated)
          setUser(prev => prev ? { ...prev, name: updated.name, avatar: updated.avatar } : null)
          window.dispatchEvent(new CustomEvent('psits:profile-updated'))
        }}
        initialStep={onboardingInitialStep}
      />



      {/* ─── Create Post Modal (Minimalist Command / Spotlight Palette) ─── */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false)
          }}
        >
          <div
            className="w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl bg-[#0c0e12]/95 border border-white/[0.08] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                if (!isSubmittingPost && postContent.trim()) handleCreatePost()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setIsCreateOpen(false)
              }
            }}
          >
            {/* Command-Bar Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
              <div className="text-xs font-semibold text-white/90 tracking-wide font-mono">
                Create Discussion
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/40 bg-white/[0.04] border border-white/[0.08] rounded shadow-xs">
                  ESC
                </kbd>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-white/40 hover:text-white p-1 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Author / Identity Strip */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-white/[0.01] text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0 text-amber-400 overflow-hidden text-[10px]">
                  {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                    <Image
                      src={userProfile.avatar}
                      alt="Student"
                      width={20}
                      height={20}
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name)
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-amber-400/90 truncate">
                  {userProfile?.username
                    ? (userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`)
                    : `@${(userProfile?.name || user?.name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400/90 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified</span>
              </div>
            </div>

            {/* Category / Tags Selector */}
            <div className="px-4 pt-3 pb-1 shrink-0">
              <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-white/35 mb-1.5">
                Topic
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {TAGS.filter(t => t !== 'All').map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedPostTag(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedPostTag === t
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30 font-semibold'
                        : 'bg-white/[0.03] text-white/50 border border-white/[0.05] hover:text-white/80 hover:bg-white/[0.06]'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 flex flex-col px-4 py-2 overflow-y-auto scrollbar-thin space-y-2">
              <textarea
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                autoFocus
                className="w-full flex-1 min-h-[140px] bg-transparent text-xs sm:text-sm text-white/90 placeholder:text-white/25 focus:outline-none resize-none leading-relaxed font-sans"
              />

              {/* Formatting Toolbar */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-xs">
                <span className="text-[10px] font-mono text-white/30">Markdown &amp; code syntax</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPostContent(prev => prev + '\n```typescript\n// Paste code here\n\n```\n')}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono text-white/40 hover:text-amber-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="Insert code snippet"
                  >
                    &lt;/&gt; code
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostContent(prev => prev + ' **bold text** ')}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white/40 hover:text-amber-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="Insert bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostContent(prev => prev + '\n- Item 1\n- Item 2\n')}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono text-white/40 hover:text-amber-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="Insert bullet list"
                  >
                    • list
                  </button>
                </div>
              </div>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="space-y-1 pt-1">
                  {attachments.map((file, idx) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] text-xs border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-1.5 truncate max-w-[280px] sm:max-w-[360px]">
                        <Paperclip className="w-3 h-3 text-white/40 shrink-0" />
                        <span className="truncate text-white/80 font-mono text-[11px]">{file.name}</span>
                        <span className="text-white/30 text-[10px] font-mono shrink-0">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="text-white/40 hover:text-rose-400 cursor-pointer p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Command-Palette Style Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] shrink-0">
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-white/50 hover:text-amber-300 text-xs font-mono px-2 py-1 rounded-md hover:bg-white/[0.04] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="text-[11px]">{isUploadingFile ? 'Uploading...' : 'Attach'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingPost || !postContent.trim()}
                  onClick={handleCreatePost}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <span>{isSubmittingPost ? 'Publishing...' : 'Publish'}</span>
                  <span className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/15 text-[10px] font-mono text-slate-900 font-semibold">
                    <span>⌘</span>
                    <CornerDownLeft className="w-2.5 h-2.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Live Comments Modal (Theme-Aware Spacious Design) ─── */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-[28px] sm:rounded-[36px] bg-surface border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4 shrink-0">
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                Discussion Thread
              </h3>
              <button
                onClick={() => setActiveCommentPost(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] text-xs space-y-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gold">{activeCommentPost.author_display_name}</span>
                {activeCommentPost.is_officer && (
                  <span className="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-[9px] font-bold text-gold">
                    PSITS {activeCommentPost.officer_title || 'Officer'}
                  </span>
                )}
              </div>
              <div className="text-slate-800 dark:text-slate-200 line-clamp-3 leading-relaxed">{activeCommentPost.content}</div>
            </div>

            {/* Comments Scrollable Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {commentsLoading ? (
                <div className="text-center py-10 text-xs text-slate-400">Loading replies...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No replies yet. Be the first to reply!</div>
              ) : (
                comments.map(c => (
                  <div key={c.$id} className="p-4 rounded-2xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono text-slate-900 dark:text-white">
                          {c.author_display_name.startsWith('@') || c.author_display_name.startsWith('Anonymous')
                            ? c.author_display_name
                            : `@${c.author_display_name.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`}
                        </span>
                        {/* 🌟 Officer Badge on Comments */}
                        {c.is_officer && (
                          <span className="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-[9px] font-bold text-gold">
                            PSITS {c.officer_title || 'Officer'}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(c.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 leading-relaxed">{c.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] shrink-0 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Replying to discussion</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-white/40">
                  Replying as {userProfile?.username ? (userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`) : '@kasubay'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder={user ? 'Write a constructive reply...' : 'Connect account to reply'}
                  disabled={!user || isSubmittingComment}
                  className="flex-1 bg-surface-subtle border border-black/[0.08] dark:border-white/10 focus:border-gold rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!user || !newCommentText.trim() || isSubmittingComment}
                  onClick={handleAddComment}
                  className="p-3 rounded-xl bg-gold hover:bg-gold-muted disabled:opacity-40 text-slate-950 transition-colors shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Moderator Takedown Confirmation Modal ─── */}
      {takedownTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md rounded-[28px] sm:rounded-[36px] bg-surface border border-rose-500/30 shadow-2xl p-7 sm:p-9 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-500">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                Moderator Takedown
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
              Are you sure you want to take down this discussion? It will be immediately hidden from all student screens via real-time WebSocket purge and removed from the edge cache.
            </p>

            <div className="p-4 rounded-2xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-500 dark:text-white/50 italic">
              &quot;{takedownTarget.content.slice(0, 120)}...&quot;
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 dark:text-white/50 block">Reason for takedown:</label>
              <input
                type="text"
                value={takedownReason}
                onChange={e => setTakedownReason(e.target.value)}
                placeholder="e.g. Harassment, Profanity, Spam"
                className="w-full bg-surface-subtle border border-black/[0.08] dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTakedownTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTakingDown}
                onClick={handleConfirmTakedown}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                {isTakingDown ? 'Taking Down...' : 'Confirm Takedown'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
