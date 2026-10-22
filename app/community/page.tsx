'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  FileText,
  MessageSquare,
  Heart,
  MessageCircle,
  Share2,
  ShieldAlert,
  User,
  Sparkles,
  WifiOff,
  Trash2,
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
  Home,
  Compass,
  Bookmark,
  Check,
  Copy,
  FileCode,
  ImageIcon,
  Plus,
  Users,
  ChevronRight,
  ChevronDown,
  Paperclip,
  CornerDownLeft,
  MoreHorizontal,
  Pencil,
  Lock,
  Globe,
  Hash,
  UserPlus,
  UploadCloud,
  Loader2,
  AlertCircle,
  Bold,
  List,
  Flag,
  Smile,
  Menu,
  EyeOff,
} from 'lucide-react'
import { appwrite, appwriteStorage, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS, APPWRITE_STORAGE_BUCKET_ID } from '@/lib/appwrite'
import {
  getCommunityFeedAction,
  createCommunityPostAction,
  moderatorTakedownPostAction,
  deleteOwnCommunityPostAction,
  editCommunityPostAction,
  togglePostReactionAction,
  addCommentAction,
  getCommentsForPostAction,
  editCommunityCommentAction,
  deleteCommunityCommentAction,
  createCommunityThreadAction,
  deleteCommunityThreadAction,
  getAvailableThreadsAction,
  getUserThreadQuotaAction,
  requestToJoinThreadAction,
  respondToThreadJoinRequestAction,
  joinPublicThreadAction,
  getSingleCommunityPostAction,
  getMutualFollowsAction,
  toggleFollowAction,
  getMyFollowRelationshipsAction,
  getMyNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type FollowUserInfo,
  type CommunityPostItem,
  type CommunityCommentItem,
  type CommunityThreadItem,
  type CommunityNotificationItem,
} from './actions'
import { normalizeCommunityHandle } from '@/lib/community-validation'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { compressImageToWebP } from '@/lib/image-compress'
import { ID } from 'appwrite'
import ScrollReveal from '@/components/ScrollReveal'
import CommunityOnboardingModal, { type CommunityUserProfile } from '@/components/CommunityOnboardingModal'
import NotificationModal from '@/components/NotificationModal'

import { CommentsListSkeleton, CommunityFeedSkeleton } from '@/components/PublicSkeletonPreloader'
import { motion, AnimatePresence } from 'framer-motion'
import { NumberTicker } from '@/components/motion/number-ticker'
import { PullToRefresh } from '@/components/motion/pull-to-refresh'

const LOCAL_STORAGE_KEY = 'psits_community_cached_posts_v4'

function deduplicateComments(items: CommunityCommentItem[]): CommunityCommentItem[] {
  const seenIds = new Set<string>()
  const seenSignatures = new Set<string>()
  const result: CommunityCommentItem[] = []

  for (const item of items) {
    if (!item || !item.$id) continue
    if (seenIds.has(item.$id)) continue
    seenIds.add(item.$id)

    // Deduplicate identical pending/optimistic comments if server document arrived
    const sig = `${item.parent_id || 'root'}:${(item.author_display_name || '').toLowerCase().trim()}:${(item.content || '').trim()}`
    if (item.$id.startsWith('optimistic-') && seenSignatures.has(sig)) {
      continue
    }
    seenSignatures.add(sig)

    result.push(item)
  }
  return result
}

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

function InstagramVerifiedBadge({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Verified"
      className={`${className} shrink-0 text-amber-400 inline-block align-middle select-none drop-shadow-sm`}
      fill="currentColor"
    >
      <title>Verified</title>
      <path
        d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
      />
      <path
        d="M10.2 16.2 6.5 12.5l1.4-1.4 2.3 2.3 6-6 1.4 1.4z"
        className="fill-slate-950 dark:fill-[#0c1017]"
      />
    </svg>
  )
}

function isHostOfThread(thread: CommunityThreadItem, email?: string, username?: string): boolean {
  if (!email && !username) return false
  const cleanEmail = (email || '').toLowerCase().trim()
  const cleanUser = (username || '').toLowerCase().trim().replace(/^@/, '')
  const threadCreator = (thread.creator_student_no || '').toLowerCase().trim()
  const threadDisplay = (thread.creator_display_name || '').toLowerCase().trim().replace(/^@/, '')
  return (cleanEmail !== '' && threadCreator === cleanEmail) || (cleanUser !== '' && threadDisplay === cleanUser)
}

function isMemberOfThread(thread: CommunityThreadItem, email?: string, username?: string): boolean {
  if (isHostOfThread(thread, email, username)) return true
  if (!email && !username) return false
  const cleanEmail = (email || '').toLowerCase().trim()
  const cleanUser = (username || '').toLowerCase().trim().replace(/^@/, '')
  return (thread.allowed_users || []).some(u => {
    const clean = u.toLowerCase().trim().replace(/^@/, '')
    return clean === cleanEmail || clean === cleanUser
  })
}

function isPendingJoinRequest(thread: CommunityThreadItem, email?: string, username?: string): boolean {
  if (!email && !username) return false
  const cleanEmail = (email || '').toLowerCase().trim()
  const cleanUser = (username || '').toLowerCase().trim().replace(/^@/, '')
  return (thread.pending_requests || []).some(p => {
    const lower = p.toLowerCase().trim()
    return (cleanEmail !== '' && lower.includes(cleanEmail)) || (cleanUser !== '' && lower.includes(cleanUser))
  })
}

function getThreadMemberCount(thread: CommunityThreadItem): number {
  const members = new Set<string>()
  if (thread.creator_student_no) members.add(thread.creator_student_no.toLowerCase().trim())
  if (thread.creator_display_name) members.add(thread.creator_display_name.toLowerCase().trim().replace(/^@/, ''))
  for (const u of thread.allowed_users || []) {
    const clean = u.toLowerCase().trim().replace(/^@/, '')
    if (clean) members.add(clean)
  }
  return Math.max(1, members.size)
}

const CODE_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
  { id: 'php', label: 'PHP' },
  { id: 'sql', label: 'SQL' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'bash', label: 'Bash' },
  { id: 'json', label: 'JSON' },
  { id: 'markdown', label: 'Markdown' },
] as const

function getAttachmentBadge(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return {
      icon: ImageIcon,
      label: ext.toUpperCase(),
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
    }
  }
  if (ext === 'pdf') {
    return {
      icon: FileText,
      label: 'PDF',
      colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/25',
    }
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      icon: FileCode,
      label: ext.toUpperCase(),
      colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/25',
    }
  }
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'cpp', 'java', 'sql', 'html', 'css', 'json', 'sh'].includes(ext)) {
    return {
      icon: Code2,
      label: ext.toUpperCase(),
      colorClass: 'text-violet-500 bg-violet-500/10 border-violet-500/25',
    }
  }
  if (['doc', 'docx', 'xlsx', 'csv', 'pptx'].includes(ext)) {
    return {
      icon: FileText,
      label: ext.toUpperCase(),
      colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    }
  }
  return {
    icon: Paperclip,
    label: ext ? ext.toUpperCase() : 'FILE',
    colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/25',
  }
}

export default function CommunityPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTag, setSelectedTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [user, setUser] = useState<{
    email: string
    name: string
    avatar?: string
    isOfficer?: boolean
    isVerified?: boolean
    officerTitle?: string
  } | null>(null)
  const [userProfile, setUserProfile] = useState<CommunityUserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Onboarding Modal Flow
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [onboardingInitialStep, setOnboardingInitialStep] = useState<1 | 2 | 3 | 4>(1)
  const [onboardingAuthMode, setOnboardingAuthMode] = useState<'create' | 'continue'>('create')

  // Post Creator State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [selectedPostTag, setSelectedPostTag] = useState('general')
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string; type: string; previewUrl?: string }[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const postTextareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  // Modern Code Snippet Composer State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [codeSnippet, setCodeSnippet] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('typescript')
  const [codeTitle, setCodeTitle] = useState('')

  // Modern File Drag & Drop + Upload State
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Threads & Start Discussion State
  const [customThreads, setCustomThreads] = useState<CommunityThreadItem[]>([])
  const [isThreadsDropdownOpen, setIsThreadsDropdownOpen] = useState(false)
  const threadsDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isThreadsDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (threadsDropdownRef.current && !threadsDropdownRef.current.contains(e.target as Node)) {
        setIsThreadsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isThreadsDropdownOpen])
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)
  const [confirmDeleteThreadId, setConfirmDeleteThreadId] = useState<string | null>(null)
  const [isCreateThreadOpen, setIsCreateThreadOpen] = useState(false)
  const [threadTitle, setThreadTitle] = useState('')
  const [threadDescription, setThreadDescription] = useState('')
  const threadCategory = 'General'
  const [threadIsPrivate, setThreadIsPrivate] = useState(false)
  const [threadAllowedUsersInput, setThreadAllowedUsersInput] = useState('')
  const [isSubmittingThread, setIsSubmittingThread] = useState(false)
  const [requestingThreadId, setRequestingThreadId] = useState<string | null>(null)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
  const [threadQuota, setThreadQuota] = useState<{
    canCreate: boolean
    usedCount: number
    maxLimit: number | 'unlimited'
    isVerified: boolean
  } | null>(null)

  // Realtime Online Community Members Presence
  const [onlineMembers, setOnlineMembers] = useState<{
    key: string
    handle: string
    name: string
    avatar?: string
    isOfficer?: boolean
    isVerified?: boolean
    yearSection?: string
    isGuest?: boolean
    onlineAt: string
  }[]>([])

  // Feed Controls & Engagement State
  const [sortBy] = useState<'latest' | 'popular' | 'discussed'>('latest')
  const [filterOnlyWithFiles, setFilterOnlyWithFiles] = useState(false)
  const [filterOnlyOfficers, setFilterOnlyOfficers] = useState(false)
  const [filterOnlySaved, setFilterOnlySaved] = useState(false)
  const [filterOnlyMyPosts, setFilterOnlyMyPosts] = useState(false)
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([])

  // Mobile double-tap to like state
  const [lastTap, setLastTap] = useState<{ id: string; time: number } | null>(null)
  const [heartBurstPostId, setHeartBurstPostId] = useState<string | null>(null)

  const handleDoubleTapPost = (post: CommunityPostItem) => {
    const now = Date.now()
    if (lastTap && lastTap.id === post.$id && now - lastTap.time < 350) {
      try { navigator.vibrate?.([30, 40, 30]) } catch {}
      if (!userLikedPosts.includes(post.$id)) {
        handleReaction(post)
      }
      setHeartBurstPostId(post.$id)
      setTimeout(() => {
        setHeartBurstPostId(curr => (curr === post.$id ? null : curr))
      }, 900)
      setLastTap(null)
    } else {
      setLastTap({ id: post.$id, time: now })
    }
  }

  // Share Post Clipboard Toast & Deep Link State
  const [shareCopiedToast, setShareCopiedToast] = useState(false)
  const [toastMessage, setToastMessage] = useState<string>('Link copied to clipboard')
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)

  // Hidden Posts State (Persisted in localStorage; hidden from feed, visible on author profile)
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([])

  const handleHidePost = (postId: string) => {
    try { navigator.vibrate?.([15]) } catch {}
    setHiddenPostIds(prev => {
      const updated = prev.includes(postId) ? prev : [...prev, postId]
      try {
        localStorage.setItem('psits_community_hidden_posts', JSON.stringify(updated))
      } catch {}
      return updated
    })
    setToastMessage("Post hidden from feed. You can still view it on author's profile.")
    setShareCopiedToast(true)
    setTimeout(() => setShareCopiedToast(false), 3000)
  }

  // Context Menu, Edit Post, and Profile Preview State
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null)
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null)
  const [isDeletingPostId, setIsDeletingPostId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<CommunityPostItem | null>(null)
  const [editPostContent, setEditPostContent] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Hydration-Safe Client Preferences & Posts Initialization
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const cachedPosts = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (cachedPosts) {
          const parsed = JSON.parse(cachedPosts)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed)
            setLoading(false)
          }
        }
        const cachedFollowing = localStorage.getItem('psits_community_my_following')
        if (cachedFollowing) {
          setMyFollowingSet(new Set(JSON.parse(cachedFollowing)))
          setIsFollowsResolved(true)
        }
        const cachedFollowers = localStorage.getItem('psits_community_my_followers')
        if (cachedFollowers) {
          setMyFollowerSet(new Set(JSON.parse(cachedFollowers)))
        }
        const cachedMutuals = localStorage.getItem('psits_community_my_mutuals')
        if (cachedMutuals) {
          try {
            const parsed = JSON.parse(cachedMutuals)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setMyMutuals(parsed)
              setIsMutualsLoading(false)
            }
          } catch {}
        }
        const cachedSaved = localStorage.getItem('psits_community_saved_posts')
        if (cachedSaved) setSavedPostIds(JSON.parse(cachedSaved))
        const cachedLiked = localStorage.getItem('psits_community_liked_posts')
        if (cachedLiked) setUserLikedPosts(JSON.parse(cachedLiked))
        const cachedActive = localStorage.getItem('psits_community_active_handle')
        if (cachedActive) setCachedActiveHandle(normalizeCommunityHandle(cachedActive))
        const cachedHidden = localStorage.getItem('psits_community_hidden_posts')
        if (cachedHidden) {
          try {
            const parsed = JSON.parse(cachedHidden)
            if (Array.isArray(parsed)) setHiddenPostIds(parsed)
          } catch {}
        }
        setIsOffline(!navigator.onLine)
      } catch {}
    })
  }, [])

  // Deep-Link Post Auto-Highlight & Auto-Scroll
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return

    const params = new URLSearchParams(window.location.search)
    const targetPostId = params.get('post') || (window.location.hash ? window.location.hash.replace('#post-', '') : null)
    if (!targetPostId) return

    // 1. If post already exists in current loaded list
    const existing = posts.find(p => p.$id === targetPostId)
    if (existing) {
      const scrollTimer = setTimeout(() => {
        setHighlightedPostId(targetPostId)
        const el = document.getElementById(`post-${targetPostId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
      const clearTimer = setTimeout(() => setHighlightedPostId(null), 3500)
      return () => {
        clearTimeout(scrollTimer)
        clearTimeout(clearTimer)
      }
    }

    // 2. If post is an older / shared post not yet in current batch, fetch it directly
    let isCancelled = false
    getSingleCommunityPostAction(targetPostId).then(res => {
      if (isCancelled) return
      if (res.success && res.post) {
        setPosts(prev => {
          if (prev.some(p => p.$id === res.post!.$id)) return prev
          return [res.post!, ...prev]
        })
        setHighlightedPostId(targetPostId)
        setTimeout(() => {
          const el = document.getElementById(`post-${targetPostId}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 150)
        const t = setTimeout(() => setHighlightedPostId(null), 3500)
        return () => clearTimeout(t)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [posts, loading])

  const handleToggleSavePost = (postId: string) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }
    setSavedPostIds(prev => {
      const updated = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
      try {
        localStorage.setItem('psits_community_saved_posts', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const handleSharePost = async (post: CommunityPostItem) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/community?post=${post.$id}` : ''
    const authorName = post.is_anonymous ? 'Anonymous Kasubay' : post.author_display_name
    const cleanSnippet = post.content
      ? post.content.replace(/[#*`_~]/g, '').trim().slice(0, 100)
      : 'Join the discussion on PSITS Community'

    const shareData = {
      title: `PSITS Community: ${authorName}`,
      text: `"${cleanSnippet}" — ${authorName}`,
      url,
    }

    // Always attempt native device share sheet (Windows / macOS / Android / iOS)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    // Fallback: copy link to clipboard with toast indicator
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url)
        setShareCopiedToast(true)
        setTimeout(() => setShareCopiedToast(false), 2200)
      } catch {}
    }
  }

  const handleDeletePost = async (post: CommunityPostItem) => {
    if (!user) return
    setIsDeletingPostId(post.$id)

    try {
      const res = await deleteOwnCommunityPostAction({
        postId: post.$id,
        userEmail: user.email,
      })
      if (res.success) {
        setPosts(prev => {
          const updated = prev.filter(p => p.$id !== post.$id)
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
          } catch {}
          return updated
        })
        setActiveMenuPostId(null)
        setConfirmDeletePostId(null)
      } else {
        alert(res.error || 'Failed to delete post.')
      }
    } catch (err) {
      console.error('Delete post error:', err)
      alert('An unexpected error occurred while deleting the post.')
    } finally {
      setIsDeletingPostId(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingPost || !user || !editPostContent.trim()) return
    setIsSavingEdit(true)
    try {
      const res = await editCommunityPostAction({
        postId: editingPost.$id,
        content: editPostContent.trim(),
        userEmail: user.email,
      })
      if (res.success) {
        setPosts(prev => {
          const updated = prev.map(p => (p.$id === editingPost.$id ? { ...p, content: editPostContent.trim() } : p))
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
          } catch {}
          return updated
        })
        setEditingPost(null)
        setEditPostContent('')
      } else {
        alert(res.error || 'Failed to save changes.')
      }
    } catch (err) {
      console.error('Edit post error:', err)
      alert('An unexpected error occurred while updating the post.')
    } finally {
      setIsSavingEdit(false)
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
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; author: string } | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false)
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null)
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const [collapsedReplyIds, setCollapsedReplyIds] = useState<Set<string>>(new Set())

  // Follow System & Feed Relationships State (Stale-While-Revalidate with localStorage for 0ms instant render)
  const [myFollowingSet, setMyFollowingSet] = useState<Set<string>>(new Set())
  const [myFollowerSet, setMyFollowerSet] = useState<Set<string>>(new Set())
  const [isFollowsResolved, setIsFollowsResolved] = useState<boolean>(false)
  const [cachedActiveHandle, setCachedActiveHandle] = useState<string>('')

  // Sync active handle to localStorage safely in an effect (not during render pass)
  useEffect(() => {
    const live = normalizeCommunityHandle(userProfile?.username || user?.name || '')
    if (live) {
      try { localStorage.setItem('psits_community_active_handle', live) } catch {}
    }
  }, [userProfile?.username, user?.name])

  const myHandleNormalized = useMemo(() => {
    const live = normalizeCommunityHandle(userProfile?.username || user?.name || '')
    if (live) return live
    return cachedActiveHandle
  }, [userProfile?.username, user?.name, cachedActiveHandle])

  const loadFollowRelationships = useCallback(async () => {
    if (!myHandleNormalized) return
    const res = await getMyFollowRelationshipsAction(myHandleNormalized)
    if (res.success) {
      setMyFollowingSet(new Set(res.following))
      setMyFollowerSet(new Set(res.followers))
      setIsFollowsResolved(true)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('psits_community_my_following', JSON.stringify(res.following))
          localStorage.setItem('psits_community_my_followers', JSON.stringify(res.followers))
        } catch {}
      }
    }
  }, [myHandleNormalized])

  // Follow relationships data fetching & realtime subscription
  useEffect(() => {
    if (!myHandleNormalized) return
    let ignore = false

    const fetchFollows = async () => {
      const res = await getMyFollowRelationshipsAction(myHandleNormalized)
      if (!ignore && res.success) {
        setMyFollowingSet(new Set(res.following))
        setMyFollowerSet(new Set(res.followers))
        setIsFollowsResolved(true)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('psits_community_my_following', JSON.stringify(res.following))
            localStorage.setItem('psits_community_my_followers', JSON.stringify(res.followers))
          } catch {}
        }
      }
    }

    void fetchFollows()

    let unsubscribe: (() => void) | undefined
    try {
      const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.FOLLOWS}.documents`
      unsubscribe = appwrite.subscribe(channel, (response: { events?: string[]; payload?: Record<string, unknown> }) => {
        const events = response?.events || []
        const isDelete = events.some(e => e.includes('.delete'))
        if (isDelete) {
          void fetchFollows()
          return
        }

        const p = response?.payload
        if (p) {
          const fHandle = normalizeCommunityHandle(String(p.follower_handle || ''))
          const tHandle = normalizeCommunityHandle(String(p.following_handle || ''))
          if (!fHandle || !tHandle || fHandle === myHandleNormalized || tHandle === myHandleNormalized) {
            void fetchFollows()
          }
        } else {
          void fetchFollows()
        }
      })
    } catch (err) {
      console.warn('Realtime follows subscription error:', err)
    }
    return () => {
      ignore = true
      if (unsubscribe) unsubscribe()
    }
  }, [myHandleNormalized])

  // ─── Realtime Active Community Members Presence (Supabase Phoenix WebSockets) ───
  useEffect(() => {
    let guestKey = ''
    if (typeof window !== 'undefined') {
      try {
        guestKey = sessionStorage.getItem('psits_guest_sid') || ''
        if (!guestKey) {
          guestKey = `guest_${Math.random().toString(36).slice(2, 9)}`
          sessionStorage.setItem('psits_guest_sid', guestKey)
        }
      } catch {}
    }

    const currentKey = user?.email
      ? user.email.toLowerCase().trim()
      : (userProfile?.username ? userProfile.username.toLowerCase().trim() : (guestKey || 'guest'))

    const currentHandle = userProfile?.username
      ? userProfile.username.replace(/^@/, '')
      : (user?.name ? user.name.toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'guest')

    const currentDisplayName = userProfile?.name || user?.name || (user ? 'Kasubay' : 'Guest Visitor')
    const currentAvatar = userProfile?.avatar || user?.avatar || ''
    const currentIsOfficer = Boolean(isAdmin)
    const currentIsVerified = Boolean(isAdmin || userProfile?.tosAccepted)
    const currentYearSection = userProfile?.yearSection || 'BSIT'

    const presenceChannel = supabase.channel('community-presence', {
      config: {
        presence: {
          key: currentKey,
        },
      },
    })

    const syncPresence = () => {
      const state = presenceChannel.presenceState()
      const membersMap = new Map<string, {
        key: string
        handle: string
        name: string
        avatar?: string
        isOfficer?: boolean
        isVerified?: boolean
        yearSection?: string
        isGuest?: boolean
        onlineAt: string
      }>()

      for (const [key, presences] of Object.entries(state)) {
        if (Array.isArray(presences) && presences.length > 0) {
          const latest = presences[presences.length - 1] as unknown as Record<string, unknown>
          if (latest) {
            const handle = String(latest.handle || latest.username || 'kasubay')
            const name = String(latest.name || latest.displayName || 'Kasubay Student')
            const avatar = String(latest.avatar || '')
            const isOfficer = Boolean(latest.isOfficer)
            const isVerified = Boolean(latest.isVerified)
            const yearSection = latest.yearSection ? String(latest.yearSection) : undefined
            const isGuest = Boolean(latest.isGuest)
            const onlineAt = String(latest.onlineAt || new Date().toISOString())

            membersMap.set(key, {
              key,
              handle,
              name,
              avatar,
              isOfficer,
              isVerified,
              yearSection,
              isGuest,
              onlineAt,
            })
          }
        }
      }

      setOnlineMembers(Array.from(membersMap.values()))
    }

    presenceChannel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await presenceChannel.track({
              handle: currentHandle,
              name: currentDisplayName,
              avatar: currentAvatar,
              isOfficer: currentIsOfficer,
              isVerified: currentIsVerified,
              yearSection: currentYearSection,
              isGuest: !user,
              onlineAt: new Date().toISOString(),
            })
          } catch (trackErr) {
            console.warn('[Community Presence Track Error]:', trackErr)
          }
        }
      })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void presenceChannel.track({
          handle: currentHandle,
          name: currentDisplayName,
          avatar: currentAvatar,
          isOfficer: currentIsOfficer,
          isVerified: currentIsVerified,
          yearSection: currentYearSection,
          isGuest: !user,
          onlineAt: new Date().toISOString(),
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void supabase.removeChannel(presenceChannel)
    }
  }, [user, userProfile, isAdmin])

  const displayOnlineMembers = useMemo(() => {
    if (onlineMembers.length > 0) return onlineMembers
    if (user) {
      return [{
        key: user.email,
        handle: userProfile?.username ? userProfile.username.replace(/^@/, '') : (user.name ? user.name.toLowerCase().replace(/[^a-z0-9_.]/g, '') : 'you'),
        name: userProfile?.name || user.name || 'You',
        avatar: userProfile?.avatar || user.avatar || '',
        isOfficer: Boolean(isAdmin),
        isVerified: Boolean(isAdmin || userProfile?.tosAccepted),
        yearSection: userProfile?.yearSection || 'BSIT',
        isGuest: false,
        onlineAt: new Date().toISOString(),
      }]
    }
    return []
  }, [onlineMembers, user, userProfile, isAdmin])

  const handleToggleFollowAuthor = async (
    targetHandle: string,
    targetName?: string,
    targetAvatar?: string
  ) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }
    const cleanTarget = normalizeCommunityHandle(targetHandle)
    if (!myHandleNormalized || !cleanTarget || cleanTarget === myHandleNormalized) return

    const isCurrentlyFollowing = myFollowingSet.has(cleanTarget)
    setMyFollowingSet(prev => {
      const next = new Set(prev)
      if (isCurrentlyFollowing) {
        next.delete(cleanTarget)
      } else {
        next.add(cleanTarget)
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('psits_community_my_following', JSON.stringify(Array.from(next)))
          const cached = localStorage.getItem(`psits_community_follow_${cleanTarget}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            parsed.isFollowing = !isCurrentlyFollowing
            parsed.followersCount = Math.max(0, (Number(parsed.followersCount) || 0) + (!isCurrentlyFollowing ? 1 : -1))
            localStorage.setItem(`psits_community_follow_${cleanTarget}`, JSON.stringify(parsed))
          }
        } catch {}
      }
      return next
    })

    try {
      const res = await toggleFollowAction({
        followerHandle: myHandleNormalized,
        followingHandle: cleanTarget,
        followerName: user.name,
        followerAvatar: userProfile?.avatar || user.avatar,
        followingName: targetName,
        followingAvatar: targetAvatar,
      })
      if (!res.success) {
        loadFollowRelationships()
      } else {
        setMyFollowingSet(prev => {
          const next = new Set(prev)
          if (res.isFollowing) {
            next.add(cleanTarget)
          } else {
            next.delete(cleanTarget)
          }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('psits_community_my_following', JSON.stringify(Array.from(next)))
            } catch {}
          }
          return next
        })
      }
    } catch {
      loadFollowRelationships()
    }
  }

  // ─── Realtime Notifications Hub State & Sync (Mobile & Desktop) ───
  const [notifications, setNotifications] = useState<CommunityNotificationItem[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0)
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false)
  const [liveToastNotif, setLiveToastNotif] = useState<CommunityNotificationItem | null>(null)

  // Realtime subscription for NOTIFICATIONS collection (Appwrite WebSocket)
  useEffect(() => {
    if (!myHandleNormalized) return
    let ignore = false

    const fetchNotifs = async () => {
      const res = await getMyNotificationsAction({
        userHandle: myHandleNormalized,
        userEmail: user?.email,
        limit: 30,
      })
      if (!ignore && res.success && res.notifications) {
        setNotifications(res.notifications)
        setUnreadNotifCount(res.unreadCount || 0)
      }
    }

    void fetchNotifs()

    let unsubscribe: (() => void) | undefined
    try {
      const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.NOTIFICATIONS}.documents`
      unsubscribe = appwrite.subscribe(channel, (response: { events: string[]; payload: Record<string, unknown> }) => {
        const events = response.events || []
        const payload = response.payload
        const recipientHandle = String(payload.recipient_handle || '').toLowerCase().replace(/^@/, '').trim()
        const recipientEmail = String(payload.recipient_email || '').toLowerCase().trim()
        const myEmail = (user?.email || '').toLowerCase().trim()

        if (recipientHandle !== myHandleNormalized && recipientEmail !== myEmail) return

        if (events.some(e => e.includes('.create'))) {
          const item: CommunityNotificationItem = {
            $id: String(payload.$id || ''),
            $createdAt: String(payload.$createdAt || new Date().toISOString()),
            recipient_email: recipientEmail,
            recipient_handle: recipientHandle,
            actor_name: String(payload.actor_name || 'Kasubay'),
            actor_handle: String(payload.actor_handle || 'kasubay'),
            actor_avatar: payload.actor_avatar ? String(payload.actor_avatar) : '',
            type: (payload.type as CommunityNotificationItem['type']) || 'reaction',
            post_id: payload.post_id ? String(payload.post_id) : undefined,
            comment_id: payload.comment_id ? String(payload.comment_id) : undefined,
            summary: String(payload.summary || ''),
            is_read: false,
          }

          setNotifications(prev => [item, ...prev.filter(n => n.$id !== item.$id)])
          setUnreadNotifCount(prev => prev + 1)

          // Show floating in-app notification toast (Facebook/IG style)
          setLiveToastNotif(item)
          try {
            navigator.vibrate?.([40, 50, 40])
          } catch {}

          setTimeout(() => {
            setLiveToastNotif(current => (current?.$id === item.$id ? null : current))
          }, 4500)
        }

        if (events.some(e => e.includes('.update'))) {
          void fetchNotifs()
        }
      })
    } catch (err) {
      console.warn('Realtime notifications subscription error:', err)
    }

    return () => {
      ignore = true
      if (unsubscribe) unsubscribe()
    }
  }, [myHandleNormalized, user?.email])

  const handleMarkNotifAsRead = async (notifId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.$id === notifId ? { ...n, is_read: true } : n))
    )
    setUnreadNotifCount(prev => Math.max(0, prev - 1))
    await markNotificationAsReadAction(notifId)
  }

  const handleMarkAllNotifsAsRead = async () => {
    if (!myHandleNormalized) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadNotifCount(0)
    await markAllNotificationsAsReadAction(myHandleNormalized)
  }

  const handleOpenNotificationPost = (postId: string) => {
    const existing = posts.find(p => p.$id === postId)
    if (existing) {
      openComments(existing)
    } else {
      getSingleCommunityPostAction(postId).then(res => {
        if (res.success && res.post) {
          openComments(res.post)
        }
      })
    }
  }

  // Mutual Followers & Comment Mentions State
  const [myMutuals, setMyMutuals] = useState<FollowUserInfo[]>([])
  const [isMutualsLoading, setIsMutualsLoading] = useState<boolean>(true)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState<number>(-1)
  const [mentionError, setMentionError] = useState<string | null>(null)

  // Fetch mutual follows for comment mentions & Instagram-style active stories tray
  useEffect(() => {
    const handleToQuery = myHandleNormalized || userProfile?.username || user?.name
    if (!handleToQuery) {
      if (!user && !authLoading) setIsMutualsLoading(false)
      return
    }
    let isCancelled = false
    setIsMutualsLoading(true)
    getMutualFollowsAction(handleToQuery).then(res => {
      if (!isCancelled) {
        if (res.success) {
          setMyMutuals(res.mutuals)
          try {
            localStorage.setItem('psits_community_my_mutuals', JSON.stringify(res.mutuals))
          } catch {}
        }
        setIsMutualsLoading(false)
      }
    }).catch(() => {
      if (!isCancelled) setIsMutualsLoading(false)
    })
    return () => {
      isCancelled = true
    }
  }, [myHandleNormalized, userProfile?.username, user?.name, myFollowingSet.size, myFollowerSet.size, activeCommentPost, user, authLoading])

  // Real-time lookup set of online member handles
  const onlineHandlesSet = useMemo(() => {
    const set = new Set<string>()
    for (const m of onlineMembers) {
      if (m.handle) {
        set.add(normalizeCommunityHandle(m.handle))
      }
    }
    return set
  }, [onlineMembers])

  // Mutuals sorted with online friends first, then alphabetical
  const displayMutuals = useMemo(() => {
    return [...myMutuals].sort((a, b) => {
      const aOnline = onlineHandlesSet.has(normalizeCommunityHandle(a.handle))
      const bOnline = onlineHandlesSet.has(normalizeCommunityHandle(b.handle))
      if (aOnline && !bOnline) return -1
      if (!aOnline && bOnline) return 1
      return (a.name || a.handle).localeCompare(b.name || b.handle)
    })
  }, [myMutuals, onlineHandlesSet])

  const filteredMutuals = useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return myMutuals.filter(m => m.handle.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
  }, [mentionQuery, myMutuals])

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setNewCommentText(text)
    if (mentionError) setMentionError(null)

    const cursorPos = e.target.selectionStart ?? text.length
    const textBeforeCursor = text.slice(0, cursorPos)
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/)

    if (match) {
      setMentionQuery(match[1])
      setMentionIndex(match.index ?? -1)
    } else {
      setMentionQuery(null)
      setMentionIndex(-1)
    }
  }

  const handleSelectMention = (mutual: FollowUserInfo) => {
    if (mentionIndex < 0) return
    const before = newCommentText.slice(0, mentionIndex)
    const afterCursor = newCommentText.slice(mentionIndex + (mentionQuery ? mentionQuery.length + 1 : 1))
    const updated = `${before}@${mutual.handle} ${afterCursor}`
    setNewCommentText(updated)
    setMentionQuery(null)
    setMentionIndex(-1)
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus()
        const newPos = before.length + mutual.handle.length + 2
        commentInputRef.current.setSelectionRange(newPos, newPos)
      }
    }, 50)
  }

  const renderCommentContentWithMentions = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_.]+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const clean = part.slice(1)
        return (
          <Link
            key={i}
            href={`/community/${clean.toLowerCase()}`}
            className="text-gold font-semibold hover:underline cursor-pointer"
            onClick={e => e.stopPropagation()}
          >
            {part}
          </Link>
        )
      }
      return part
    })
  }

  const toggleExpandReplies = (commentId: string) => {
    setCollapsedReplyIds(prev => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

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

  /* ─── 0. Custom Threads Loader & Quota Check ─── */
  const loadThreads = useCallback(async (email?: string, handle?: string) => {
    try {
      const res = await getAvailableThreadsAction({ userEmail: email, userHandle: handle })
      if (res.success && res.threads) {
        setCustomThreads(res.threads)
      }
    } catch (e) {
      console.warn('Failed to load threads:', e)
    }
  }, [])

  const checkThreadQuota = useCallback(async (email: string, name?: string, isVer?: boolean) => {
    try {
      const q = await getUserThreadQuotaAction({ userEmail: email, userName: name, isVerified: isVer })
      if (q.success) {
        setThreadQuota(q)
      }
    } catch {}
  }, [])

  const handleOpenCreateThread = async () => {
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
    const isVer = Boolean(isAdmin || userProfile?.tosAccepted)
    await checkThreadQuota(user.email, userProfile.username, isVer)
    setIsCreateThreadOpen(true)
  }

  const handleCreateThread = async () => {
    if (!user || !userProfile?.username || !threadTitle.trim() || isSubmittingThread) return
    setIsSubmittingThread(true)
    try {
      const isVer = Boolean(isAdmin || userProfile.tosAccepted)
      const allowedArr = threadAllowedUsersInput
        .split(/[\s,]+/)
        .map(s => s.trim().replace(/^@/, ''))
        .filter(Boolean)

      const res = await createCommunityThreadAction({
        title: threadTitle.trim(),
        description: threadDescription.trim(),
        category: threadCategory,
        userEmail: user.email,
        userName: userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`,
        userAvatar: userProfile.avatar || user.avatar,
        isPrivate: threadIsPrivate,
        allowedUsers: allowedArr,
        isVerified: isVer,
      })

      if (res.success && res.thread) {
        setCustomThreads(prev => [res.thread!, ...prev])
        setSelectedTag(res.thread.title)
        setThreadTitle('')
        setThreadDescription('')
        setThreadAllowedUsersInput('')
        setThreadIsPrivate(false)
        setIsCreateThreadOpen(false)
        checkThreadQuota(user.email, userProfile.username, isVer)
      } else {
        alert(res.error || 'Failed to create thread.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.'
      alert(msg)
    } finally {
      setIsSubmittingThread(false)
    }
  }

  const handleRequestJoinThread = async (thread: CommunityThreadItem) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }
    setRequestingThreadId(thread.$id)
    try {
      const res = await requestToJoinThreadAction({
        threadId: thread.$id,
        userEmail: user.email,
        userHandle: userProfile?.username,
      })
      if (res.success) {
        const cleanHandle = userProfile?.username ? `@${userProfile.username.replace(/^@/, '')}` : `@${user.name}`
        const entry = `${cleanHandle}::${user.email.toLowerCase()}`
        setCustomThreads(prev =>
          prev.map(t =>
            t.$id === thread.$id
              ? { ...t, pending_requests: Array.from(new Set([...(t.pending_requests || []), entry])) }
              : t
          )
        )
      } else {
        alert(res.error || 'Failed to submit join request.')
      }
    } catch {
      alert('Error sending join request.')
    } finally {
      setRequestingThreadId(null)
    }
  }

  const handleJoinPublicThread = async (thread: CommunityThreadItem) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }
    setRequestingThreadId(thread.$id)
    try {
      const res = await joinPublicThreadAction({
        threadId: thread.$id,
        userEmail: user.email,
        userHandle: userProfile?.username,
      })
      if (res.success) {
        const handle = userProfile?.username || user.name
        setCustomThreads(prev =>
          prev.map(t =>
            t.$id === thread.$id
              ? {
                  ...t,
                  allowed_users: Array.from(
                    new Set([...(t.allowed_users || []), user.email.toLowerCase(), `@${handle.replace(/^@/, '')}`])
                  ),
                }
              : t
          )
        )
        setSelectedTag(thread.title)
      } else {
        alert(res.error || 'Failed to join channel.')
      }
    } catch {
      alert('Failed to join channel.')
    } finally {
      setRequestingThreadId(null)
    }
  }

  const handleRespondToJoinRequest = async (
    threadId: string,
    requesterStr: string,
    action: 'approve' | 'decline'
  ) => {
    if (!user) return
    const key = `${threadId}-${requesterStr}`
    setProcessingRequestId(key)
    try {
      const res = await respondToThreadJoinRequestAction({
        threadId,
        requesterStr,
        action,
        hostEmail: user.email,
      })
      if (res.success) {
        setCustomThreads(prev =>
          prev.map(t => {
            if (t.$id !== threadId) return t
            const newPending = (t.pending_requests || []).filter(p => p !== requesterStr)
            if (action === 'approve') {
              const parts = requesterStr.split('::')
              const handle = parts[0]?.trim()
              const email = parts[1]?.trim()
              const toAdd = [handle, email].filter(Boolean) as string[]
              const newAllowed = Array.from(new Set([...(t.allowed_users || []), ...toAdd]))
              return { ...t, pending_requests: newPending, allowed_users: newAllowed }
            }
            return { ...t, pending_requests: newPending }
          })
        )
      } else {
        alert(res.error || 'Failed to process request.')
      }
    } catch {
      alert('Error updating join request.')
    } finally {
      setProcessingRequestId(null)
    }
  }

  const handleDeleteThread = async (thread: CommunityThreadItem) => {
    if (!user || deletingThreadId) return
    setDeletingThreadId(thread.$id)
    try {
      const res = await deleteCommunityThreadAction({
        threadId: thread.$id,
        userEmail: user.email,
        userHandle: userProfile?.username,
      })
      if (res.success) {
        setCustomThreads(prev => prev.filter(t => t.$id !== thread.$id))
        setConfirmDeleteThreadId(null)
        if (selectedTag === thread.title || selectedTag === thread.slug) {
          setSelectedTag('All')
          reloadFeed('All')
        }
      } else {
        alert(res.error || 'Failed to delete thread.')
      }
    } catch {
      alert('Error deleting thread.')
    } finally {
      setDeletingThreadId(null)
    }
  }

  const handleInsertPostEmoji = (emoji: string) => {
    const textarea = postTextareaRef.current
    if (!textarea) {
      setPostContent(prev => prev + emoji)
      return
    }
    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const updated = postContent.slice(0, start) + emoji + postContent.slice(end)
    setPostContent(updated)
    setTimeout(() => {
      textarea.focus()
      const newPos = start + emoji.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleInsertCommentEmoji = (emoji: string) => {
    const input = commentInputRef.current
    if (!input) {
      setNewCommentText(prev => prev + emoji)
      return
    }
    const start = input.selectionStart || 0
    const end = input.selectionEnd || 0
    const updated = newCommentText.slice(0, start) + emoji + newCommentText.slice(end)
    setNewCommentText(updated)
    setTimeout(() => {
      input.focus()
      const newPos = start + emoji.length
      input.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const hostedThreadRequests = useMemo(() => {
    if (!user) return []
    const requests: { thread: CommunityThreadItem; requesterStr: string; displayHandle: string }[] = []
    for (const ct of customThreads) {
      if (isHostOfThread(ct, user.email, userProfile?.username) && ct.pending_requests && ct.pending_requests.length > 0) {
        for (const req of ct.pending_requests) {
          const displayHandle = req.includes('::')
            ? req.split('::')[0]
            : (req.startsWith('@') ? req : `@${req.split('@')[0]}`)
          requests.push({
            thread: ct,
            requesterStr: req,
            displayHandle,
          })
        }
      }
    }
    return requests
  }, [user, userProfile?.username, customThreads])

  const currentActiveThread = useMemo(() => {
    return customThreads.find(ct => ct.title === selectedTag || ct.slug === selectedTag) || null
  }, [selectedTag, customThreads])

  const isCurrentThreadPrivateLocked = useMemo(() => {
    if (!currentActiveThread || !currentActiveThread.is_private) return false
    return !isMemberOfThread(currentActiveThread, user?.email, userProfile?.username)
  }, [currentActiveThread, user?.email, userProfile?.username])

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

  /* ─── Pull-to-Refresh Handler ─── */
  const handlePullToRefresh = useCallback(async () => {
    try { navigator.vibrate?.([15]) } catch {}
    const handleToQuery = myHandleNormalized || userProfile?.username || user?.name
    await Promise.allSettled([
      new Promise<void>((resolve) => {
        getCommunityFeedAction(selectedTag)
          .then(res => {
            if (res.success && res.posts) {
              setPosts(res.posts)
              setHasNewPosts(false)
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.posts))
              } catch {}
            }
          })
          .catch(err => {
            console.warn('Feed pull-to-refresh error:', err)
          })
          .finally(() => {
            setLoading(false)
            resolve()
          })
      }),
      loadThreads(user?.email, handleToQuery),
      handleToQuery
        ? getMutualFollowsAction(handleToQuery)
            .then(res => {
              if (res.success && res.mutuals) {
                setMyMutuals(res.mutuals)
                try {
                  localStorage.setItem('psits_community_my_mutuals', JSON.stringify(res.mutuals))
                } catch {}
              }
            })
            .catch(() => {})
        : Promise.resolve(),
    ])
  }, [selectedTag, user?.email, myHandleNormalized, userProfile?.username, user?.name, loadThreads])

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
    const handleOpenPostEvent = (e: Event) => {
      const custom = e as CustomEvent<{ postId: string }>
      const targetId = custom.detail?.postId
      if (!targetId) return
      const existing = posts.find(p => p.$id === targetId)
      if (existing) {
        openComments(existing)
      } else {
        getSingleCommunityPostAction(targetId).then(res => {
          if (res.success && res.post) {
            openComments(res.post)
          }
        })
      }
    }
    const handleOpenNotifications = () => {
      setIsNotifModalOpen(true)
    }
    window.addEventListener('psits:open-profile', handleOpenProfile)
    window.addEventListener('psits:open-onboarding', handleOpenOnboarding)
    window.addEventListener('psits:filter-my-posts', handleFilterMyPosts)
    window.addEventListener('psits:open-post', handleOpenPostEvent)
    window.addEventListener('psits:open-notifications', handleOpenNotifications)
    return () => {
      window.removeEventListener('psits:open-profile', handleOpenProfile)
      window.removeEventListener('psits:open-onboarding', handleOpenOnboarding)
      window.removeEventListener('psits:filter-my-posts', handleFilterMyPosts)
      window.removeEventListener('psits:open-post', handleOpenPostEvent)
      window.removeEventListener('psits:open-notifications', handleOpenNotifications)
    }
  }, [posts])

  /* ─── 3. Auth State Sync & Institutional Onboarding Check ─── */
  useEffect(() => {
    const handleAuthUser = (sessionUser: SupabaseUser) => {
      const email = sessionUser.email || ''
      const metadata = (sessionUser.user_metadata || {}) as Record<string, unknown>
      const name = (typeof metadata.full_name === 'string' && metadata.full_name) || email.split('@')[0]
      const avatar = (typeof metadata.community_avatar === 'string' && metadata.community_avatar) || (typeof metadata.avatar_url === 'string' && metadata.avatar_url) || ''
      const username = typeof metadata.community_username === 'string' ? metadata.community_username : ''
      const isOfficer = Boolean(metadata.role === 'officer' || metadata.role === 'admin' || email.toLowerCase() === 'psits-ua@antiquespride.edu.ph')
      const isVerified = Boolean(isOfficer || metadata.is_verified || metadata.community_tos_accepted)
      const officerTitle = typeof metadata.officer_title === 'string' ? metadata.officer_title : undefined
      setUser({ email, name, avatar, isOfficer, isVerified, officerTitle })

      const initialProf: CommunityUserProfile = {
        email,
        name,
        username,
        avatar,
        yearSection: (typeof metadata.year_section === 'string' && metadata.year_section) || 'BSIT 1-A',
        bio: typeof metadata.bio === 'string' ? metadata.bio : '',
        hobbies: Array.isArray(metadata.hobbies) ? (metadata.hobbies as string[]) : ['Gaming & Esports', 'Programming'],
        github: typeof metadata.social_github === 'string' ? metadata.social_github : '',
        linkedin: typeof metadata.social_linkedin === 'string' ? metadata.social_linkedin : '',
        portfolio: typeof metadata.social_portfolio === 'string' ? metadata.social_portfolio : '',
        tosAccepted: Boolean(metadata.community_tos_accepted),
        tosAcceptedAt: typeof metadata.community_tos_accepted_at === 'string' ? metadata.community_tos_accepted_at : undefined,
      }
      try {
        const cachedLocal = localStorage.getItem(`psits_community_profile_${email}`)
        if (cachedLocal) {
          const parsed = JSON.parse(cachedLocal)
          if (parsed && typeof parsed === 'object') {
            Object.assign(initialProf, parsed)
          }
        }
      } catch {}
      setUserProfile(initialProf)

      if (email.toLowerCase() === 'psits-ua@antiquespride.edu.ph' || email.toLowerCase().includes('admin')) {
        setIsAdmin(true)
      }

      // Restore cached posts for authenticated student if present
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed)
            setLoading(false)
          }
        }
      } catch {}

      // Load custom threads and quota for authenticated student
      loadThreads(email, username)
      const isVer = Boolean(metadata.role === 'admin' || email.toLowerCase().includes('admin') || metadata.community_tos_accepted)
      checkThreadQuota(email, username, isVer)

      // Check if user has completed onboarding / accepted TOS
      const hasAcceptedTos = Boolean(metadata.community_tos_accepted)
      if (hasAcceptedTos) {
        try {
          localStorage.setItem('psits_community_tour_completed', 'true')
        } catch {}
      }

      setAuthLoading(false)

      // Check if returned from Google OAuth redirect for Community profile setup or requested step/tour
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search)
        const stepParam = urlParams.get('step')
        if (stepParam && ['1', '2', '3', '4'].includes(stepParam)) {
          setOnboardingInitialStep(Number(stepParam) as 1 | 2 | 3 | 4)
          setOnboardingAuthMode('create')
          setIsOnboardingOpen(true)
          window.history.replaceState({}, '', window.location.pathname)
        } else if (urlParams.get('onboard') === '1') {
          setOnboardingInitialStep(1)
          setOnboardingAuthMode('create')
          setIsOnboardingOpen(true)
          window.history.replaceState({}, '', window.location.pathname)
        } else if (urlParams.get('setup') === '1') {
          setOnboardingInitialStep(4)
          setOnboardingAuthMode('create')
          setIsOnboardingOpen(true)
          window.history.replaceState({}, '', window.location.pathname)
        } else if (!hasAcceptedTos) {
          // New student who signed in with Google but hasn't finalized Kasubay profile yet
          setOnboardingInitialStep(metadata.community_username ? 4 : 2)
          setOnboardingAuthMode('create')
          setIsOnboardingOpen(true)
        } else {
          // Returning registered user: NEVER show onboarding modal!
          setIsOnboardingOpen(false)
        }
      }
    }

    const handleLoggedOut = () => {
      setUser(null)
      setUserProfile(null)
      setIsAdmin(false)
      setAuthLoading(false)
    }

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user)
      } else {
        handleLoggedOut()
      }
      setAuthLoading(false)
    }).catch(() => {
      handleLoggedOut()
      setAuthLoading(false)
    })

    // 2. Realtime Auth State Change Listener (Syncs "Disconnect Account" or OAuth logins)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        handleLoggedOut()
      } else if (session?.user) {
        handleAuthUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadThreads, checkThreadQuota])

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

      // Case B: Post Created -> Prepend or Reconcile instantly without user refresh (Facebook style)
      if (events.some(e => e.includes('.create'))) {
        if (docStatus === 'active') {
          const isAnon = Boolean(payload.is_anonymous)
          const isOff = Boolean(payload.is_officer) && !isAnon
          const isVer = isOff || Boolean(payload.is_verified)
          const offTitle = isOff ? String(payload.officer_title || 'Officer') : undefined

          const rawAuthorName = String(payload.author_display_name || 'kasubay')
          const formattedAuthorName = isAnon
            ? 'Anonymous Kasubay'
            : (rawAuthorName.startsWith('@') ? rawAuthorName : `@${rawAuthorName.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`)

          const newPostItem: CommunityPostItem = {
            $id: docId,
            $createdAt: String(payload.$createdAt || new Date().toISOString()),
            content: String(payload.content || ''),
            author_student_no: undefined,
            author_display_name: formattedAuthorName,
            author_avatar: isAnon ? '' : (payload.author_avatar ? String(payload.author_avatar) : ''),
            author_year_section: isAnon ? 'BSIT Student' : (payload.author_year_section ? String(payload.author_year_section) : 'BSIT'),
            is_anonymous: isAnon,
            is_verified: isVer,
            is_officer: isOff,
            officer_title: offTitle,
            attachments: Array.isArray(payload.attachments) ? payload.attachments.map(String) : [],
            attachment_names: Array.isArray(payload.attachment_names) ? payload.attachment_names.map(String) : [],
            attachment_types: Array.isArray(payload.attachment_types) ? payload.attachment_types.map(String) : [],
            attachment_sizes: Array.isArray(payload.attachment_sizes) ? payload.attachment_sizes.map(String) : [],
            likes_count: Number(payload.likes_count) || 0,
            comments_count: Number(payload.comments_count) || 0,
            tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
            is_locked: Boolean(payload.is_locked),
            is_flagged: Boolean(payload.is_flagged),
            flag_count: Number(payload.flag_count) || 0,
            status: 'active',
          }

          setPosts(prev => {
            // 1. If document already present, don't duplicate
            if (prev.some(p => p.$id === docId)) return prev

            // 2. If matching an optimistic post (starts with temp-), replace it in-place
            const optimisticIndex = prev.findIndex(p => p.$id.startsWith('temp-') && p.content === newPostItem.content)
            let next: CommunityPostItem[]
            if (optimisticIndex !== -1) {
              next = [...prev]
              next[optimisticIndex] = newPostItem
            } else {
              // 3. Prepend directly into the feed
              next = [newPostItem, ...prev]
            }

            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next))
            } catch {}
            return next
          })
          setHasNewPosts(false)
        }
        return
      }

      // Case C: Post Updated (Reactions, Comments, Content Edit, Officer Badge, Lock Status)
      if (events.some(e => e.includes('.update'))) {
        setPosts(prev => {
          const updated = prev.map(p => {
            if (p.$id !== docId) return p
            return {
              ...p,
              content: typeof payload.content === 'string' ? payload.content : p.content,
              likes_count: typeof payload.likes_count === 'number' ? payload.likes_count : p.likes_count,
              comments_count: typeof payload.comments_count === 'number' ? payload.comments_count : p.comments_count,
              is_locked: Boolean(payload.is_locked ?? p.is_locked),
              is_officer: typeof payload.is_officer === 'boolean' ? payload.is_officer : p.is_officer,
              is_verified: typeof payload.is_verified === 'boolean' ? payload.is_verified : (Boolean(payload.is_officer) || p.is_verified),
              tags: Array.isArray(payload.tags) ? payload.tags.map(String) : p.tags,
            }
          })
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
          } catch {}
          return updated
        })
      }
    })

    return () => {
      try {
        unsubscribe()
      } catch {}
    }
  }, [])

  /* ─── 5.2. Background Tab Focus Sync (Silently updates feed when user returns without reload) ─── */
  useEffect(() => {
    let lastSync = Date.now()
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSync > 15000) {
        lastSync = Date.now()
        getCommunityFeedAction(selectedTag)
          .then(res => {
            if (res.success && res.posts) {
              setPosts(res.posts)
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.posts))
              } catch {}
            }
          })
          .catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
    }
  }, [selectedTag])

  /* ─── 5.5. Appwrite Realtime Comment Stream (Live Instagram-style comment sync) ─── */
  const activeCommentPostId = activeCommentPost?.$id
  useEffect(() => {
    if (!activeCommentPostId) return

    const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.COMMENTS}.documents`

    const unsubscribe = appwrite.subscribe(channel, (response: { events: string[]; payload: Record<string, unknown> }) => {
      const events = response.events || []
      const payload = response.payload
      const commentId = String(payload.$id || '')
      const commentStatus = String(payload.status || 'active')

      // Case A: Comment Deleted (Appwrite .delete events contain only $id and omit document attributes like post_id)
      if (events.some(e => e.includes('.delete')) || commentStatus === 'deleted') {
        if (commentId) {
          setComments(prev =>
            prev.map(c =>
              c.$id === commentId
                ? {
                    ...c,
                    status: 'deleted',
                    content: 'This comment has been deleted',
                    author_display_name: 'Kasubay',
                    author_avatar: '',
                  }
                : c
            )
          )
        }
        return
      }

      const targetPostId = String(payload.post_id || '')
      if (targetPostId && targetPostId !== activeCommentPostId) return

      // Case B: Comment Edited
      if (events.some(e => e.includes('.update'))) {
        setComments(prev =>
          prev.map(c =>
            c.$id === commentId
              ? {
                  ...c,
                  content: String(payload.content || c.content),
                  is_edited: Boolean(payload.is_edited ?? c.is_edited),
                }
              : c
          )
        )
        return
      }

      // Case C: New Comment Created (by current user or another student)
      if (events.some(e => e.includes('.create'))) {
        setComments(prev => {
          // If already in list with same ID, avoid duplicate
          if (prev.some(c => c.$id === commentId)) return prev

          const incoming: CommunityCommentItem = {
            $id: commentId,
            $createdAt: String(payload.$createdAt || new Date().toISOString()),
            content: String(payload.content || ''),
            author_student_no: payload.author_student_no ? String(payload.author_student_no) : undefined,
            author_display_name: String(payload.author_display_name || 'Kasubay'),
            author_avatar: payload.author_avatar ? String(payload.author_avatar) : '',
            is_anonymous: Boolean(payload.is_anonymous),
            is_verified: Boolean(payload.is_verified),
            is_officer: Boolean(payload.is_officer),
            officer_title: payload.officer_title ? String(payload.officer_title) : undefined,
            parent_id: payload.parent_id ? String(payload.parent_id) : undefined,
            reply_to_handle: payload.reply_to_handle ? String(payload.reply_to_handle) : undefined,
            is_edited: Boolean(payload.is_edited),
            status: 'active',
          }

          // If there is an optimistic comment matching same content and parent, replace it!
          const optimisticIdx = prev.findIndex(
            c => c.$id.startsWith('optimistic-') &&
                 c.content.trim() === incoming.content.trim() &&
                 (c.parent_id || undefined) === (incoming.parent_id || undefined)
          )

          if (optimisticIdx !== -1) {
            const updated = [...prev]
            updated[optimisticIdx] = incoming
            return deduplicateComments(updated)
          }

          return deduplicateComments([...prev, incoming])
        })
      }
    })

    return () => {
      try {
        unsubscribe()
      } catch {}
    }
  }, [activeCommentPostId])

  /* ─── 6. Handle File Upload (Compressed WebP / Direct to Appwrite Storage) ─── */
  const processUploadFile = async (file: File) => {
    if (!file) return

    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`"${file.name}" exceeds the 15MB upload limit.`)
      setTimeout(() => setUploadError(null), 5000)
      return
    }

    setUploadError(null)
    setUploadingFileName(file.name)
    setIsUploadingFile(true)
    try {
      let uploadFile: File = file

      // Auto-compress photos to lightweight WebP before uploading
      if (file.type.startsWith('image/')) {
        uploadFile = await compressImageToWebP(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 })
      }

      // Upload directly to Appwrite Singapore Bucket (0 MB server load!)
      const createdFile = await appwriteStorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        uploadFile
      )

      const sizeStr = (uploadFile.size / (1024 * 1024)).toFixed(1) + ' MB'
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(uploadFile) : undefined
      setAttachments(prev => [
        ...prev,
        {
          id: createdFile.$id,
          name: file.name,
          size: sizeStr,
          type: file.type.includes('pdf') ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'doc',
          previewUrl,
        },
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Please verify file size and type.'
      setUploadError(`Upload failed: ${msg}`)
      setTimeout(() => setUploadError(null), 6000)
    } finally {
      setIsUploadingFile(false)
      setUploadingFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processUploadFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDraggingFile) setIsDraggingFile(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDraggingFile(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processUploadFile(files[0])
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          await processUploadFile(file)
          break
        }
      }
    }
  }

  const handleInsertCodeSnippet = () => {
    if (!codeSnippet.trim()) return
    const header = codeTitle.trim() ? `// ${codeTitle.trim()}\n` : ''
    const formatted = `\`\`\`${codeLanguage}\n${header}${codeSnippet.trim()}\n\`\`\`\n`
    setPostContent(prev => prev ? `${prev.trimEnd()}\n\n${formatted}` : formatted)
    setIsCodeModalOpen(false)
    setCodeSnippet('')
    setCodeTitle('')
  }

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const val = target.value
      target.value = val.substring(0, start) + '  ' + val.substring(end)
      target.selectionStart = target.selectionEnd = start + 2
      setCodeSnippet(target.value)
    }
  }

  const handleInsertBold = () => {
    const textarea = postTextareaRef.current
    if (!textarea) {
      setPostContent(prev => prev ? `${prev} **bold text**` : '**bold text**')
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postContent.slice(start, end)

    if (selectedText) {
      const updated = postContent.slice(0, start) + `**${selectedText}**` + postContent.slice(end)
      setPostContent(updated)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 2, end + 2)
      }, 0)
    } else {
      const placeholder = '**bold text**'
      const updated = postContent.slice(0, start) + placeholder + postContent.slice(end)
      setPostContent(updated)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 2, start + 2 + 'bold text'.length)
      }, 0)
    }
  }

  const handleInsertBulletList = () => {
    const textarea = postTextareaRef.current
    if (!textarea) {
      setPostContent(prev => prev ? `${prev}\n- ` : '- ')
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = postContent.slice(start, end)

    if (selectedText) {
      const lines = selectedText.split('\n')
      const formattedLines = lines.map(line => line.startsWith('- ') ? line : `- ${line}`).join('\n')
      const updated = postContent.slice(0, start) + formattedLines + postContent.slice(end)
      setPostContent(updated)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start, start + formattedLines.length)
      }, 0)
    } else {
      const beforeCursor = postContent.slice(0, start)
      const needsNewline = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
      const insertion = needsNewline ? '\n- ' : '- '
      const updated = postContent.slice(0, start) + insertion + postContent.slice(end)
      setPostContent(updated)
      setTimeout(() => {
        textarea.focus()
        const newCursor = start + insertion.length
        textarea.setSelectionRange(newCursor, newCursor)
      }, 0)
    }
  }

  /* ─── 7. Handle Create Post Submission (Optimistic UI 0ms) ─── */
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

    const trimmedContent = postContent.trim()
    if (!trimmedContent) return

    const authorHandle = userProfile.username.startsWith('@')
      ? userProfile.username
      : `@${userProfile.username}`
    const authorAvatar = userProfile?.avatar || user.avatar
    const authorYearSection = userProfile?.yearSection || 'BSIT'
    const pendingAttachments = [...attachments]
    const pendingTag = selectedPostTag

    // 0ms Optimistic UI Post
    const tempId = `optimistic-${Date.now()}`
    const optimisticPost: CommunityPostItem = {
      $id: tempId,
      $createdAt: new Date().toISOString(),
      content: trimmedContent,
      author_display_name: authorHandle,
      author_avatar: authorAvatar,
      author_year_section: authorYearSection,
      is_anonymous: false,
      is_verified: Boolean(isAdmin || user?.isOfficer || user?.isVerified),
      is_officer: Boolean(isAdmin || user?.isOfficer),
      officer_title: isAdmin ? 'PSITS Administrator' : (user?.officerTitle || 'PSITS Officer'),
      attachments: pendingAttachments.map(a => a.id),
      attachment_names: pendingAttachments.map(a => a.name),
      attachment_types: pendingAttachments.map(a => a.type),
      attachment_sizes: pendingAttachments.map(a => a.size),
      likes_count: 0,
      comments_count: 0,
      tags: [pendingTag],
      is_locked: false,
      is_flagged: false,
      flag_count: 0,
      status: 'active',
    }

    // Instantly close modal and prepend post in 0ms!
    setPosts(prev => [optimisticPost, ...prev])
    setPostContent('')
    setAttachments([])
    setIsCreateOpen(false)

    // Sync to local cache immediately
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      const parsed = cached ? JSON.parse(cached) : []
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([optimisticPost, ...parsed]))
    } catch {}

    // Dispatch network request in background
    createCommunityPostAction({
      content: trimmedContent,
      userEmail: user.email,
      userName: authorHandle,
      userAvatar: authorAvatar,
      userYearSection: authorYearSection,
      isAnonymous: false,
      tags: [pendingTag],
      attachments: pendingAttachments.map(a => a.id),
      attachmentNames: pendingAttachments.map(a => a.name),
      attachmentTypes: pendingAttachments.map(a => a.type),
      attachmentSizes: pendingAttachments.map(a => a.size),
    })
      .then(res => {
        if (res.success && res.post) {
          // Reconcile temporary optimistic post with real server document
          setPosts(prev => {
            const updated = prev.map(p => p.$id === tempId ? res.post! : p)
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
            } catch {}
            return updated
          })
        } else {
          // Revert optimistic post and notify user
          setPosts(prev => {
            const reverted = prev.filter(p => p.$id !== tempId)
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reverted))
            } catch {}
            return reverted
          })
          alert(res.error || 'Failed to publish post. Please try again.')
        }
      })
      .catch(err => {
        console.error('Post creation error:', err)
        setPosts(prev => {
          const reverted = prev.filter(p => p.$id !== tempId)
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reverted))
          } catch {}
          return reverted
        })
        alert('Network error while publishing post. Please check your connection.')
      })
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
        userName: userProfile?.name || user.name,
        userAvatar: userProfile?.avatar || user.avatar,
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
    setReplyingToComment(null)
    setEditingCommentId(null)
    setNewCommentText('')
    setComments([]) // Instantly clear previous comments so stale comments never show
    setCommentsLoading(true)
    try {
      const res = await getCommentsForPostAction(post.$id)
      if (res.success) {
        setComments(deduplicateComments(res.comments))
      }
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleStartReply = (c: CommunityCommentItem) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }
    const rawHandle = c.author_display_name.startsWith('@')
      ? c.author_display_name
      : `@${c.author_display_name.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`
    const cleanHandle = rawHandle.replace(/^@/, '')
    const targetParentId = c.parent_id || c.$id
    setReplyingToComment({ id: targetParentId, author: cleanHandle })
    setNewCommentText(`@${cleanHandle} `)
    setCollapsedReplyIds(prev => {
      if (prev.has(targetParentId)) {
        const next = new Set(prev)
        next.delete(targetParentId)
        return next
      }
      return prev
    })
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 50)
  }

  const handleCancelReply = () => {
    setReplyingToComment(null)
    setNewCommentText('')
  }

  const handleStartEditComment = (c: CommunityCommentItem) => {
    setEditingCommentId(c.$id)
    setEditingCommentText(c.content)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!user || !editingCommentText.trim() || isSavingCommentEdit) return
    setIsSavingCommentEdit(true)
    try {
      const res = await editCommunityCommentAction({
        commentId,
        content: editingCommentText.trim(),
        userEmail: user.email,
      })
      if (res.success) {
        setComments(prev =>
          prev.map(c =>
            c.$id === commentId
              ? { ...c, content: editingCommentText.trim(), is_edited: true }
              : c
          )
        )
        setEditingCommentId(null)
        setEditingCommentText('')
      } else {
        alert(res.error || 'Failed to edit comment.')
      }
    } catch {
      alert('Network error while saving comment.')
    } finally {
      setIsSavingCommentEdit(false)
    }
  }

  const handleDeleteComment = async (c: CommunityCommentItem) => {
    if (!user || isDeletingCommentId) return

    setIsDeletingCommentId(c.$id)
    try {
      const res = await deleteCommunityCommentAction({
        commentId: c.$id,
        userEmail: user.email,
      })
      if (res.success) {
        setComments(prev =>
          prev.map(item =>
            item.$id === c.$id
              ? {
                  ...item,
                  status: 'deleted',
                  content: 'This comment has been deleted',
                  author_display_name: 'Kasubay',
                  author_avatar: '',
                }
              : item
          )
        )
        setConfirmDeleteCommentId(null)
      } else {
        alert(res.error || 'Failed to delete comment.')
      }
    } catch {
      alert('Network error while deleting comment.')
    } finally {
      setIsDeletingCommentId(null)
    }
  }

  const handleAddComment = async () => {
    if (isSubmittingComment) return

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
    const contentToSubmit = newCommentText.trim()
    const currentPostId = activeCommentPost.$id
    const replyingParent = replyingToComment

    // Validate mutual-only mentions
    const mentionMatches = Array.from(contentToSubmit.matchAll(/@([a-zA-Z0-9_.]+)/g)).map(m => m[1].toLowerCase())
    const explicitMentions = mentionMatches.filter(m => !replyingParent || m !== replyingParent.author.toLowerCase().replace(/^@/, ''))

    if (explicitMentions.length > 0) {
      const nonMutuals = explicitMentions.filter(m => !myMutuals.some(mutual => mutual.handle.toLowerCase() === m))
      if (nonMutuals.length > 0) {
        setMentionError(`@${nonMutuals[0]} is not a mutual follower. You can only mention students who follow you back.`)
        setIsSubmittingComment(false)
        return
      }
    }

    const authorHandle = userProfile.username.startsWith('@')
      ? userProfile.username
      : `@${userProfile.username}`
    const authorAvatar = userProfile?.avatar || user.avatar

    // 0ms Optimistic Comment UI
    const tempCommentId = `optimistic-c-${Date.now()}`
    const optimisticComment: CommunityCommentItem = {
      $id: tempCommentId,
      $createdAt: new Date().toISOString(),
      content: contentToSubmit,
      author_student_no: user.email,
      author_display_name: authorHandle,
      author_avatar: authorAvatar,
      is_anonymous: false,
      is_verified: Boolean(isAdmin || user?.isOfficer || user?.isVerified),
      is_officer: Boolean(isAdmin || user?.isOfficer),
      officer_title: isAdmin ? 'PSITS Administrator' : (user?.officerTitle || 'PSITS Officer'),
      parent_id: replyingParent?.id,
      reply_to_handle: replyingParent?.author,
      is_edited: false,
      status: 'active',
    }

    // 1. Instantly append comment (0ms perceived latency)
    setComments(prev => deduplicateComments([...prev, optimisticComment]))
    if (replyingParent?.id) {
      setCollapsedReplyIds(prev => {
        if (prev.has(replyingParent.id)) {
          const next = new Set(prev)
          next.delete(replyingParent.id)
          return next
        }
        return prev
      })
    }

    // 2. Instantly increment comments count on feed and active post
    setPosts(prev =>
      prev.map(p =>
        p.$id === currentPostId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
      )
    )
    setActiveCommentPost(prev =>
      prev && prev.$id === currentPostId
        ? { ...prev, comments_count: (prev.comments_count || 0) + 1 }
        : prev
    )

    // 3. Instantly reset input, reply indicator, and mentions
    setNewCommentText('')
    setReplyingToComment(null)
    setMentionError(null)
    setMentionQuery(null)
    setMentionIndex(-1)

    // 4. Background network request & reconciliation
    addCommentAction({
      postId: currentPostId,
      content: contentToSubmit,
      userEmail: user.email,
      userName: authorHandle,
      userAvatar: authorAvatar,
      isAnonymous: false,
      parentId: replyingParent?.id,
      replyToHandle: replyingParent?.author,
    })
      .then(res => {
        if (res.success && res.comment) {
          // Reconcile temporary optimistic comment with permanent server comment
          setComments(prev => {
            if (prev.some(c => c.$id === res.comment!.$id)) {
              return prev.filter(c => c.$id !== tempCommentId)
            }
            return deduplicateComments(
              prev.map(c => (c.$id === tempCommentId ? res.comment! : c))
            )
          })
        } else {
          // Rollback on server error
          setComments(prev => prev.filter(c => c.$id !== tempCommentId))
          setPosts(prev =>
            prev.map(p =>
              p.$id === currentPostId
                ? { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) }
                : p
            )
          )
          setActiveCommentPost(prev =>
            prev && prev.$id === currentPostId
              ? { ...prev, comments_count: Math.max(0, (prev.comments_count || 1) - 1) }
              : prev
          )
          alert(res.error || 'Failed to post comment.')
        }
      })
      .catch(() => {
        // Rollback on network failure
        setComments(prev => prev.filter(c => c.$id !== tempCommentId))
        setPosts(prev =>
          prev.map(p =>
            p.$id === currentPostId
              ? { ...p, comments_count: Math.max(0, (p.comments_count || 1) - 1) }
              : p
          )
        )
        setActiveCommentPost(prev =>
          prev && prev.$id === currentPostId
            ? { ...prev, comments_count: Math.max(0, (prev.comments_count || 1) - 1) }
            : prev
        )
        alert('Network error while posting comment.')
      })
      .finally(() => {
        setIsSubmittingComment(false)
      })
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

  // Filtered & Sorted post results based on search input, category, tags, and quick-filters
  const filteredPosts = useMemo(() => {
    let list = posts.filter(post => {
      // 0. Hidden Posts Filter (User hid this post from their feed)
      if (hiddenPostIds.includes(post.$id)) {
        return false
      }

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

    // 6. Sorting with deterministic recency tie-breaking
    if (sortBy === 'popular') {
      list = [...list].sort((a, b) => {
        const diff = (b.likes_count || 0) - (a.likes_count || 0)
        if (diff !== 0) return diff
        return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      })
    } else if (sortBy === 'discussed') {
      list = [...list].sort((a, b) => {
        const diff = (b.comments_count || 0) - (a.comments_count || 0)
        if (diff !== 0) return diff
        return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      })
    } else {
      // Latest first
      list = [...list].sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    }

    return list
  }, [posts, searchQuery, filterOnlyWithFiles, filterOnlyOfficers, filterOnlySaved, filterOnlyMyPosts, savedPostIds, hiddenPostIds, sortBy, user, userProfile])

  // Comments Tree Memos (Hierarchical nesting of comments & replies)
  const topLevelComments = useMemo(() => {
    return comments.filter(c => !c.parent_id)
  }, [comments])

  const replyMap = useMemo(() => {
    const map: Record<string, CommunityCommentItem[]> = {}
    comments.forEach(c => {
      if (c.parent_id) {
        if (!map[c.parent_id]) map[c.parent_id] = []
        map[c.parent_id].push(c)
      }
    })
    return map
  }, [comments])

  const orphanReplies = useMemo(() => {
    const topIds = new Set(topLevelComments.map(c => c.$id))
    return comments.filter(c => Boolean(c.parent_id) && !topIds.has(c.parent_id!))
  }, [comments, topLevelComments])

  const renderCommentItem = (c: CommunityCommentItem, isReply = false) => {
    const isDeleted = c.status === 'deleted'
    const handle = c.author_display_name.startsWith('@') || c.author_display_name.startsWith('Anonymous') || isDeleted
      ? c.author_display_name
      : `@${c.author_display_name.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`
    const cleanHandle = handle.replace(/^@/, '')
    const isAuthor = Boolean(
      user &&
      !isDeleted &&
      ((c.author_student_no && user.email.toLowerCase() === c.author_student_no.toLowerCase()) ||
        (userProfile?.username && cleanHandle === userProfile.username.replace(/^@/, '').toLowerCase()))
    )

    if (isDeleted) {
      return (
        <div key={c.$id} className="flex items-start gap-3 opacity-60 py-1">
          <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0 mt-0.5 text-slate-400">
            <User className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0 text-xs sm:text-[13px] leading-relaxed">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 dark:text-white/30">{formatRelativeTime(c.$createdAt)}</span>
            </div>
            <p className="italic text-slate-400 dark:text-white/40 text-xs mt-0.5 select-none font-sans">
              This comment has been deleted
            </p>
          </div>
        </div>
      )
    }

    return (
      <div key={c.$id} className={`flex items-start gap-3 group transition-all duration-150 rounded-xl p-1 -m-1 ${replyingToComment?.id === c.$id ? 'bg-gold/[0.05] ring-1 ring-gold/25' : ''}`}>
        <Link
          href={c.is_anonymous ? '#' : `/community/${cleanHandle}`}
          className={`${isReply ? 'w-7 h-7' : 'w-8 h-8'} rounded-full overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center ring-1 ring-black/10 dark:ring-white/10 mt-0.5`}
        >
          {c.author_avatar && !c.author_avatar.startsWith('preset:') ? (
            <Image
              src={c.author_avatar}
              alt={c.author_display_name}
              width={isReply ? 28 : 32}
              height={isReply ? 28 : 32}
              className="w-full h-full object-cover"
              unoptimized={Boolean(c.author_avatar.startsWith('data:') || c.author_avatar.includes('appwrite'))}
            />
          ) : (
            renderAvatarIcon(c.author_avatar, c.author_display_name, `${isReply ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gold`)
          )}
        </Link>

        <div className="flex-1 min-w-0 text-xs sm:text-[13px] leading-relaxed">
          {editingCommentId === c.$id ? (
            <div className="space-y-2 mt-0.5 animate-in fade-in duration-100">
              <textarea
                value={editingCommentText}
                onChange={e => setEditingCommentText(e.target.value)}
                rows={2}
                autoFocus
                className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-gold/40 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none leading-relaxed resize-none font-sans"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEditComment}
                  disabled={isSavingCommentEdit}
                  className="px-2.5 py-1 text-[11px] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingCommentEdit || !editingCommentText.trim()}
                  onClick={() => handleSaveCommentEdit(c.$id)}
                  className="px-3 py-1 text-[11px] font-bold rounded-lg bg-gold hover:bg-gold-muted text-slate-950 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  {isSavingCommentEdit && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>{isSavingCommentEdit ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={c.is_anonymous ? '#' : `/community/${cleanHandle}`}
                    className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white hover:underline"
                  >
                    {handle}
                  </Link>
                  {(c.is_officer || c.is_verified) && (
                    <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block" />
                  )}
                  {c.reply_to_handle && (
                    <span className="text-[11px] font-semibold text-gold select-none">
                      replied to @{c.reply_to_handle.replace(/^@/, '')}
                    </span>
                  )}
                </div>
                <p className="text-[13.5px] sm:text-[14.5px] text-slate-900 dark:text-slate-100 leading-relaxed font-sans break-words pt-0.5">
                  {renderCommentContentWithMentions(c.content)}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 dark:text-white/40 flex-wrap">
                <span>{formatRelativeTime(c.$createdAt)}</span>
                {c.is_edited && (
                  <span className="text-[10px] text-slate-400/80 dark:text-white/30 italic font-mono select-none">
                    • edited
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleStartReply(c)}
                  className="font-bold text-slate-600 dark:text-white/70 hover:text-gold transition-colors cursor-pointer"
                >
                  Reply
                </button>
                {(isAuthor || isAdmin) && (
                  <div className="flex items-center gap-2 pl-1 border-l border-black/[0.08] dark:border-white/[0.1]">
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleStartEditComment(c)}
                        className="hover:text-gold text-slate-400 dark:text-white/40 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    {confirmDeleteCommentId === c.$id ? (
                      <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg animate-in fade-in duration-150">
                        <span className="text-red-500 text-[10px] font-medium">Delete?</span>
                        <button
                          type="button"
                          disabled={isDeletingCommentId === c.$id}
                          onClick={() => handleDeleteComment(c)}
                          className="px-1.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[10px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isDeletingCommentId === c.$id ? '...' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteCommentId(null)}
                          className="px-1 py-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white text-[10px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCommentId(c.$id)}
                        className="hover:text-rose-500 text-slate-400 dark:text-white/40 transition-colors cursor-pointer text-[10px] flex items-center gap-1 font-medium"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── 4. Initial Auth Handshake Preloader (Zero UI Leakage) ───
  if (authLoading) {
    return <CommunityFeedSkeleton />
  }

  return (
    <>
      <div className="pt-3 sm:pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6 space-y-3 sm:space-y-5 overflow-x-hidden">
      {/* ─── Sticky Offline Resilience Banner ─── */}
      {isOffline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] bg-gold text-slate-950 font-semibold px-4 py-2 rounded-full shadow-2xl text-xs flex items-center justify-center gap-2 border border-gold/40 animate-pulse">
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span className="truncate">Offline Mode: Viewing cached threads. Actions will sync when connected.</span>
        </div>
      )}

      {/* ─── Native Embedded Header & Instagram-Style Thread Selector ─── */}
      <div className="flex items-center justify-between pt-1 pb-0.5">
        {/* Left: Mobile Hamburger Navigation Toggle */}
        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.([15]) } catch {}
            window.dispatchEvent(new CustomEvent('psits:toggle-menu'))
          }}
          className="md:hidden w-10 h-10 flex items-center justify-start text-gold hover:opacity-80 active:scale-95 transition-all cursor-pointer select-none"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Center (Mobile) / Left (Desktop): Instagram-Style Dropdown */}
        <div className="relative flex justify-center md:justify-start flex-1 md:flex-initial" ref={threadsDropdownRef}>
          <button
            type="button"
            onClick={() => {
              try { navigator.vibrate?.([15]) } catch {}
              setIsThreadsDropdownOpen(prev => !prev)
            }}
            className="flex items-center gap-1 font-display font-bold text-lg sm:text-2xl text-slate-900 dark:text-white hover:opacity-80 active:scale-98 transition-all cursor-pointer select-none py-1 px-2 rounded-xl"
            aria-expanded={isThreadsDropdownOpen}
            aria-haspopup="true"
          >
            <span className="tracking-tight">
              {selectedTag === 'All' ? 'Community' : `#${selectedTag}`}
            </span>
            <ChevronDown
              size={17}
              className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                isThreadsDropdownOpen ? 'rotate-180 text-gold' : ''
              }`}
            />
          </button>

          {/* Instagram-Style Dropdown Menu */}
          <AnimatePresence>
            {isThreadsDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 top-full mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-1.5 space-y-1 z-50 overflow-hidden"
              >
                {/* Default Community Feed (All Threads) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag('All')
                    reloadFeed('All')
                    setIsThreadsDropdownOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    selectedTag === 'All'
                      ? 'bg-gold/15 text-gold font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={14} className={selectedTag === 'All' ? 'text-gold' : 'text-slate-400'} />
                    <span>Community (All)</span>
                  </div>
                  {selectedTag === 'All' && <Check size={14} className="text-gold" />}
                </button>

                {/* Custom Discussion Threads */}
                {customThreads.length > 0 && (
                  <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin py-0.5 border-t border-black/[0.04] dark:border-white/[0.06]">
                    {customThreads.map(ct => {
                      const isSelected = selectedTag === ct.title || selectedTag === ct.slug
                      return (
                        <button
                          key={ct.$id}
                          type="button"
                          onClick={() => {
                            setSelectedTag(ct.title)
                            reloadFeed(ct.title)
                            setIsThreadsDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-gold/15 text-gold font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {ct.is_private ? (
                              <Lock size={12} className="text-amber-500 shrink-0" />
                            ) : (
                              <Hash size={12} className="text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{ct.title}</span>
                          </div>
                          {isSelected && <Check size={14} className="text-gold shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* + New Discussion Thread */}
                <div className="pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsThreadsDropdownOpen(false)
                      handleOpenCreateThread()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gold hover:bg-gold/10 transition-colors cursor-pointer"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>New Thread</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Mobile Notification Bell */}
        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.([15]) } catch {}
            setIsNotifModalOpen(true)
          }}
          className="md:hidden w-10 h-10 flex items-center justify-end relative text-slate-700 dark:text-slate-200 hover:text-gold transition-colors cursor-pointer select-none"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadNotifCount > 0 && (
            <span className="absolute top-2 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#07090e]" />
          )}
        </button>
      </div>

      {/* ─── Pull To Refresh Feed Scroller (Directly Above Round Profiles Only) ─── */}
      <PullToRefresh
        onRefresh={handlePullToRefresh}
        disabled={isNotifModalOpen || isCreateOpen || Boolean(activeCommentPost) || isOnboardingOpen || isSearchModalOpen || Boolean(editingPost) || isCreateThreadOpen || Boolean(isDeletingPostId)}
        className="w-full bg-transparent overflow-visible"
        contentClassName="overflow-visible space-y-3 sm:space-y-5"
      >
      {/* ─── Instagram-Style Mutuals Stories Tray (Minimalist Active Status Badge) ─── */}
      <div className="pb-2.5 pt-0.5 border-b border-black/[0.04] dark:border-white/[0.06] overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-3.5 sm:gap-4.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {/* 1. Current User ("Your story") */}
          <Link
            href={user ? `/community/${myHandleNormalized || ''}` : '#'}
            onClick={(e) => {
              if (!user) {
                e.preventDefault()
                setOnboardingInitialStep(1)
                setIsOnboardingOpen(true)
              }
            }}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer select-none"
            title={user ? 'Your Profile' : 'Sign in to join community'}
          >
            <div className="relative">
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-full overflow-hidden bg-slate-800 border border-black/[0.08] dark:border-white/10 transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
                {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                  <Image
                    src={userProfile.avatar}
                    alt="You"
                    width={60}
                    height={60}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name || 'You', 'w-6 h-6 text-gold')
                )}
              </div>
              {user && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#07090e]" />
              )}
            </div>
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-14 sm:w-15 text-center">
              Your story
            </span>
          </Link>

          {/* Skeleton Preloader for Mutuals Tray */}
          {user && isMutualsLoading && displayMutuals.length === 0 ? (
            <>
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="flex flex-col items-center gap-1 shrink-0 select-none animate-pulse">
                  <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-black/5 dark:bg-white/10 border border-black/[0.04] dark:border-white/[0.06]" />
                  <div className="w-10 h-2 rounded-full bg-black/5 dark:bg-white/10 mt-1" />
                </div>
              ))}
            </>
          ) : (
            <>
              {/* 2. Mutual Followers Tray: Active Badge (No ring) */}
              {displayMutuals.map((m) => {
                const isOnline = onlineHandlesSet.has(normalizeCommunityHandle(m.handle))
                const cleanHandle = (m.handle || '').replace(/^@/, '')

                return (
                  <Link
                    key={m.handle}
                    href={`/community/${cleanHandle}`}
                    className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer select-none"
                    title={`${m.name} (@${cleanHandle}) · ${isOnline ? 'Active now' : 'Offline'}`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-full overflow-hidden bg-slate-800 border border-black/[0.08] dark:border-white/10 transition-transform duration-200 group-hover:scale-105 flex items-center justify-center">
                        {m.avatar && !m.avatar.startsWith('preset:') ? (
                          <Image
                            src={m.avatar}
                            alt={m.name}
                            width={60}
                            height={60}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          renderAvatarIcon(m.avatar, m.name, 'w-6 h-6 text-gold')
                        )}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#07090e]" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-14 sm:w-15 text-center lowercase">
                      {cleanHandle}
                    </span>
                  </Link>
                )
              })}

              {/* Empty State: Logged-in user has no mutuals yet */}
              {user && displayMutuals.length === 0 && (
                <div className="flex items-center gap-2 px-2 py-2 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  <span>Follow classmates who follow you back to see their live active status here</span>
                </div>
              )}
            </>
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
                <span>↑ New posts published — Reload</span>
              </button>
            </div>
          )}







          {/* Active Thread Banner (Public or Member-Joined) */}
          {currentActiveThread && !isCurrentThreadPrivateLocked && (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentActiveThread.is_private ? (
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-gold shrink-0" />
                  )}
                  <h2 className="font-display font-bold text-base text-slate-900 dark:text-white truncate">
                    #{currentActiveThread.title}
                  </h2>
                  {isHostOfThread(currentActiveThread, user?.email, userProfile?.username) && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gold/15 text-gold border border-gold/30 shrink-0">
                      Host
                    </span>
                  )}
                </div>
                {currentActiveThread.description && (
                  <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2">
                    {currentActiveThread.description}
                  </p>
                )}
                <div className="text-[11px] font-mono text-slate-400">
                  👥 {getThreadMemberCount(currentActiveThread)} joined · Hosted by {currentActiveThread.creator_display_name}
                </div>
              </div>

              {isHostOfThread(currentActiveThread, user?.email, userProfile?.username) && (
                <div className="shrink-0 self-start sm:self-center">
                  {confirmDeleteThreadId === currentActiveThread.$id ? (
                    <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-xl animate-in fade-in">
                      <span className="text-red-500 text-xs font-semibold">Delete thread?</span>
                      <button
                        type="button"
                        disabled={deletingThreadId === currentActiveThread.$id}
                        onClick={() => handleDeleteThread(currentActiveThread)}
                        className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingThreadId === currentActiveThread.$id ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteThreadId(null)}
                        className="px-1.5 py-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteThreadId(currentActiveThread.$id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-medium transition-colors cursor-pointer"
                      title="Delete your discussion thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Thread</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Community Feed ─── */}
          {isCurrentThreadPrivateLocked && currentActiveThread ? (
            <div className="py-16 sm:py-20 px-4 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/25 to-yellow-500/10 blur-xl pointer-events-none" />
                <div className="w-full h-full rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-sm flex items-center justify-center text-amber-500 shadow-xs">
                  <Lock className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.6]" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  #{currentActiveThread.title} is private
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 leading-relaxed max-w-xs mx-auto">
                  {currentActiveThread.description || 'This channel is restricted to invited members only.'}
                </p>
                <div className="text-[11px] font-mono text-slate-400 pt-0.5">
                  👥 {getThreadMemberCount(currentActiveThread)} joined · Hosted by {currentActiveThread.creator_display_name}
                </div>
              </div>

              <div className="pt-2">
                {isPendingJoinRequest(currentActiveThread, user?.email, userProfile?.username) ? (
                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-mono font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Request Pending Host Approval</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={requestingThreadId === currentActiveThread.$id}
                    onClick={() => handleRequestJoinThread(currentActiveThread)}
                    className="px-6 py-2.5 rounded-full bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs tracking-wide transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Request to join circle</span>
                  </button>
                )}
              </div>
            </div>
          ) : loading && posts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className="rounded-2xl border border-black/[0.05] dark:border-white/[0.06] p-4 sm:p-5 space-y-3.5 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-28 h-3.5 bg-black/[0.08] dark:bg-white/[0.1] rounded-md" />
                      <div className="w-16 h-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="w-full h-3 bg-black/[0.06] dark:bg-white/[0.08] rounded-md" />
                    <div className="w-4/5 h-3 bg-black/[0.06] dark:bg-white/[0.08] rounded-md" />
                    <div className="w-3/5 h-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-md" />
                  </div>
                  <div className="pt-2 flex items-center gap-4">
                    <div className="w-12 h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                    <div className="w-12 h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                    <div className="w-12 h-6 rounded-full bg-black/[0.04] dark:bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-16 sm:py-20 px-4 text-center space-y-6 max-w-md mx-auto animate-in fade-in duration-300">
              {/* Instagram / Threads Style Circular Icon with Ambient Glow */}
              <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-gold/25 to-yellow-400/10 blur-xl pointer-events-none" />
                <div className="w-full h-full rounded-full border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-sm flex items-center justify-center text-slate-800 dark:text-white shadow-xs">
                  <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.6] text-gold" />
                </div>
              </div>

              {/* Natural Typography (No All-Caps Blocky Text) */}
              <div className="space-y-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : filterOnlySaved
                    ? 'No saved posts yet'
                    : filterOnlyWithFiles
                    ? 'No modules shared yet'
                    : selectedTag === 'All'
                    ? 'No discussions yet'
                    : `No posts in #${selectedTag}`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-white/50 leading-relaxed max-w-xs mx-auto">
                  {searchQuery
                    ? 'Try different keywords or clearing active filters.'
                    : filterOnlySaved
                    ? 'Save posts with the bookmark icon to review them here.'
                    : 'Be the first student to publish notes, ask a question, or spark a conversation.'}
                </p>
              </div>

              {/* Instagram-Style Minimalist Suggestion Chips */}
              {!searchQuery && !filterOnlySaved && (
                <div className="pt-1 space-y-2.5">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 uppercase tracking-wider block font-semibold">
                    Starter Topics
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStarter(
                          '📚 CC104: Algorithm Complexity & Tree Traversal Practice Reviewer\n\nSharing lecture notes and midterm problem sets for fellow BSIT 2nd years...',
                          'Feed'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] hover:bg-gold/15 text-slate-700 dark:text-white/70 hover:text-gold border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium transition-all cursor-pointer active:scale-95"
                    >
                      📚 CC104 Reviewer
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStarter(
                          '⚡ What are the best state management patterns for Next.js 15 App Router?\n\n```typescript\n// How are you structuring shared state across server and client components?\n```\n',
                          'Feed'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] hover:bg-gold/15 text-slate-700 dark:text-white/70 hover:text-gold border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium transition-all cursor-pointer active:scale-95"
                    >
                      ⚡ Next.js Architecture
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickStarter(
                          '🛠️ Looking for Capstone Project Teammates (IoT / Mobile / Web)\n\nSeeking collaborators proficient in Flutter or Next.js for our upcoming BSIT capstone...',
                          'Feed'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.05] hover:bg-gold/15 text-slate-700 dark:text-white/70 hover:text-gold border border-black/[0.06] dark:border-white/[0.08] text-xs font-medium transition-all cursor-pointer active:scale-95"
                    >
                      🛠️ Capstone Team
                    </button>
                  </div>
                </div>
              )}

              {/* Actions Row */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      setOnboardingInitialStep(1)
                      setIsOnboardingOpen(true)
                      return
                    }
                    setSelectedPostTag(selectedTag === 'All' ? 'general' : selectedTag)
                    setIsCreateOpen(true)
                  }}
                  className="px-6 py-2.5 rounded-full bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs tracking-wide transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Share your thoughts</span>
                </button>

                {(searchQuery || filterOnlyWithFiles || filterOnlyOfficers || filterOnlySaved || filterOnlyMyPosts) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setFilterOnlyWithFiles(false)
                      setFilterOnlyOfficers(false)
                      setFilterOnlySaved(false)
                      setFilterOnlyMyPosts(false)
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer underline-offset-4 hover:underline"
                  >
                    Clear active filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, idx) => {
                const isLiked = userLikedPosts.includes(post.$id)
                const isSaved = savedPostIds.includes(post.$id)
                const myHandle = normalizeCommunityHandle(userProfile?.username || user?.name || '')
                const postHandle = normalizeCommunityHandle(post.author_display_name || '')
                const isAuthor = Boolean(
                  (user?.email && post.author_student_no && post.author_student_no.toLowerCase() === user.email.toLowerCase()) ||
                  (myHandle && postHandle && myHandle === postHandle)
                )
                const isHighlighted = highlightedPostId === post.$id

                return (
                  <ScrollReveal key={post.$id} delay={(idx % 3) * 0.04}>
                    <article
                      id={`post-${post.$id}`}
                      onClick={(e) => {
                        const target = e.target as HTMLElement
                        if (target.closest('button, a, input, textarea, pre, code')) return
                        handleDoubleTapPost(post)
                      }}
                      className={`relative rounded-2xl border transition-all duration-300 p-3.5 sm:p-5 space-y-3 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl shadow-xs dark:shadow-none select-none sm:select-auto ${
                        isHighlighted
                          ? 'border-gold ring-2 ring-gold/60 shadow-xl shadow-gold/20 scale-[1.008]'
                          : 'border-black/[0.05] dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/[0.12]'
                      } ${
                        activeMenuPostId === post.$id ? 'z-40' : 'z-0'
                      }`}
                    >
                      {/* Instagram Double-Tap Heart Burst Animation */}
                      {heartBurstPostId === post.$id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                          <div className="animate-in zoom-in-50 fade-in duration-200">
                            <Heart className="w-20 h-20 fill-rose-500 text-rose-500 drop-shadow-2xl animate-out fade-out zoom-out-125 duration-300 delay-500" />
                          </div>
                        </div>
                      )}

                      {/* Threads/Instagram Compact Post Header */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Circular Avatar with Overlaid Verified Badge */}
                          <div className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9">
                            <Link
                              href={`/community/${(post.author_display_name || 'student').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '') || 'student'}`}
                              className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center text-left cursor-pointer transition-transform active:scale-95 ring-1 ring-black/5 dark:ring-white/10"
                              title={`View @${post.author_display_name} profile`}
                            >
                              {post.author_avatar && !post.author_avatar.startsWith('preset:') ? (
                                <Image
                                  src={post.author_avatar}
                                  alt={post.author_display_name}
                                  width={36}
                                  height={36}
                                  className="w-full h-full object-cover"
                                  unoptimized={Boolean(post.author_avatar.startsWith('data:') || post.author_avatar.includes('appwrite'))}
                                />
                              ) : (
                                renderAvatarIcon(post.author_avatar, post.author_display_name, 'w-4 h-4 text-gold')
                              )}
                            </Link>
                            {(post.is_officer || post.is_verified) && (
                              <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#0c1017] bg-white dark:bg-[#0c1017] flex items-center justify-center pointer-events-none shadow-xs">
                                <InstagramVerifiedBadge className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Author Name, Thread Pill, & Timestamp */}
                          <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                              <Link
                                href={`/community/${(post.author_display_name || 'student').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '') || 'student'}`}
                                className="font-semibold text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 truncate hover:underline cursor-pointer text-left"
                              >
                                {post.author_display_name.startsWith('@') ? post.author_display_name.slice(1) : post.author_display_name}
                              </Link>
                              {post.tags?.[0] && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (post.tags?.[0]) setSelectedTag(post.tags[0])
                                    }}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-medium transition-colors cursor-pointer"
                                  title={`Filter by #${post.tags[0]}`}
                                >
                                  <Hash className="w-2.5 h-2.5" />
                                  <span>{post.tags[0]}</span>
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 dark:text-white/40 font-mono pt-0.5">
                              <span title={new Date(post.$createdAt).toLocaleString()}>{formatRelativeTime(post.$createdAt)}</span>
                              {!isAuthor && !post.is_anonymous && postHandle && (isFollowsResolved || !authLoading) && (
                                <>
                                  <span className="text-slate-300 dark:text-white/20 select-none">·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFollowAuthor(postHandle, post.author_display_name, post.author_avatar)}
                                    className={`font-sans font-semibold transition-colors cursor-pointer text-[11px] ${
                                      myFollowingSet.has(postHandle)
                                        ? 'text-slate-400 hover:text-rose-500 dark:text-white/40 dark:hover:text-rose-400'
                                        : 'text-gold hover:text-amber-400 dark:text-gold dark:hover:text-amber-300'
                                    }`}
                                    title={myFollowingSet.has(postHandle) ? 'Click to unfollow' : undefined}
                                  >
                                    {myFollowingSet.has(postHandle)
                                      ? 'Following'
                                      : myFollowerSet.has(postHandle)
                                      ? 'Follow back'
                                      : 'Follow'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3-Dot Context Menu & Moderation */}
                        <div className="relative flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuPostId(activeMenuPostId === post.$id ? null : post.$id)
                              setConfirmDeletePostId(null)
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {activeMenuPostId === post.$id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                  setActiveMenuPostId(null)
                                  setConfirmDeletePostId(null)
                                }}
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#161b22] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                {isAuthor ? (
                                  <>
                                    {/* ─── Host POV: ONLY Edit Post & Delete Post ─── */}
                                    {/* 1. Edit Post */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuPostId(null)
                                        setConfirmDeletePostId(null)
                                        setEditingPost(post)
                                        setEditPostContent(post.content)
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer font-medium"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Edit post</span>
                                    </button>

                                    {/* 2. Delete Post */}
                                    {confirmDeletePostId === post.$id ? (
                                      <div className="flex items-center justify-between gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 mx-1.5 my-1 rounded-lg animate-in fade-in duration-150">
                                        <span className="text-red-500 text-[11px] font-medium">Confirm delete?</span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            disabled={isDeletingPostId === post.$id}
                                            onClick={() => handleDeletePost(post)}
                                            className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                          >
                                            {isDeletingPostId === post.$id ? '...' : 'Yes'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeletePostId(null)}
                                            className="px-1.5 py-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white text-[11px] transition-colors cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeletePostId(post.$id)}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors text-left cursor-pointer font-medium"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Delete post</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {/* ─── Someone Else's Post: Copy Link, Report Post, Hide Post ─── */}
                                    {/* 1. Copy Link */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuPostId(null)
                                        if (typeof window !== 'undefined') {
                                          const url = `${window.location.origin}/community?post=${post.$id}`
                                          navigator.clipboard.writeText(url)
                                          setToastMessage('Link copied to clipboard')
                                          setShareCopiedToast(true)
                                          setTimeout(() => setShareCopiedToast(false), 2500)
                                        }
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer font-medium"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Copy link</span>
                                    </button>

                                    {/* 2. Report Post */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuPostId(null)
                                        if (!user) {
                                          setOnboardingInitialStep(1)
                                          setIsOnboardingOpen(true)
                                          return
                                        }
                                        setToastMessage('Thank you for reporting. PSITS moderators have been alerted.')
                                        setShareCopiedToast(true)
                                        setTimeout(() => setShareCopiedToast(false), 3000)
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-left cursor-pointer font-medium"
                                    >
                                      <Flag className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Report post</span>
                                    </button>

                                    {/* 3. Hide Post */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuPostId(null)
                                        handleHidePost(post.$id)
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer font-medium"
                                    >
                                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Hide post</span>
                                    </button>

                                    {/* Admin Moderator Takedown */}
                                    {isAdmin && (
                                      <>
                                        <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.08]" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuPostId(null)
                                            setConfirmDeletePostId(null)
                                            setTakedownTarget(post)
                                          }}
                                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-500 hover:bg-amber-500/10 transition-colors text-left cursor-pointer font-medium"
                                        >
                                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                                          <span>Moderator takedown</span>
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="pt-0.5">
                        <PostMarkdownContent content={post.content} />
                      </div>

                      {/* Document & Image Attachments (Instagram Style Showcase) */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {post.attachments.map((fileId, i) => {
                            const name = post.attachment_names?.[i] || 'Document Attachment'
                            const size = post.attachment_sizes?.[i] || ''
                            const isPdf = name.toLowerCase().endsWith('.pdf')
                            const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
                            const isCode = /\.(zip|rar|tar|gz|json|js|ts|py|cpp|java|sql)$/i.test(name)
                            const fileUrl = appwriteStorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId)

                            if (isImg) {
                              return (
                                <div key={fileId} className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-[500px] bg-black/5 dark:bg-black/40">
                                  <Image
                                    src={fileUrl}
                                    alt={name}
                                    width={800}
                                    height={600}
                                    className="w-full h-auto max-h-[500px] object-cover"
                                    unoptimized
                                  />
                                </div>
                              )
                            }

                            return (
                              <div
                                key={fileId}
                                className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] hover:border-gold/40 transition-colors group"
                              >
                                <div className="flex items-center gap-3 overflow-hidden pr-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    isPdf
                                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-500'
                                      : 'bg-gold/15 border-gold/30 text-gold'
                                  }`}>
                                    {isPdf ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                                  </div>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                      {name}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 dark:text-white/40 flex items-center gap-2 pt-0.5">
                                      <span>{isPdf ? 'PDF Module' : isCode ? 'Code Archive' : 'File'}</span>
                                      {size && <span>• {size}</span>}
                                    </div>
                                  </div>
                                </div>

                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 rounded-lg bg-surface hover:bg-gold hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-black/[0.08] dark:border-white/[0.1] font-bold text-[11px] font-mono transition-colors shrink-0 shadow-sm"
                                >
                                  Download
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Threads Clean Action Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
                        <div className="flex items-center gap-4 sm:gap-6 text-slate-600 dark:text-slate-300">
                          {/* Heart / Like Button */}
                          <button
                            type="button"
                            onClick={() => handleReaction(post)}
                            className="group flex items-center gap-1.5 transition-colors cursor-pointer select-none active:scale-90 p-1 -m-1"
                            title="Like"
                          >
                            <Heart
                              className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 ${
                                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500 dark:text-white/60 hover:text-rose-500'
                              }`}
                            />
                            <span className={`text-xs font-mono font-semibold ${isLiked ? 'text-rose-500' : 'text-slate-500 dark:text-white/50 group-hover:text-rose-500'}`}>
                              <NumberTicker value={post.likes_count} duration={0.3} />
                            </span>
                          </button>

                          {/* Comment / Reply Button */}
                          <button
                            type="button"
                            onClick={() => openComments(post)}
                            className="group flex items-center gap-1.5 transition-colors cursor-pointer select-none active:scale-90 p-1 -m-1"
                            title="Comments"
                          >
                            <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 dark:text-white/60 group-hover:text-sky-400 transition-transform duration-200 group-hover:scale-110" />
                            <span className="text-xs font-mono font-semibold text-slate-500 dark:text-white/50 group-hover:text-sky-400">
                              <NumberTicker value={post.comments_count} duration={0.3} />
                            </span>
                          </button>

                          {/* Share / Direct Button */}
                          <button
                            type="button"
                            onClick={() => handleSharePost(post)}
                            className="group flex items-center gap-1.5 transition-colors cursor-pointer select-none active:scale-90 p-1 -m-1"
                            title="Share post"
                          >
                            <Share2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 dark:text-white/60 group-hover:text-gold transition-transform duration-200 group-hover:scale-110" />
                          </button>
                        </div>

                        {/* Bookmark / Save Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSavePost(post.$id)}
                          className="group flex items-center transition-colors cursor-pointer select-none active:scale-90 p-1 -m-1"
                          title={isSaved ? 'Remove from saved' : 'Save post'}
                        >
                          <Bookmark
                            className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110 ${
                              isSaved ? 'fill-gold text-gold' : 'text-slate-500 dark:text-white/60 hover:text-gold'
                            }`}
                          />
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
          {/* Channels & Threads Card */}
          <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-surface p-5 space-y-4 shadow-sm dark:shadow-none">
            {/* ─── Existing Threads & Channels Tile List ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-white/80 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-gold" />
                  <span>Channels &amp; Threads</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {customThreads.length} active
                </span>
              </div>

              {customThreads.length === 0 ? (
                <div className="p-3 rounded-xl bg-surface-subtle border border-dashed border-black/[0.06] dark:border-white/[0.06] text-center">
                  <p className="text-[11px] text-slate-400">No custom threads yet. Be the first to start one!</p>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5 scrollbar-thin">
                  {customThreads.map(ct => {
                    const isHost = isHostOfThread(ct, user?.email, userProfile?.username)
                    const isMember = isMemberOfThread(ct, user?.email, userProfile?.username)
                    const isPending = isPendingJoinRequest(ct, user?.email, userProfile?.username)
                    const memberCount = getThreadMemberCount(ct)
                    const isSelected = selectedTag === ct.title || selectedTag === ct.slug
                    const isActionBusy = requestingThreadId === ct.$id

                    return (
                      <div
                        key={ct.$id}
                        className={`group p-2.5 rounded-xl border transition-all text-xs space-y-1.5 ${
                          isSelected
                            ? 'bg-gold/10 border-gold/40 shadow-xs'
                            : 'bg-surface-subtle hover:bg-black/[0.02] dark:hover:bg-white/[0.03] border-black/[0.06] dark:border-white/[0.06]'
                        }`}
                      >
                        {/* Tile Header: Title + Privacy Badge + Status/Action */}
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isMember || !ct.is_private) {
                                setSelectedTag(ct.title)
                              } else if (!isPending) {
                                handleRequestJoinThread(ct)
                              }
                            }}
                            className="font-bold text-slate-900 dark:text-white hover:text-gold transition-colors truncate max-w-[140px] flex items-center gap-1 cursor-pointer text-left"
                            title={ct.title}
                          >
                            {ct.is_private ? (
                              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                            ) : (
                              <Hash className="w-3 h-3 text-gold shrink-0" />
                            )}
                            <span className="truncate">#{ct.title}</span>
                          </button>

                          {/* Member Status / Action Button */}
                          <div className="shrink-0 flex items-center">
                            {isHost ? (
                              confirmDeleteThreadId === ct.$id ? (
                                <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-md animate-in fade-in">
                                  <span className="text-[9px] text-red-500 font-bold">Delete?</span>
                                  <button
                                    type="button"
                                    disabled={deletingThreadId === ct.$id}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteThread(ct)
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold hover:bg-red-600 disabled:opacity-50 cursor-pointer"
                                  >
                                    {deletingThreadId === ct.$id ? '...' : 'Yes'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDeleteThreadId(null)
                                    }}
                                    className="text-[9px] text-slate-400 hover:text-slate-600 dark:hover:text-white px-0.5 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gold/15 text-gold border border-gold/30">
                                    Host
                                  </span>
                                  <button
                                    type="button"
                                    title="Delete thread"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setConfirmDeleteThreadId(ct.$id)
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )
                            ) : isMember ? (
                              <button
                                type="button"
                                onClick={() => setSelectedTag(ct.title)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/25 transition-colors"
                              >
                                <Check className="w-2.5 h-2.5" />
                                <span>Joined</span>
                              </button>
                            ) : isPending ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 animate-spin" />
                                <span>Requested</span>
                              </span>
                            ) : ct.is_private ? (
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={() => handleRequestJoinThread(ct)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gold hover:bg-gold-muted text-slate-950 transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
                              >
                                <UserPlus className="w-2.5 h-2.5" />
                                <span>Request to Join</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isActionBusy}
                                onClick={() => handleJoinPublicThread(ct)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-surface hover:bg-gold/20 text-slate-700 dark:text-white border border-black/[0.08] dark:border-white/[0.08] transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Join
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tile Description */}
                        {ct.description && (
                          <p className="text-[11px] text-slate-500 dark:text-white/60 line-clamp-2 leading-relaxed">
                            {ct.description}
                          </p>
                        )}

                        {/* Tile Footer: Joined Count + Creator */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5 border-t border-black/[0.03] dark:border-white/[0.03]">
                          <span className="flex items-center gap-1 text-slate-600 dark:text-white/70 font-semibold">
                            <Users className="w-3 h-3 text-gold" />
                            <span>{memberCount} joined</span>
                          </span>
                          <span className="truncate max-w-[110px] text-slate-400">
                            by {ct.creator_display_name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenCreateThread}
              className="w-full py-2.5 rounded-xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start Discussion</span>
            </button>

          </div>

          {/* ─── Realtime Active Status (Minimalist Card) ─── */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-surface p-3.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Active Now</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                {displayOnlineMembers.length}
              </span>
            </div>
            <div className="flex items-center -space-x-1.5 overflow-hidden shrink-0">
              {displayOnlineMembers.slice(0, 5).map((member) => {
                const cleanH = member.handle.replace(/^@/, '')
                return (
                  <Link
                    key={member.key}
                    href={member.isGuest ? '#' : `/community/${cleanH}`}
                    title={`${member.name} (@${cleanH}) · Active now`}
                    className="relative w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#0c1017] overflow-hidden bg-slate-900 hover:scale-110 transition-transform cursor-pointer shrink-0"
                  >
                    {member.avatar && !member.avatar.startsWith('preset:') ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={24}
                        height={24}
                        className="w-full h-full object-cover"
                        unoptimized={Boolean(member.avatar.startsWith('data:') || member.avatar.includes('appwrite'))}
                      />
                    ) : (
                      renderAvatarIcon(member.avatar, member.name, 'w-3 h-3 text-gold')
                    )}
                  </Link>
                )
              })}
              {displayOnlineMembers.length > 5 && (
                <span className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 ring-2 ring-white dark:ring-[#0c1017] flex items-center justify-center text-[9px] font-mono font-bold text-slate-500 dark:text-white/60">
                  +{displayOnlineMembers.length - 5}
                </span>
              )}
            </div>
          </div>

          {/* Host Thread Join Requests (Only displayed if there are active pending requests) */}
          {user && hostedThreadRequests.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 shadow-sm text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/15">
                <div className="flex items-center gap-2 font-display font-bold text-xs uppercase tracking-wider text-amber-500">
                  <UserPlus className="w-4 h-4" />
                  <span>Circle Requests</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500">
                  {hostedThreadRequests.length}
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 scrollbar-thin">
                {hostedThreadRequests.map(item => {
                  const isProcessing = processingRequestId === `${item.thread.$id}-${item.requesterStr}`
                  return (
                    <div
                      key={`join-req-${item.thread.$id}-${item.requesterStr}`}
                      className="p-2.5 rounded-xl bg-surface border border-black/[0.06] dark:border-white/[0.08] text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white min-w-0">
                          <UserPlus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">
                            <span className="text-gold font-bold">{item.displayHandle}</span> wants to join{' '}
                            <span className="font-mono text-amber-500">#{item.thread.title}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRespondToJoinRequest(item.thread.$id, item.requesterStr, 'approve')}
                          className="flex-1 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRespondToJoinRequest(item.thread.$id, item.requesterStr, 'decline')}
                          className="flex-1 py-1 rounded-lg bg-surface hover:bg-rose-500/20 text-slate-700 dark:text-white/80 hover:text-rose-400 border border-black/[0.08] dark:border-white/[0.08] font-bold text-[10px] tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
      </PullToRefresh>
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
        initialAuthMode={onboardingAuthMode}
      />

      {/* ─── Premium Realtime Notification Center Modal & In-App Toast ─── */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        unreadCount={unreadNotifCount}
        onMarkAsRead={handleMarkNotifAsRead}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
        onOpenPost={handleOpenNotificationPost}
      />

      {/* ─── Realtime In-App Notification Toast (Facebook/IG Style) ─── */}
      <AnimatePresence>
        {liveToastNotif && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (liveToastNotif.post_id) {
                handleOpenNotificationPost(liveToastNotif.post_id)
              }
              setLiveToastNotif(null)
            }}
            className="fixed top-18 left-1/2 -translate-x-1/2 z-[140] w-[90%] max-w-sm rounded-2xl bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-xl border border-gold/40 shadow-2xl p-3 flex items-center gap-3 cursor-pointer ring-1 ring-gold/20"
          >
            <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0 overflow-hidden text-gold font-bold text-xs">
              {liveToastNotif.actor_avatar && !liveToastNotif.actor_avatar.startsWith('preset:') ? (
                <Image src={liveToastNotif.actor_avatar} alt="Actor" width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <span>{liveToastNotif.actor_name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
                <span className="font-bold text-slate-900 dark:text-white">{liveToastNotif.actor_name}</span>{' '}
                <span className="text-slate-600 dark:text-slate-300">{liveToastNotif.summary}</span>
              </div>
              <div className="text-[10px] text-gold font-mono font-semibold">Tap to view live discussion</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>





      {/* ─── Create Post Modal (Minimalist Command / Spotlight Palette) ─── */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateOpen(false)
          }}
        >
          <div
            className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-[24px] sm:rounded-[28px] bg-white dark:bg-[#0c1017] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                if (postContent.trim()) handleCreatePost()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setIsCreateOpen(false)
              }
            }}
          >
            {/* Drag & Drop Visual Overlay */}
            {isDraggingFile && (
              <div className="absolute inset-0 z-30 m-2 rounded-[22px] bg-gold/15 dark:bg-gold/20 border-2 border-dashed border-gold flex flex-col items-center justify-center gap-2 backdrop-blur-xs pointer-events-none animate-in fade-in duration-100">
                <div className="p-3.5 rounded-full bg-gold/25 text-gold animate-bounce">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Drop file or image here
                </p>
                <p className="text-xs text-slate-600 dark:text-white/70">
                  Compressed WebP, PDF, ZIP, code & documents up to 15MB
                </p>
              </div>
            )}

            {/* Instagram-Style Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Create Post
              </div>
              <button
                type="button"
                disabled={!postContent.trim()}
                onClick={handleCreatePost}
                className="px-3.5 py-1.5 rounded-full bg-gold hover:bg-gold-muted disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
              >
                <span>Post</span>
              </button>
            </div>

            {/* Author / Identity Strip */}
            <div className="flex items-center gap-3 px-4 sm:px-5 pt-3.5 pb-2 shrink-0">
              <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0 text-amber-500 overflow-hidden text-xs ring-1 ring-black/5 dark:ring-white/10">
                {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                  <Image
                    src={userProfile.avatar}
                    alt="Student"
                    width={36}
                    height={36}
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name, 'w-4 h-4 text-gold')
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {userProfile?.username
                    ? (userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`)
                    : `@${(userProfile?.name || user?.name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-white/40">
                  Posting to Kasubay Community
                </span>
              </div>
            </div>

            {/* Thread Selector */}
            <div className="px-4 sm:px-5 py-1 shrink-0">
              <div className="text-[11px] font-medium text-slate-500 dark:text-white/40 mb-1 flex items-center justify-between">
                <span>Post into Thread</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false)
                    handleOpenCreateThread()
                  }}
                  className="text-[10px] text-amber-600 dark:text-gold font-mono hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create new thread</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {!customThreads.some(ct => ct.title.toLowerCase() === 'general') && (
                  <button
                    type="button"
                    onClick={() => setSelectedPostTag('general')}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                      selectedPostTag.toLowerCase() === 'general'
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/50 font-semibold shadow-xs'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-slate-600 dark:text-white/60 border border-black/[0.06] dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Hash className="w-2.5 h-2.5 text-slate-400" />
                    <span>general</span>
                  </button>
                )}
                {customThreads.map(ct => (
                  <button
                    key={ct.$id}
                    type="button"
                    onClick={() => setSelectedPostTag(ct.title)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                      selectedPostTag === ct.title
                        ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/50 font-semibold shadow-xs'
                        : 'bg-black/[0.03] dark:bg-white/[0.04] text-slate-600 dark:text-white/60 border border-black/[0.06] dark:border-white/[0.06] hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {ct.is_private ? <Lock className="w-2.5 h-2.5 text-amber-500" /> : <Hash className="w-2.5 h-2.5 text-slate-400" />}
                    <span>{ct.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Canvas & Visual Attachments */}
            <div className="flex-1 flex flex-col px-4 sm:px-5 py-2 overflow-y-auto scrollbar-thin space-y-3">
              <textarea
                ref={postTextareaRef}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
                onPaste={handlePaste}
                autoFocus
                placeholder="What's on your mind? Share thoughts, paste code/images, or ask a question..."
                className="w-full min-h-[120px] bg-transparent text-sm text-slate-900 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none resize-none leading-relaxed font-sans"
              />

              {/* Upload Error Alert */}
              {uploadError && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="p-1 hover:bg-rose-500/20 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Active Uploading Indicator Card */}
              {isUploadingFile && uploadingFileName && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gold/10 border border-gold/30 text-xs text-gold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold">Uploading & optimizing:</span>{' '}
                    <span className="font-mono truncate">{uploadingFileName}</span>
                  </div>
                </div>
              )}

              {/* Visual Image Preview Grid */}
              {attachments.some(a => a.type === 'image') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {attachments
                    .filter(a => a.type === 'image')
                    .map((file) => (
                      <div
                        key={file.id}
                        className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 group bg-slate-950/5 dark:bg-white/[0.03] aspect-[4/3] max-h-56 shadow-sm"
                      >
                        {file.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
                            <ImageIcon className="w-8 h-8 text-gold" />
                            <span className="text-xs font-mono">{file.name}</span>
                          </div>
                        )}
                        {/* Floating Delete Button */}
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter(a => a.id !== file.id))}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md transition-colors shadow-md cursor-pointer"
                          title="Remove photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {/* Floating File Info Pill */}
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90 flex items-center gap-1.5 max-w-[85%] truncate">
                          <ImageIcon className="w-3 h-3 text-gold shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="opacity-70 shrink-0">({file.size})</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Attached Non-Image Documents & Code Files */}
              {attachments.some(a => a.type !== 'image') && (
                <div className="space-y-1.5 pt-1">
                  {attachments
                    .filter(a => a.type !== 'image')
                    .map((file) => {
                      const badge = getAttachmentBadge(file.name)
                      const IconComp = badge.icon
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] text-xs border border-black/[0.06] dark:border-white/[0.06]"
                        >
                          <div className="flex items-center gap-2 truncate max-w-[340px]">
                            <div className={`p-1 rounded-lg border flex items-center justify-center shrink-0 ${badge.colorClass}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate text-slate-800 dark:text-white/80 font-mono text-xs font-medium">{file.name}</span>
                            <span className="text-slate-400 dark:text-white/30 text-[10px] font-mono shrink-0">({file.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter(a => a.id !== file.id))}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.zip,.rar,.ts,.tsx,.js,.jsx,.py,.cpp,.java,.sql,.json,.txt,.png,.jpg,.jpeg,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Expandable Emoji Picker Tray */}
            {isEmojiPickerOpen && (
              <div className="px-4 sm:px-5 py-2.5 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] animate-in fade-in duration-150 shrink-0">
                <div className="flex items-center justify-between pb-1.5 text-[11px] font-medium text-slate-500 dark:text-white/50">
                  <span>Pick an emoji</span>
                  <button
                    type="button"
                    onClick={() => setIsEmojiPickerOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-thin">
                  {[
                    '😊', '😂', '🔥', '❤️', '👍', '🚀', '💡', '👏', '🎉', '💯',
                    '✨', '🙌', '👀', '😎', '💀', '🙏', '💻', '🎓', '⚡', '🤩',
                    '😍', '🥳', '🤔', '💪', '🤝', '☕', '📚', '🎯', '🏆', '🌟'
                  ].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertPostEmoji(emoji)}
                      className="text-base p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform cursor-pointer select-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Instagram/Threads-Style Bottom Media Bar */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  disabled={isUploadingFile}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'image/*'
                      fileInputRef.current.click()
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-xs font-medium disabled:opacity-50"
                  title="Attach Photo"
                >
                  <ImageIcon className="w-4 h-4 text-gold" />
                  <span className="hidden sm:inline">Photo</span>
                </button>

                <button
                  type="button"
                  disabled={isUploadingFile}
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = '.pdf,.docx,.pptx,.xlsx,.zip,.rar,.ts,.tsx,.js,.jsx,.py,.cpp,.java,.sql,.json,.txt'
                      fileInputRef.current.click()
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-xs font-medium disabled:opacity-50"
                  title="Attach File or Code Document"
                >
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors cursor-pointer text-xs font-medium"
                  title="Insert Formatted Code Snippet"
                >
                  <Code2 className="w-4 h-4 text-violet-400" />
                  <span className="hidden sm:inline">Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
                    isEmojiPickerOpen
                      ? 'bg-gold/15 text-gold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-white/60 dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.04]'
                  }`}
                  title="Insert Emoji"
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Emoji</span>
                </button>

                <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1" />

                <button
                  type="button"
                  onClick={handleInsertBold}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                  title="Bold (wrap selection or insert)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleInsertBulletList}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-gold hover:bg-black/5 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
                  title="Bullet List (wrap selection or insert)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-white/30 bg-black/[0.03] dark:bg-white/[0.03] rounded">
                  ⌘ + ↵
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modern Code Snippet Composer Modal ─── */}
      {isCodeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCodeModalOpen(false)
          }}
        >
          <div
            className="w-full max-w-lg rounded-[24px] bg-white dark:bg-[#0f141c] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] animate-in zoom-in-95 duration-150"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleInsertCodeSnippet()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setIsCodeModalOpen(false)
              }
            }}
          >
            {/* Code Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Add Code Snippet
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-white/40">
                    Syntax highlighted with 1-tap copy in the feed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Selector & Optional File Title */}
            <div className="p-3.5 sm:p-4 space-y-3 bg-black/[0.01] dark:bg-white/[0.01] border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40">
                    Select Language
                  </label>
                  <span className="text-[10px] font-mono text-gold sm:hidden">
                    {CODE_LANGUAGES.find(l => l.id === codeLanguage)?.label || 'TypeScript'}
                  </span>
                </div>

                {/* Mobile: Native Dropdown with Quick Common Badges (sm:hidden) */}
                <div className="sm:hidden flex flex-col gap-2">
                  <div className="relative">
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="w-full appearance-none px-3 py-2 pr-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-gold/50 cursor-pointer"
                    >
                      {CODE_LANGUAGES.map(lang => (
                        <option key={lang.id} value={lang.id} className="bg-white dark:bg-[#0f141c] text-slate-900 dark:text-white">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {/* Quick-tap common badges for phone screens */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-white/30 shrink-0 mr-1">Quick:</span>
                    {[
                      { id: 'typescript', label: 'TS' },
                      { id: 'javascript', label: 'JS' },
                      { id: 'python', label: 'Python' },
                      { id: 'cpp', label: 'C++' },
                      { id: 'java', label: 'Java' },
                      { id: 'sql', label: 'SQL' },
                    ].map(quick => (
                      <button
                        key={quick.id}
                        type="button"
                        onClick={() => setCodeLanguage(quick.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all shrink-0 cursor-pointer ${
                          codeLanguage === quick.id
                            ? 'bg-gold text-slate-950 font-bold shadow-xs'
                            : 'bg-black/[0.04] dark:bg-white/[0.05] text-slate-600 dark:text-white/70'
                        }`}
                      >
                        {quick.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Desktop & Tablet: Responsive Wrapping Chip Grid (hidden sm:flex) */}
                <div className="hidden sm:flex flex-wrap items-center gap-1.5">
                  {CODE_LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setCodeLanguage(lang.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        codeLanguage === lang.id
                          ? 'bg-gold text-slate-950 font-bold shadow-xs ring-1 ring-gold/40'
                          : 'bg-black/[0.04] dark:bg-white/[0.05] text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.08] dark:hover:bg-white/[0.08]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40 block mb-1">
                  File or Snippet Title (Optional)
                </label>
                <input
                  type="text"
                  value={codeTitle}
                  onChange={(e) => setCodeTitle(e.target.value)}
                  placeholder="e.g. auth-middleware.ts or queries.sql"
                  className="w-full px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>
            </div>

            {/* Monospace Code Editor */}
            <div className="flex-1 p-3.5 sm:p-4 flex flex-col min-h-[180px] bg-[#090d14] overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-white/40 pb-1.5 shrink-0">
                <span>Tab to indent 2 spaces</span>
                <span>{codeSnippet.split('\n').length} line{codeSnippet.split('\n').length === 1 ? '' : 's'}</span>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                placeholder="// Paste or type code snippet here..."
                autoFocus
                rows={9}
                className="w-full flex-1 p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-emerald-400 dark:text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-gold/40 resize-none leading-relaxed scrollbar-thin"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] shrink-0">
              <span className="text-[11px] text-slate-400 dark:text-white/40 hidden sm:inline">
                Inserts as formatted Markdown code block
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsCodeModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!codeSnippet.trim()}
                  onClick={handleInsertCodeSnippet}
                  className="px-4 py-1.5 rounded-xl bg-gold hover:bg-gold-muted disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Insert into Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dedicated "Start Discussion Thread" Modal ─── */}
      {/* ─── Dedicated Instagram / Threads Style "New Thread" Modal ─── */}
      {isCreateThreadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-lg flex flex-col rounded-[26px] sm:rounded-[30px] bg-white dark:bg-[#0c1017] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar (Instagram Style: Cancel on Left, Title Centered, Create Pill on Right) */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateThreadOpen(false)}
                className="text-xs sm:text-sm font-normal text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                New Thread
              </h3>
              <button
                type="button"
                disabled={isSubmittingThread || !threadTitle.trim() || Boolean(threadQuota && !threadQuota.canCreate)}
                onClick={handleCreateThread}
                className="px-4 py-1.5 rounded-full bg-gold hover:bg-gold-muted disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSubmittingThread && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>{isSubmittingThread ? 'Creating...' : 'Create'}</span>
              </button>
            </div>

            {/* Quota Limit Notice Strip (Only if limit reached) */}
            {threadQuota && !threadQuota.canCreate && (
              <div className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>You have reached your 1-thread quota limit. Verified students get unlimited threads.</span>
              </div>
            )}

            {/* Modal Body: Threads Unboxed Composer */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh] scrollbar-thin">
              {/* Author Identity Strip & Privacy Pill */}
              <div className="flex items-center justify-between gap-3 pb-1 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center shrink-0 text-amber-500 overflow-hidden text-xs ring-1 ring-black/5 dark:ring-white/10">
                    {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                      <Image
                        src={userProfile.avatar}
                        alt="Student"
                        width={40}
                        height={40}
                        className="rounded-full object-cover w-full h-full"
                      />
                    ) : (
                      renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name, 'w-5 h-5 text-gold')
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {userProfile?.username
                          ? (userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`)
                          : `@${(userProfile?.name || user?.name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`}
                      </span>
                      {(isAdmin || userProfile?.tosAccepted) && (
                        <InstagramVerifiedBadge className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-white/40">
                      {threadQuota?.isVerified ? (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3" />
                          Verified • Unlimited threads
                        </span>
                      ) : (
                        <span>Standard • 1 thread quota</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Privacy Segmented Selector (IG Pill) */}
                <div className="flex items-center p-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] shrink-0 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setThreadIsPrivate(false)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                      !threadIsPrivate
                        ? 'bg-white dark:bg-[#1a2130] text-slate-950 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThreadIsPrivate(true)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                      threadIsPrivate
                        ? 'bg-white dark:bg-[#1a2130] text-amber-600 dark:text-amber-300 shadow-xs font-semibold'
                        : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>Private</span>
                  </button>
                </div>
              </div>

              {/* Thread Title Field (Clean Unboxed IG Typography) */}
              <div className="pt-1 space-y-1">
                <div className="relative flex items-center">
                  <span className="text-lg sm:text-xl font-bold text-gold font-mono mr-1.5 select-none">
                    #
                  </span>
                  <input
                    type="text"
                    value={threadTitle}
                    onChange={e => setThreadTitle(e.target.value.replace(/[^a-zA-Z0-9\-_ ]/g, ''))}
                    placeholder="thread-name"
                    maxLength={60}
                    autoFocus
                    className="w-full bg-transparent text-lg sm:text-xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-white/40 pl-4 font-mono">
                  Students will find and join your channel as #{threadTitle.trim() || 'thread-name'}
                </p>
              </div>

              {/* Thread Description Field (Clean Unboxed IG Typography) */}
              <div className="pt-2">
                <textarea
                  value={threadDescription}
                  onChange={e => setThreadDescription(e.target.value)}
                  placeholder="What is this thread about? Add context, goals, or discussion focus..."
                  rows={3}
                  maxLength={500}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white/80 placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none resize-none leading-relaxed font-sans"
                />
              </div>

              {/* Private Channel: Invited Members Field (Subtle IG Mention Bar) */}
              {threadIsPrivate && (
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-white/80 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gold" />
                      <span>Invite Members</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">Comma-separated</span>
                  </div>
                  <input
                    type="text"
                    value={threadAllowedUsersInput}
                    onChange={e => setThreadAllowedUsersInput(e.target.value)}
                    placeholder="@maria, @john, student_id"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] focus:border-gold rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-white/40 leading-tight">
                    Only students listed above can view and contribute to this private thread.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Minimalist Instagram-Style Comments Modal / Mobile Bottom Sheet ─── */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-t-[32px] sm:rounded-[28px] bg-white dark:bg-[#0c1017] border-t sm:border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle Indicator */}
            <div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            {/* Minimalist Top Header (Instagram Style: Centered "Comments", subtle X) */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0 bg-white dark:bg-[#0c1017]">
              <div className="w-7" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                Comments
              </h3>
              <button
                onClick={() => setActiveCommentPost(null)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Single Fluid Instagram Scroll Area (Original Post flows directly into Comments) */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scrollbar-thin">
              {/* Original Post (Instagram OP Header Row) */}
              <div className="flex items-start gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                <Link
                  href={activeCommentPost.is_anonymous ? '#' : `/community/${activeCommentPost.author_display_name.replace(/^@/, '')}`}
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center ring-1 ring-black/10 dark:ring-white/10 mt-0.5"
                >
                  {activeCommentPost.author_avatar && !activeCommentPost.author_avatar.startsWith('preset:') ? (
                    <Image
                      src={activeCommentPost.author_avatar}
                      alt={activeCommentPost.author_display_name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                      unoptimized={Boolean(activeCommentPost.author_avatar.startsWith('data:') || activeCommentPost.author_avatar.includes('appwrite'))}
                    />
                  ) : (
                    renderAvatarIcon(activeCommentPost.author_avatar, activeCommentPost.author_display_name, 'w-4 h-4 text-gold')
                  )}
                </Link>

                <div className="flex-1 min-w-0 text-xs sm:text-[13px] leading-relaxed">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={activeCommentPost.is_anonymous ? '#' : `/community/${activeCommentPost.author_display_name.replace(/^@/, '')}`}
                        className="font-bold text-xs sm:text-[13px] text-slate-900 dark:text-white hover:underline"
                      >
                        {activeCommentPost.author_display_name}
                      </Link>
                      {(activeCommentPost.is_officer || activeCommentPost.is_verified) && (
                        <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block" />
                      )}
                    </div>

                    <div className="text-[14px] sm:text-[15px] text-slate-900 dark:text-slate-100 leading-relaxed font-sans break-words pt-0.5">
                      <PostMarkdownContent content={activeCommentPost.content} />
                    </div>
                  </div>

                  {/* Attachments / Media (if present) */}
                  {activeCommentPost.attachments && activeCommentPost.attachments.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {activeCommentPost.attachments.map((fileId, i) => {
                        const name = activeCommentPost.attachment_names?.[i] || 'Attachment'
                        const isPdf = name.toLowerCase().endsWith('.pdf')
                        const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
                        const fileUrl = appwriteStorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId)

                        if (isImg) {
                          return (
                            <div key={fileId} className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 max-h-56 bg-black/5 dark:bg-black/30">
                              <Image
                                src={fileUrl}
                                alt={name}
                                width={800}
                                height={450}
                                className="w-full h-auto max-h-56 object-cover"
                                unoptimized
                              />
                            </div>
                          )
                        }

                        return (
                          <div
                            key={fileId}
                            className="flex items-center justify-between p-2 rounded-xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] text-xs"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              {isPdf ? <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <FileCode className="w-3.5 h-3.5 text-gold shrink-0" />}
                              <span className="truncate text-slate-900 dark:text-white font-medium">{name}</span>
                            </div>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded-md bg-surface text-slate-700 dark:text-slate-300 hover:text-gold text-[10px] font-mono font-bold transition-colors shrink-0 border border-black/[0.06] dark:border-white/[0.08]"
                            >
                              Download
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Clean Instagram Meta (time • likes count) */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 dark:text-white/40">
                    <span>{formatRelativeTime(activeCommentPost.$createdAt)}</span>
                    {activeCommentPost.likes_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{activeCommentPost.likes_count} {activeCommentPost.likes_count === 1 ? 'like' : 'likes'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments Flow Area */}
              {commentsLoading ? (
                <CommentsListSkeleton />
              ) : comments.length === 0 ? (
                <div className="text-center py-12 space-y-1">
                  <div className="font-semibold text-xs text-slate-700 dark:text-white/80">No comments yet.</div>
                  <div className="text-[11px] text-slate-400">Start the conversation below.</div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {topLevelComments.map(c => {
                    const replies = replyMap[c.$id] || []
                    const isExpanded = !collapsedReplyIds.has(c.$id)
                    return (
                      <div key={c.$id} className="space-y-2">
                        {renderCommentItem(c, false)}
                        {replies.length > 0 && (
                          <div className="pl-9 sm:pl-11 space-y-2">
                            <button
                              type="button"
                              onClick={() => toggleExpandReplies(c.$id)}
                              className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group select-none py-0.5"
                            >
                              <span className="w-6 h-[1px] bg-slate-300 dark:bg-white/20 group-hover:bg-gold transition-colors" />
                              <span>
                                {isExpanded
                                  ? 'Hide replies'
                                  : `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                              </span>
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                              <div className="pl-3 sm:pl-4 border-l border-black/[0.08] dark:border-white/[0.08] space-y-2.5 pt-0.5 animate-in fade-in duration-150">
                                {replies.map(reply => renderCommentItem(reply, true))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {orphanReplies.map(c => (
                    <div key={c.$id} className="space-y-2">
                      {renderCommentItem(c, true)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Minimalist Comment Input Bar */}
            <div className="px-4 sm:px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#0c1017] shrink-0 relative">
              {/* Mutual Mention Autocomplete Popover */}
              {mentionQuery !== null && (
                <div className="absolute bottom-full mb-2 left-4 right-4 sm:left-5 sm:right-5 rounded-2xl bg-white/95 dark:bg-[#12161f]/95 border border-black/[0.08] dark:border-white/[0.1] shadow-2xl backdrop-blur-md p-2 z-30 space-y-1 max-h-48 overflow-y-auto scrollbar-thin animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/40 font-semibold border-b border-black/[0.04] dark:border-white/[0.04] pb-1.5">
                    <span className="flex items-center gap-1.5 text-gold font-bold">
                      <Users className="w-3 h-3" />
                      <span>Mutual Followers</span>
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">Follow each other</span>
                  </div>
                  {filteredMutuals.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 dark:text-white/40">
                      {myMutuals.length === 0
                        ? 'No mutual followers yet. You can only mention students who follow you back.'
                        : 'No matching mutual followers'}
                    </div>
                  ) : (
                    filteredMutuals.map(m => (
                      <button
                        key={m.handle}
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault()
                          handleSelectMention(m)
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/10">
                          {m.avatar ? (
                            <Image src={m.avatar} alt={m.name} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            renderAvatarIcon(m.avatar, m.name, 'w-3.5 h-3.5 text-gold')
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            @{m.handle}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {m.name}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Mention Validation Error Banner */}
              {mentionError && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-600 dark:text-rose-400 mb-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{mentionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMentionError(null)}
                    className="p-0.5 rounded-full hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {replyingToComment && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04] text-[11px] text-slate-500 dark:text-white/60 mb-2 animate-in fade-in duration-100">
                  <div className="flex items-center gap-1.5 truncate">
                    <CornerDownLeft className="w-3 h-3 text-gold shrink-0" />
                    <span className="truncate">
                      Replying to <span className="font-semibold text-slate-900 dark:text-white">@{replyingToComment.author}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelReply}
                    className="p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Cancel reply"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick Emoji Bar for Comments */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-gold shrink-0" />
                </span>
                {['😊', '😂', '🔥', '❤️', '👍', '🚀', '💡', '👏', '🎉', '💯', '✨', '🙌', '👀', '😎', '💀', '🙏'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleInsertCommentEmoji(emoji)}
                    className="text-sm px-1.5 py-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform cursor-pointer select-none shrink-0"
                    title={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center ring-1 ring-black/10 dark:ring-white/10">
                  {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                    <Image
                      src={userProfile.avatar}
                      alt="User"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized={Boolean(userProfile.avatar.startsWith('data:') || userProfile.avatar.includes('appwrite'))}
                    />
                  ) : (
                    renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name, 'w-4 h-4 text-gold')
                  )}
                </div>

                <div
                  onClick={() => {
                    if (!user) {
                      setOnboardingInitialStep(1)
                      setIsOnboardingOpen(true)
                    }
                  }}
                  className="flex-1 flex items-center bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] focus-within:border-black/20 dark:focus-within:border-white/20 rounded-full px-4 py-2 transition-colors cursor-text"
                >
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={newCommentText}
                    onChange={handleCommentInputChange}
                    onKeyDown={e => e.key === 'Enter' && !isSubmittingComment && handleAddComment()}
                    onFocus={() => {
                      if (!user) {
                        setOnboardingInitialStep(1)
                        setIsOnboardingOpen(true)
                      }
                    }}
                    readOnly={!user || isSubmittingComment}
                    placeholder={user ? (replyingToComment ? `Reply to @${replyingToComment.author}...` : 'Add a comment... (Type @ to mention mutuals)') : 'Sign in to join discussion & comment...'}
                    className="w-full bg-transparent text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none font-sans cursor-pointer sm:cursor-text"
                  />
                  <button
                    type="button"
                    disabled={isSubmittingComment || (Boolean(user) && !newCommentText.trim())}
                    onClick={() => {
                      if (!user) {
                        setOnboardingInitialStep(1)
                        setIsOnboardingOpen(true)
                        return
                      }
                      if (!isSubmittingComment) {
                        handleAddComment()
                      }
                    }}
                    className="text-xs font-bold text-gold hover:text-gold-muted disabled:opacity-20 disabled:cursor-not-allowed transition-opacity cursor-pointer pl-3 shrink-0"
                  >
                    {isSubmittingComment ? 'Posting...' : user ? 'Post' : 'Sign In'}
                  </button>
                </div>
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



      {/* ─── Edit Post Modal ─── */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/70 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-[28px] sm:rounded-[36px] bg-white dark:bg-[#0c1017] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-display font-bold text-base">
                <Pencil className="w-4 h-4 text-gold" />
                <span>Edit Discussion</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={6}
                value={editPostContent}
                onChange={e => setEditPostContent(e.target.value)}
                placeholder="Update your post content (Markdown supported)..."
                className="w-full bg-slate-50 dark:bg-[#161b22] border border-black/[0.08] dark:border-white/10 rounded-2xl p-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-gold transition-colors resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                <span>Markdown supported</span>
                <span>{editPostContent.length} / 5,000</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit || !editPostContent.trim()}
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-muted disabled:opacity-40 text-slate-950 font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Share Clipboard / Action Toast ─── */}
      {shareCopiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-semibold shadow-2xl backdrop-blur-xl border border-white/10 dark:border-black/10">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {/* ─── Ultra-Minimalist Native Mobile Navigation Bar (Pure Icons / Instagram Style) ─── */}
      <nav
        aria-label="Mobile Navigation"
        className={`sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#07090e]/95 backdrop-blur-2xl border-t border-black/[0.06] dark:border-white/[0.08] px-3 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.3)] transition-all ${
          isNotifModalOpen || isCreateOpen || activeCommentPost || isOnboardingOpen ? 'hidden' : 'block'
        }`}
      >
        <div className="flex items-center justify-around h-13 max-w-sm mx-auto">
          {/* 1. Home / Feed Tab */}
          <button
            type="button"
            onClick={() => {
              try { navigator.vibrate?.([15]) } catch {}
              if (window.scrollY > 200) {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              } else {
                setSelectedTag('All')
                setSearchQuery('')
                setFilterOnlyOfficers(false)
                setFilterOnlySaved(false)
                setFilterOnlyMyPosts(false)
                reloadFeed('All')
              }
            }}
            className="flex items-center justify-center flex-1 h-full active:scale-90 transition-transform cursor-pointer"
            aria-label="Home Feed"
          >
            <Home
              className={`w-5.5 h-5.5 transition-colors ${
                selectedTag === 'All' && !searchQuery && !filterOnlySaved && !filterOnlyMyPosts
                  ? 'text-slate-900 dark:text-white stroke-[2.4]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 stroke-[1.8]'
              }`}
            />
          </button>

          {/* 2. Explore / Topics Tab */}
          <button
            type="button"
            onClick={() => {
              try { navigator.vibrate?.([15]) } catch {}
              window.scrollTo({ top: 0, behavior: 'smooth' })
              setIsThreadsDropdownOpen(prev => !prev)
            }}
            className="flex items-center justify-center flex-1 h-full active:scale-90 transition-transform cursor-pointer"
            aria-label="Explore Topics & Threads"
          >
            <Compass
              className={`w-5.5 h-5.5 transition-colors ${
                selectedTag !== 'All'
                  ? 'text-gold stroke-[2.4]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 stroke-[1.8]'
              }`}
            />
          </button>

          {/* 3. Instagram-Style Create [+] Tab */}
          <div className="flex items-center justify-center flex-1 h-full">
            <button
              type="button"
              onClick={() => {
                try { navigator.vibrate?.([20]) } catch {}
                if (!user) {
                  setIsOnboardingOpen(true)
                } else {
                  setIsCreateOpen(true)
                }
              }}
              className="flex items-center justify-center w-7.5 h-7.5 rounded-lg border-[1.75px] border-slate-800 dark:border-white/80 hover:border-gold hover:text-gold text-slate-900 dark:text-white transition-all active:scale-85 cursor-pointer"
              aria-label="Create Post"
            >
              <Plus className="w-4.5 h-4.5 stroke-[2.8]" />
            </button>
          </div>

          {/* 4. Search Tab */}
          <button
            type="button"
            onClick={() => {
              try { navigator.vibrate?.([15]) } catch {}
              setIsSearchModalOpen(true)
            }}
            className="flex items-center justify-center flex-1 h-full active:scale-90 transition-transform cursor-pointer"
            aria-label="Search Feed"
          >
            <Search
              className={`w-5.5 h-5.5 transition-colors ${
                Boolean(searchQuery)
                  ? 'text-gold stroke-[2.4]'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 stroke-[1.8]'
              }`}
            />
          </button>

          {/* 5. Real User Profile Tab */}
          <button
            type="button"
            onClick={() => {
              try { navigator.vibrate?.([15]) } catch {}
              if (!user) {
                setIsOnboardingOpen(true)
              } else {
                const handle = userProfile?.username 
                  ? userProfile.username.replace(/^@/, '') 
                  : user.name.toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'student'
                router.push(`/community/${handle}`)
              }
            }}
            className="flex items-center justify-center flex-1 h-full active:scale-90 transition-transform cursor-pointer"
            aria-label="My Profile"
          >
            {(() => {
              const avatarUrl = userProfile?.avatar || user?.avatar || ''
              const isPreset = avatarUrl.startsWith('preset:')
              const hasRealPhoto = avatarUrl && !isPreset

              if (hasRealPhoto) {
                return (
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1.5 ring-slate-400 dark:ring-slate-500 hover:ring-gold transition-all">
                    <Image
                      src={avatarUrl}
                      alt={userProfile?.name || user?.name || 'Profile'}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                      unoptimized={avatarUrl.startsWith('data:') || avatarUrl.includes('appwrite')}
                    />
                  </div>
                )
              }

              if (isPreset) {
                return (
                  <div className="w-6 h-6 rounded-full overflow-hidden ring-1.5 ring-slate-400 dark:ring-slate-500 flex items-center justify-center bg-slate-800">
                    {renderAvatarIcon(avatarUrl, userProfile?.name || user?.name || 'User', 'w-3 h-3 text-gold')}
                  </div>
                )
              }

              if (user) {
                const initial = (userProfile?.name || user.name || 'U').charAt(0).toUpperCase()
                return (
                  <div className="w-6 h-6 rounded-full bg-gold/15 text-gold font-bold text-[10px] flex items-center justify-center ring-1 ring-gold/40">
                    {initial}
                  </div>
                )
              }

              return <User className="w-5.5 h-5.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 stroke-[1.8]" />
            })()}
          </button>
        </div>
      </nav>

      {/* ─── Instagram-Style Search Modal ─── */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-[#0c1017] rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden p-4 space-y-3 mt-14 sm:mt-24">
              <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <div className="flex items-center gap-2 flex-1">
                  <Search size={16} className="text-gold shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts, topics, authors..."
                    className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-gold text-slate-950 hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                >
                  Done
                </button>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Filtering feed live</span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setIsSearchModalOpen(false)
                    }}
                    className="text-rose-500 hover:underline cursor-pointer font-medium"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
