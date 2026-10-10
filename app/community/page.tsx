'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  FileText,
  ThumbsUp,
  MessageSquare,
  Share2,
  ShieldAlert,
  UserCheck,
  Sparkles,
  UploadCloud,
  WifiOff,
  Trash2,
  Send,
  X,
  RefreshCw,
  Globe,
  Search,
  Terminal,
  Code2,
  Cpu,
  Layers,
  GraduationCap,
  ShieldCheck,
  Settings,
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

const LOCAL_STORAGE_KEY = 'psits_community_cached_posts_v4'
const TAGS = ['All', 'Academics', 'Tech & Code', 'Projects', 'Discussions', 'Campus Life']

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
  const [posts, setPosts] = useState<CommunityPostItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Local storage unreadable
    }
    return []
  })

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return false
      }
    } catch {
      // ignore
    }
    return true
  })

  const [selectedTag, setSelectedTag] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOffline, setIsOffline] = useState(() => (typeof window !== 'undefined' ? !navigator.onLine : false))
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

  // Active Comment Thread Modal
  const [activeCommentPost, setActiveCommentPost] = useState<CommunityPostItem | null>(null)
  const [comments, setComments] = useState<CommunityCommentItem[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)

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

  /* ─── 5. Appwrite Realtime Subscriptions (Live Feed & Instant Moderator Takedown) ─── */
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
        if (activeCommentPost?.$id === docId) {
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
  }, [activeCommentPost])

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

  /* ─── 8. Handle Reaction Toggle (Optimistic UI) ─── */
  const handleReaction = async (post: CommunityPostItem) => {
    if (!user) {
      setOnboardingInitialStep(1)
      setIsOnboardingOpen(true)
      return
    }

    // Optimistic UI update in 0ms
    setPosts(prev =>
      prev.map(p =>
        p.$id === post.$id ? { ...p, likes_count: p.likes_count + 1 } : p
      )
    )

    try {
      await togglePostReactionAction({
        postId: post.$id,
        userEmail: user.email,
        reactionType: 'like',
      })
    } catch {
      // Revert if network failed
      setPosts(prev =>
        prev.map(p =>
          p.$id === post.$id ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
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

  // Filtered post results based on search input
  const filteredPosts = posts.filter(post => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      post.content.toLowerCase().includes(q) ||
      post.author_display_name.toLowerCase().includes(q) ||
      (post.author_year_section && post.author_year_section.toLowerCase().includes(q)) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(q))) ||
      (post.attachment_names && post.attachment_names.some(n => n.toLowerCase().includes(q)))
    )
  })

  return (
    <div className="pt-28 sm:pt-32 pb-24 sm:pb-28 max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
      {/* ─── Sticky Offline Resilience Banner ─── */}
      {isOffline && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] bg-gold text-slate-950 font-semibold px-4 py-2.5 rounded-full shadow-2xl text-xs flex items-center justify-center gap-2 border border-gold/40 animate-pulse">
          <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
          <span className="truncate">Offline Mode: Viewing cached threads. Actions will sync when connected.</span>
        </div>
      )}

      {/* ─── Minimalist Editorial Header (Matches Events & Projects Style) ─── */}
      <ScrollReveal>
        <header className="border-b border-black/[0.06] dark:border-white/[0.08] pb-8 sm:pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-amber-600 dark:text-gold uppercase tracking-[0.2em] font-semibold">
                05 / Student Community · Peer Exchange
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
            </div>
            <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] text-slate-900 dark:text-white tracking-tight uppercase leading-[1.05]">
              Community <span className="text-gold">&amp;</span> Notes
            </h1>
            <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base font-normal leading-relaxed">
              An isolated, high-speed exchange for BSIT students to collaborate on technical topics, capstone architectures, and course modules.
            </p>
          </div>

          {/* Account Status Pill / iOS Onboarding Trigger */}
          <div className="shrink-0 flex items-center gap-2.5 self-start md:self-end">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingInitialStep(1)
                    setIsOnboardingOpen(true)
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-surface border border-black/[0.08] dark:border-white/[0.08] hover:border-gold/40 text-xs font-mono text-slate-600 dark:text-white/60 hover:text-gold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Test and preview the full-screen onboarding walkthrough"
                >
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span className="hidden sm:inline">Onboarding Tour</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOnboardingInitialStep(4)
                    setIsOnboardingOpen(true)
                  }}
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface border border-black/[0.08] dark:border-white/[0.08] hover:border-gold/50 dark:hover:border-gold/40 shadow-sm transition-all duration-300 text-left cursor-pointer"
                  title="Click to customize student profile"
                >
                  <div className="w-9 h-9 rounded-full bg-surface-subtle border border-gold/30 overflow-hidden flex items-center justify-center text-gold font-bold text-xs shrink-0 ring-2 ring-gold/20">
                    {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                      <Image
                        src={userProfile.avatar}
                        alt={userProfile.name}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      renderAvatarIcon(userProfile?.avatar, userProfile?.name || user.name)
                    )}
                  </div>
                  <div className="text-xs pr-1">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight group-hover:text-gold transition-colors">
                      <span className="truncate max-w-[140px]">{userProfile?.name || user.name}</span>
                      <UserCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                    </div>
                    <div className="text-slate-500 dark:text-white/40 text-[10px] truncate max-w-[140px] font-mono pt-0.5">
                      {userProfile?.yearSection || 'BSIT'} · Settings
                    </div>
                  </div>
                  <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-gold transition-colors ml-1" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOnboardingInitialStep(1)
                  setIsOnboardingOpen(true)
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-muted text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] cursor-pointer"
              >
                <Globe size={15} />
                <span>Connect @antiquespride.edu.ph</span>
              </button>
            )}
          </div>
        </header>
      </ScrollReveal>

      {/* ─── Restrained Minimalist Navigation & Filter Bar (Matching Events) ─── */}
      <ScrollReveal delay={0.05}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            {/* Subtle Underline Status Tabs */}
            <nav className="flex items-center gap-6 text-xs font-mono tracking-wider uppercase overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`transition-colors cursor-pointer relative pb-1 whitespace-nowrap ${
                    selectedTag === tag
                      ? 'text-slate-900 dark:text-white font-bold border-b-2 border-gold'
                      : 'text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </nav>

            {/* Minimalist Search Input */}
            <div className="relative w-full sm:w-64">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions & notes..."
                className="w-full bg-transparent border border-black/[0.08] dark:border-white/10 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ─── Main Content Container (Maximized Gap and Padding) ─── */}
      <main className="space-y-10 sm:space-y-12">
        {/* Floating Indicator for New Realtime Posts */}
        {hasNewPosts && (
          <div className="sticky top-20 z-40 flex justify-center">
            <button
              onClick={() => reloadFeed(selectedTag)}
              className="px-5 py-2.5 rounded-full bg-gold text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>↑ New discussions published — Click to reload</span>
            </button>
          </div>
        )}

        {/* ─── Create Post Card (Maximized Spacing & Minimalist Design) ─── */}
        <section className="rounded-2xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] hover:border-gold/40 dark:hover:border-gold/30 bg-surface p-7 sm:p-9 md:p-10 shadow-sm dark:shadow-none space-y-6 transition-all duration-300">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-surface-subtle border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center shrink-0 ring-2 ring-gold/20 overflow-hidden">
              {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                <Image
                  src={userProfile.avatar}
                  alt="Student"
                  width={48}
                  height={48}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name)
              )}
            </div>
            <button
              onClick={() => {
                if (!user) {
                  setOnboardingInitialStep(1)
                  setIsOnboardingOpen(true)
                  return
                }
                setIsCreateOpen(true)
              }}
              className="flex-1 bg-surface-subtle hover:bg-black/[0.04] dark:hover:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.08] text-left px-6 py-4 rounded-2xl text-slate-400 dark:text-white/40 text-sm transition-colors cursor-pointer"
            >
              Start a technical discussion, share course notes, or ask a question...
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.06] text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    setOnboardingInitialStep(1)
                    setIsOnboardingOpen(true)
                    return
                  }
                  setIsCreateOpen(true)
                  setTimeout(() => fileInputRef.current?.click(), 100)
                }}
                className="flex items-center gap-2 text-slate-500 dark:text-white/50 hover:text-gold px-4 py-2.5 rounded-xl hover:bg-surface-subtle transition-colors font-medium cursor-pointer"
              >
                <FileText className="w-4 h-4 text-gold shrink-0" />
                <span>Attach Module PDF</span>
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    setOnboardingInitialStep(1)
                    setIsOnboardingOpen(true)
                    return
                  }
                  setIsCreateOpen(true)
                }}
                className="flex items-center gap-2 text-slate-500 dark:text-white/50 hover:text-gold px-4 py-2.5 rounded-xl hover:bg-surface-subtle transition-colors font-medium cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-gold shrink-0" />
                <span>Project Question</span>
              </button>
            </div>

            <div className="text-slate-400 dark:text-white/40 font-mono text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle">
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              <span>
                {user
                  ? userProfile?.username
                    ? userProfile.username.startsWith('@')
                      ? userProfile.username
                      : `@${userProfile.username}`
                    : 'Setup Username'
                  : 'Connect Account'}
              </span>
            </div>
          </div>
        </section>

        {/* ─── Discussions Feed (Spacious Gap & Minimalist Cards) ─── */}
        {loading && posts.length === 0 ? (
          <div className="space-y-8 sm:space-y-10">
            {[1, 2, 3].map(n => (
              <div key={n} className="rounded-2xl sm:rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-surface p-8 sm:p-10 space-y-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-subtle" />
                  <div className="space-y-2 flex-1">
                    <div className="w-36 h-3.5 bg-surface-subtle rounded-md" />
                    <div className="w-24 h-2.5 bg-surface-subtle/70 rounded-md" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="w-full h-3 bg-surface-subtle rounded-md" />
                  <div className="w-4/5 h-3 bg-surface-subtle rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl space-y-3 p-10 bg-surface/40">
            <MessageSquare className="w-10 h-10 text-slate-400 dark:text-white/30 mx-auto opacity-50" />
            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white uppercase tracking-wider">
              No discussions found
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/50 max-w-sm mx-auto">
              {searchQuery ? `No matches found for "${searchQuery}".` : 'Be the first student to publish notes or ask an engineering question in this category.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-mono text-gold hover:underline underline-offset-4 uppercase tracking-wider cursor-pointer pt-2"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {filteredPosts.map((post, idx) => (
              <ScrollReveal key={post.$id} delay={(idx % 3) * 0.05}>
                <article className="rounded-2xl sm:rounded-3xl border border-black/[0.08] dark:border-white/[0.08] hover:border-gold/50 dark:hover:border-gold/40 bg-surface p-7 sm:p-9 md:p-10 transition-all duration-300 shadow-sm dark:shadow-none space-y-6">
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-subtle border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-gold/20">
                        {post.author_avatar && !post.author_avatar.startsWith('preset:') ? (
                          <Image
                            src={post.author_avatar}
                            alt={post.author_display_name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          renderAvatarIcon(post.author_avatar, post.author_display_name)
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white font-mono">
                            {post.author_display_name.startsWith('@') || post.author_display_name.startsWith('Anonymous')
                              ? post.author_display_name
                              : `@${post.author_display_name.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`}
                          </span>

                          {/* 🌟 Exclusive Gold / Yellow Officer Badge (Regular students have NO badge) */}
                          {post.is_officer && (
                            <span
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/10 dark:bg-gold/15 border border-gold/30 text-gold text-[10px] font-mono font-bold uppercase tracking-wider"
                              title={`Official PSITS Executive: ${post.officer_title || 'Officer'}`}
                            >
                              <Sparkles className="w-3 h-3 text-gold" />
                              <span>PSITS {post.officer_title || 'Officer'}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-white/40 pt-1 flex items-center gap-2">
                          <span>{post.author_year_section || 'BSIT'}</span>
                          <span>•</span>
                          <span>{new Date(post.$createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderator Takedown Button (Admins only) */}
                    {isAdmin && (
                      <button
                        onClick={() => setTakedownTarget(post)}
                        className="text-slate-400 hover:text-rose-500 p-2 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Moderator Action: Takedown Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Content with maximized breathing room */}
                  <div className="text-sm sm:text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-1">
                    {post.content}
                  </div>

                  {/* Document Attachments (Spacious Card Design) */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {post.attachments.map((fileId, i) => {
                        const name = post.attachment_names?.[i] || 'Document Attachment'
                        const size = post.attachment_sizes?.[i] || ''
                        const isPdf = name.toLowerCase().endsWith('.pdf')

                        return (
                          <div
                            key={fileId}
                            className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] hover:border-gold/40 transition-colors group"
                          >
                            <div className="flex items-center gap-4 overflow-hidden pr-3">
                              <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                  {name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 dark:text-white/40 flex items-center gap-2 pt-0.5">
                                  <span>{isPdf ? 'PDF Module' : 'Media Asset'}</span>
                                  {size && <span>• {size}</span>}
                                </div>
                              </div>
                            </div>

                            <a
                              href={appwriteStorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, fileId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-surface hover:bg-gold hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-black/[0.08] dark:border-white/[0.1] font-bold text-xs transition-colors shrink-0 shadow-sm"
                            >
                              Download
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Tag Chips */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {post.tags.map(t => (
                        <span
                          key={t}
                          className="text-[11px] font-mono font-medium px-3 py-1 rounded-lg bg-surface-subtle text-gold/90 border border-black/[0.06] dark:border-white/[0.08]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Engagement Strip */}
                  <div className="flex items-center justify-between pt-5 border-t border-black/[0.05] dark:border-white/[0.06] text-xs text-slate-500 dark:text-white/40">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleReaction(post)}
                        className="flex items-center gap-2 hover:text-gold transition-colors font-medium group cursor-pointer"
                      >
                        <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{post.likes_count} Reactions</span>
                      </button>
                      <button
                        onClick={() => openComments(post)}
                        className="flex items-center gap-2 hover:text-gold transition-colors font-medium group cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{post.comments_count} Replies</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'PSITS Community Post',
                            text: post.content.slice(0, 100),
                            url: window.location.href,
                          })
                        } else {
                          navigator.clipboard.writeText(window.location.href)
                          alert('Link copied to clipboard!')
                        }
                      }}
                      className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>

      {/* ─── Premium iOS-Style Community Onboarding Modal ─── */}
      <CommunityOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        user={user}
        currentProfile={userProfile}
        onProfileUpdated={(updated) => {
          setUserProfile(updated)
          setUser(prev => prev ? { ...prev, name: updated.name, avatar: updated.avatar } : null)
        }}
        initialStep={onboardingInitialStep}
      />

      {/* ─── Create Post Modal (Maximized Spacing & Theme-Aware) ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-xl rounded-[28px] sm:rounded-[36px] bg-surface border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-7 sm:p-9 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight">
                Publish Discussion
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-full hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Author Indicator */}
            <div className="flex items-center gap-3.5 p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08]">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0 text-gold overflow-hidden">
                {userProfile?.avatar && !userProfile.avatar.startsWith('preset:') ? (
                  <Image
                    src={userProfile.avatar}
                    alt="Student"
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-full h-full"
                  />
                ) : (
                  renderAvatarIcon(userProfile?.avatar, userProfile?.name || user?.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold font-mono text-gold truncate">
                  {userProfile?.username
                    ? (userProfile.username.startsWith('@') ? userProfile.username : `@${userProfile.username}`)
                    : `@${(userProfile?.name || user?.name || 'kasubay').toLowerCase().replace(/[^a-z0-9_.]/g, '')}`}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-white/40">
                  {userProfile?.yearSection || 'BSIT'} · Public Discussion
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                <UserCheck className="w-3 h-3" />
                <span>Verified</span>
              </div>
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              {TAGS.filter(t => t !== 'All').map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedPostTag(t)}
                  className={`px-3.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer ${
                    selectedPostTag === t
                      ? 'bg-gold text-slate-950 font-bold'
                      : 'bg-surface-subtle text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content Input */}
            <textarea
              value={postContent}
              onChange={e => setPostContent(e.target.value)}
              placeholder="What would you like to discuss with fellow BSIT students?"
              className="w-full h-40 bg-surface-subtle border border-black/[0.08] dark:border-white/10 focus:border-gold rounded-2xl p-5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none resize-none leading-relaxed"
            />

            {/* Attached Files List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, idx) => (
                  <div key={file.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface-subtle text-xs border border-black/[0.06] dark:border-white/[0.08]">
                    <span className="truncate max-w-[320px] text-slate-900 dark:text-white font-medium">{file.name} ({file.size})</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-slate-500 dark:text-white/50 hover:text-gold text-xs font-semibold px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 hover:bg-surface-subtle transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-gold" />
                <span>{isUploadingFile ? 'Uploading...' : 'Attach Document / PDF'}</span>
              </button>

              <button
                type="button"
                disabled={isSubmittingPost || !postContent.trim()}
                onClick={handleCreatePost}
                className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-muted disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingPost ? 'Publishing...' : 'Publish Post'}
              </button>
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
