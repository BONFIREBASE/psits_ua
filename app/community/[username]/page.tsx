'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  MessageSquare,
  CornerDownLeft,
  Share2,
  Trash2,
  Bookmark,
  MoreHorizontal,
  Pencil,
  FileText,
  FileCode,
  ShieldCheck,
  X,
  RefreshCw,
  Terminal,
  Code2,
  Cpu,
  Layers,
  GraduationCap,
  Grid,
  Check,
  Hash,
} from 'lucide-react'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS, appwriteStorage, APPWRITE_STORAGE_BUCKET_ID } from '@/lib/appwrite'
import {
  getCommunityFeedAction,
  deleteOwnCommunityPostAction,
  editCommunityPostAction,
  togglePostReactionAction,
  addCommentAction,
  getCommentsForPostAction,
  toggleFollowAction,
  getFollowStatsAction,
  getFollowListAction,
  getStudentProfileByHandleAction,
  type CommunityPostItem,
  type CommunityCommentItem,
  type FollowUserInfo,
  type StudentProfileData,
} from '../actions'
import { supabase } from '@/lib/supabase'
import { NumberTicker } from '@/components/motion/number-ticker'
import { SharePostModal } from '@/components/SharePostModal'
import { CommentsListSkeleton } from '@/components/PublicSkeletonPreloader'

function InstagramVerifiedBadge({ className = 'w-4 h-4' }: { className?: string }) {
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

function renderAvatarIcon(avatarStr?: string, nameStr?: string, className = 'w-6 h-6 text-gold') {
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
  return <span className="font-bold text-gold text-base">{nameStr ? nameStr.charAt(0).toUpperCase() : 'K'}</span>
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

export default function StudentProfilePage() {
  const router = useRouter()
  const params = useParams()
  const rawParam = params?.username as string | undefined
  const targetUsername = useMemo(() => {
    return decodeURIComponent(rawParam || '').replace(/^@/, '').toLowerCase().trim()
  }, [rawParam])

  const [posts, setPosts] = useState<CommunityPostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{
    email: string
    name: string
    username?: string
    avatar?: string
    isOfficer?: boolean
    isVerified?: boolean
    yearSection?: string
  } | null>(null)
  const [fetchedProfile, setFetchedProfile] = useState<StudentProfileData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Engagement & Action state
  const [savedPostIds, setSavedPostIds] = useState<string[]>([])
  const [userLikedPosts, setUserLikedPosts] = useState<string[]>([])
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null)
  const [confirmDeletePostId, setConfirmDeletePostId] = useState<string | null>(null)
  const [isDeletingPostId, setIsDeletingPostId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<CommunityPostItem | null>(null)
  const [editPostContent, setEditPostContent] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts')

  // Follow System state
  const [followStats, setFollowStats] = useState({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  })
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [copiedProfile, setCopiedProfile] = useState(false)
  const [followModal, setFollowModal] = useState<{
    open: boolean
    type: 'followers' | 'following'
    users: FollowUserInfo[]
    loading: boolean
  }>({
    open: false,
    type: 'followers',
    users: [],
    loading: false,
  })

  // Comments Thread Modal
  const [activeCommentPost, setActiveCommentPost] = useState<CommunityPostItem | null>(null)
  const [comments, setComments] = useState<CommunityCommentItem[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [replyingToComment, setReplyingToComment] = useState<{ id: string; author: string } | null>(null)
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Load auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || ''
        const metadata = session.user.user_metadata || {}
        const name = metadata.full_name || email.split('@')[0]
        const avatar = metadata.community_avatar || metadata.avatar_url || ''
        const username = metadata.community_username || ''
        const isOfficer = Boolean(metadata.role === 'officer' || metadata.role === 'admin' || email.toLowerCase() === 'psits-ua@antiquespride.edu.ph')
        const isVerified = Boolean(isOfficer || metadata.is_verified || metadata.community_tos_accepted)
        const yearSection = metadata.year_section || 'BSIT'
        setUser({ email, name, avatar, username, isOfficer, isVerified, yearSection })

        if (email.toLowerCase() === 'psits-ua@antiquespride.edu.ph' || email.toLowerCase().includes('admin')) {
          setIsAdmin(true)
        }

        try {
          const cached = localStorage.getItem('psits_community_cached_posts_v4')
          if (cached) {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPosts(parsed)
              setLoading(false)
            }
          }
        } catch {}
      } else {
        router.replace('/community')
      }
    }).catch(() => {
      router.replace('/community')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setPosts([])
        try {
          localStorage.removeItem('psits_community_cached_posts_v4')
        } catch {}
        router.replace('/community')
      }
    })

    queueMicrotask(() => {
      try {
        const cachedSaved = localStorage.getItem('psits_community_saved_posts')
        if (cachedSaved) setSavedPostIds(JSON.parse(cachedSaved))
        const cachedLiked = localStorage.getItem('psits_community_liked_posts')
        if (cachedLiked) setUserLikedPosts(JSON.parse(cachedLiked))
      } catch {}
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Fetch persistent student profile metadata by handle
  useEffect(() => {
    if (!targetUsername) return
    let isMounted = true
    getStudentProfileByHandleAction(targetUsername).then(res => {
      if (isMounted && res.success && res.profile) {
        setFetchedProfile(res.profile)
      }
    })
    return () => {
      isMounted = false
    }
  }, [targetUsername])


  useEffect(() => {
    let ignore = false
    getCommunityFeedAction()
      .then(res => {
        if (!ignore && res.success && res.posts) {
          setPosts(res.posts)
          try {
            localStorage.setItem('psits_community_cached_posts_v4', JSON.stringify(res.posts))
          } catch {}
        }
      })
      .catch(err => {
        console.error('Failed to load profile posts:', err)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  // Filter posts by this username
  const authorPosts = useMemo(() => {
    if (!user || !targetUsername) return []
    return posts.filter(p => {
      const pHandle = (p.author_display_name || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')
      return pHandle === targetUsername
    })
  }, [posts, targetUsername, user])

  // Filter saved posts from all loaded feed posts
  const savedPosts = useMemo(() => {
    if (!user) return []
    return posts.filter(p => savedPostIds.includes(p.$id))
  }, [posts, savedPostIds, user])

  const displayedPosts = useMemo(() => {
    return activeTab === 'posts' ? authorPosts : savedPosts
  }, [activeTab, authorPosts, savedPosts])

  // Profile Identity & Ownership
  const myHandle = useMemo(() => {
    return (user?.username || user?.name || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')
  }, [user])

  const isOwnProfile = Boolean(myHandle && targetUsername && myHandle === targetUsername)

  // Profile metadata extracted from persistent account, user session, or author posts
  const profileInfo = useMemo(() => {
    const firstPost = authorPosts[0]

    let displayName = fetchedProfile?.displayName
    let avatar = fetchedProfile?.avatar
    let yearSection = fetchedProfile?.yearSection
    let isOfficer = fetchedProfile?.isOfficer
    let isVerified = fetchedProfile?.isVerified

    let officerTitle = fetchedProfile?.officerTitle

    // If own profile, active user session guarantees immediate local freshness
    if (isOwnProfile && user) {
      displayName = user.name || displayName || targetUsername
      avatar = user.avatar || avatar || ''
      yearSection = user.yearSection || yearSection || 'BSIT'
      if (user.isOfficer !== undefined) isOfficer = user.isOfficer
      if (user.isVerified !== undefined) isVerified = user.isVerified
      if ((user as { officerTitle?: string }).officerTitle) {
        officerTitle = (user as { officerTitle?: string }).officerTitle
      }
    }

    // Fallback to first post metadata if profile query hasn't resolved
    if (firstPost) {
      displayName = displayName || (firstPost.author_display_name.startsWith('@') ? firstPost.author_display_name.slice(1) : firstPost.author_display_name)
      avatar = avatar || firstPost.author_avatar || ''
      yearSection = yearSection || firstPost.author_year_section || 'BSIT'
      if (isOfficer === undefined) isOfficer = Boolean(firstPost.is_officer)
      if (isVerified === undefined) isVerified = Boolean(firstPost.is_officer || firstPost.is_verified)
      if (!officerTitle && firstPost.officer_title) officerTitle = firstPost.officer_title
    }

    return {
      displayName: displayName || targetUsername,
      handle: `@${targetUsername}`,
      avatar: avatar || '',
      isOfficer: Boolean(isOfficer),
      isVerified: Boolean(isVerified),
      officerTitle: officerTitle || (isOfficer ? 'PSITS Officer' : ''),
      yearSection: yearSection || 'BSIT',
      totalPosts: authorPosts.length,
      totalLikes: authorPosts.reduce((acc, p) => acc + (p.likes_count || 0), 0),
    }
  }, [fetchedProfile, isOwnProfile, user, authorPosts, targetUsername])

  const handleToggleSavePost = (postId: string) => {
    setSavedPostIds(prev => {
      const updated = prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
      try {
        localStorage.setItem('psits_community_saved_posts', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  // Follow Handlers & Profile Operations

  const loadFollowStats = useCallback(async () => {
    if (!targetUsername) return
    const res = await getFollowStatsAction(targetUsername, myHandle)
    if (res.success) {
      setFollowStats({
        followersCount: res.followersCount,
        followingCount: res.followingCount,
        isFollowing: res.isFollowing,
      })
    }
  }, [targetUsername, myHandle])

  useEffect(() => {
    let isMounted = true
    if (targetUsername) {
      getFollowStatsAction(targetUsername, myHandle).then(res => {
        if (isMounted && res.success) {
          setFollowStats({
            followersCount: res.followersCount,
            followingCount: res.followingCount,
            isFollowing: res.isFollowing,
          })
        }
      })
    }

    let unsubscribe: (() => void) | undefined
    try {
      const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLECTIONS.FOLLOWS}.documents`
      unsubscribe = appwrite.subscribe(channel, () => {
        loadFollowStats()
      })
    } catch (err) {
      console.warn('Realtime subscription error for follows:', err)
    }

    return () => {
      isMounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [targetUsername, myHandle, loadFollowStats])

  const handleToggleFollow = async () => {
    if (!user) {
      alert('Please connect your student account to follow kasubays.')
      return
    }
    if (!myHandle || !targetUsername || isOwnProfile || isFollowLoading) return

    setIsFollowLoading(true)
    const nextFollowing = !followStats.isFollowing

    // Optimistic update
    setFollowStats(prev => ({
      ...prev,
      isFollowing: nextFollowing,
      followersCount: Math.max(0, prev.followersCount + (nextFollowing ? 1 : -1)),
    }))

    try {
      const res = await toggleFollowAction({
        followerHandle: myHandle,
        followingHandle: targetUsername,
        followerName: user.name,
        followerAvatar: user.avatar,
      })
      if (!res.success) {
        loadFollowStats()
      }
    } catch {
      loadFollowStats()
    } finally {
      setIsFollowLoading(false)
    }
  }

  const openFollowList = async (type: 'followers' | 'following') => {
    setFollowModal({ open: true, type, users: [], loading: true })
    try {
      const res = await getFollowListAction(targetUsername, type)
      if (res.success) {
        setFollowModal(prev => ({ ...prev, users: res.users, loading: false }))
      } else {
        setFollowModal(prev => ({ ...prev, loading: false }))
      }
    } catch {
      setFollowModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleShareProfile = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopiedProfile(true)
      setTimeout(() => setCopiedProfile(false), 2000)
    }
  }

  const [shareModalPost, setShareModalPost] = useState<CommunityPostItem | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleSharePost = async (post: CommunityPostItem) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/community?post=${post.$id}` : ''
    const authorName = post.is_anonymous ? 'Anonymous Kasubay' : post.author_display_name
    const cleanSnippet = post.content
      ? post.content.replace(/[#*`_~]/g, '').trim().slice(0, 100)
      : 'Join the discussion on PSITS Community'
    const shareTitle = `PSITS Community: ${authorName}`
    const shareText = `Check out this post by ${authorName} on PSITS Community: "${cleanSnippet}"`

    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        })
        return
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    setShareModalPost(post)
    setIsShareModalOpen(true)
  }

  const handleReaction = async (post: CommunityPostItem) => {
    if (!user) {
      alert('Please connect your student account to like discussions.')
      return
    }

    const isLiked = userLikedPosts.includes(post.$id)
    setUserLikedPosts(prev => {
      const next = isLiked ? prev.filter(id => id !== post.$id) : [...prev, post.$id]
      try {
        localStorage.setItem('psits_community_liked_posts', JSON.stringify(next))
      } catch {}
      return next
    })

    setPosts(prev =>
      prev.map(p => {
        if (p.$id === post.$id) {
          const delta = isLiked ? -1 : 1
          return { ...p, likes_count: Math.max(0, p.likes_count + delta) }
        }
        return p
      })
    )

    try {
      await togglePostReactionAction({ postId: post.$id, userEmail: user.email })
    } catch {}
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
        setPosts(prev => prev.filter(p => p.$id !== post.$id))
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
        setPosts(prev => prev.map(p => (p.$id === editingPost.$id ? { ...p, content: editPostContent.trim() } : p)))
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

  const openComments = async (post: CommunityPostItem) => {
    setActiveCommentPost(post)
    setCommentsLoading(true)
    try {
      const res = await getCommentsForPostAction(post.$id)
      if (res.success && res.comments) {
        setComments(res.comments)
      }
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!user || !activeCommentPost || !newCommentText.trim()) return

    const contentToSubmit = newCommentText.trim()
    const currentPostId = activeCommentPost.$id
    const authorHandle = user.username ? `@${user.username.replace(/^@/, '')}` : user.name
    const replyingParent = replyingToComment

    const tempCommentId = `optimistic-c-${Date.now()}`
    const optimisticComment: CommunityCommentItem = {
      $id: tempCommentId,
      $createdAt: new Date().toISOString(),
      content: contentToSubmit,
      author_student_no: user.email,
      author_display_name: authorHandle,
      author_avatar: user.avatar,
      is_anonymous: false,
      is_verified: Boolean(user.isVerified),
      is_officer: Boolean(user.isOfficer),
      parent_id: replyingParent?.id,
      reply_to_handle: replyingParent?.author,
      is_edited: false,
      status: 'active',
    }

    // 1. Instantly append comment (0ms perceived latency)
    setComments(prev => [...prev, optimisticComment])
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
    setNewCommentText('')
    setReplyingToComment(null)

    // 2. Background persistence and reconciliation
    addCommentAction({
      postId: currentPostId,
      content: contentToSubmit,
      userEmail: user.email,
      userName: authorHandle,
      parentId: replyingParent?.id,
      replyToHandle: replyingParent?.author,
    })
      .then(res => {
        if (res.success && res.comment) {
          setComments(prev =>
            prev.map(c => (c.$id === tempCommentId ? res.comment! : c))
          )
        } else {
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
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#07090e] text-slate-900 dark:text-slate-100 pb-24 pt-20 sm:pt-24 overflow-x-hidden">
      <main className="max-w-xl mx-auto px-4 space-y-5">
        {/* Top Header Navigation Strip (In-flow to prevent mobile avatar cutoff) */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <Link
            href="/community"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-white/70 hover:text-gold transition-colors py-1.5 px-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Feed</span>
          </Link>
          <div className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
            {profileInfo.handle}
          </div>
          <div className="w-16" />
        </div>

        {/* Instagram Profile Hero (Seamless & Natural) */}
        <section className="pt-1 pb-1 space-y-4">
          <div className="flex items-center gap-5 sm:gap-7">
            {/* 80px Circular Avatar with Overlaid Yellow Verified Badge */}
            <div className="relative shrink-0 w-20 h-20 sm:w-22 sm:h-22">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center ring-1 ring-black/10 dark:ring-white/10">
                {profileInfo.avatar && !profileInfo.avatar.startsWith('preset:') ? (
                  <Image
                    src={profileInfo.avatar}
                    alt={profileInfo.displayName}
                    width={88}
                    height={88}
                    className="w-full h-full object-cover"
                    unoptimized={Boolean(profileInfo.avatar.startsWith('data:') || profileInfo.avatar.includes('appwrite'))}
                  />
                ) : (
                  renderAvatarIcon(profileInfo.avatar, profileInfo.displayName, 'w-9 h-9 text-gold')
                )}
              </div>
              {profileInfo.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#07090e] bg-white dark:bg-[#07090e] flex items-center justify-center pointer-events-none shadow-sm">
                  <InstagramVerifiedBadge className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Stats Row (Instagram Style: Posts | Followers | Following) */}
            <div className="flex-1 grid grid-cols-3 gap-1 sm:gap-2 text-center">
              <div className="flex flex-col">
                <span className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                  {profileInfo.totalPosts}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-white/50">Posts</span>
              </div>
              <button
                type="button"
                onClick={() => openFollowList('followers')}
                className="flex flex-col hover:opacity-80 transition-opacity cursor-pointer group"
              >
                <span className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-gold transition-colors">
                  {followStats.followersCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-white/50">Followers</span>
              </button>
              <button
                type="button"
                onClick={() => openFollowList('following')}
                className="flex flex-col hover:opacity-80 transition-opacity cursor-pointer group"
              >
                <span className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-gold transition-colors">
                  {followStats.followingCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-white/50">Following</span>
              </button>
            </div>
          </div>

          {/* Details & Badges */}
          <div className="space-y-1">
            <h1 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
              {profileInfo.displayName}
            </h1>
            <div className="text-xs font-mono text-slate-500 dark:text-white/40">
              {profileInfo.handle}
            </div>
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {profileInfo.yearSection && (
                <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] font-mono text-[11px] text-slate-700 dark:text-white/80">
                  {profileInfo.yearSection}
                </span>
              )}
              {profileInfo.isOfficer && (
                <span className="px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30 text-[11px] text-gold font-bold uppercase tracking-wider">
                  {profileInfo.officerTitle || 'PSITS Officer'}
                </span>
              )}
            </div>

            {/* Action Buttons Row (Minimalist Instagram Style) */}
            <div className="pt-2 flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('psits:open-profile'))}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/12 text-slate-900 dark:text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/12 text-slate-900 dark:text-white text-xs font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{copiedProfile ? 'Copied Link!' : 'Share profile'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`flex-1 py-1.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs ${
                      followStats.isFollowing
                        ? 'bg-black/[0.05] dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 border border-transparent'
                        : 'bg-gold hover:bg-gold-muted text-slate-950 font-bold active:scale-[0.98]'
                    }`}
                  >
                    {followStats.isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <span>Follow</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="p-1.5 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/12 text-slate-900 dark:text-white transition-colors cursor-pointer"
                    title="Share profile"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Minimalist Navigation Tabs (Clean Pills, No Severed Bars) */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2 py-2 px-5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Posts</span>
            <span className="text-[11px] font-mono opacity-80">({authorPosts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-2 px-5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
            <span className="text-[11px] font-mono opacity-80">({savedPosts.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {loading && displayedPosts.length === 0 ? (
            <div className="space-y-4">
              {[1, 2].map(n => (
                <div
                  key={n}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0c1017]/80 p-4 sm:p-5 space-y-4 animate-pulse shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-black/[0.06] dark:bg-white/[0.08]" />
                    <div className="space-y-1.5 flex-1">
                      <div className="w-28 h-3.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-md" />
                      <div className="w-16 h-2.5 bg-black/[0.04] dark:bg-white/[0.05] rounded-md" />
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <div className="w-full h-3 bg-black/[0.06] dark:bg-white/[0.08] rounded-md" />
                    <div className="w-4/5 h-3 bg-black/[0.06] dark:bg-white/[0.08] rounded-md" />
                    <div className="w-2/5 h-3 bg-black/[0.04] dark:bg-white/[0.05] rounded-md" />
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-4 bg-black/[0.04] dark:bg-white/[0.05] rounded" />
                      <div className="w-6 h-4 bg-black/[0.04] dark:bg-white/[0.05] rounded" />
                      <div className="w-4 h-4 bg-black/[0.04] dark:bg-white/[0.05] rounded" />
                    </div>
                    <div className="w-4 h-4 bg-black/[0.04] dark:bg-white/[0.05] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedPosts.length === 0 ? (
            activeTab === 'posts' ? (
              <div className="text-center py-16 p-8 rounded-3xl bg-white/60 dark:bg-[#0c1017]/60 border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <p className="text-xs text-slate-500 dark:text-white/50">
                  No posts published by {profileInfo.displayName} yet.
                </p>
                <Link
                  href="/community"
                  className="inline-block text-xs font-semibold text-gold hover:underline pt-2"
                >
                  Explore community feed →
                </Link>
              </div>
            ) : (
              <div className="text-center py-16 p-8 rounded-3xl bg-white/60 dark:bg-[#0c1017]/60 border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="w-12 h-12 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400">
                  <Bookmark className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">Save Posts</h3>
                  <p className="text-xs text-slate-500 dark:text-white/50 max-w-xs mx-auto">
                    Save posts to read or revisit later. Only you can see what you&apos;ve saved.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {displayedPosts.map(post => {
                const isLiked = userLikedPosts.includes(post.$id)
                const isSaved = savedPostIds.includes(post.$id)

                const myHandle = (user?.username || user?.name || '').toLowerCase().replace(/[^a-z0-9_.]/g, '')
                const postHandle = (post.author_display_name || '').toLowerCase().replace(/[^a-z0-9_.]/g, '')
                const isAuthor = Boolean(
                  (user?.email && post.author_student_no && post.author_student_no.toLowerCase() === user.email.toLowerCase()) ||
                  (myHandle && postHandle && myHandle === postHandle)
                )

                return (
                  <article
                    key={post.$id}
                    id={`post-${post.$id}`}
                    className={`relative rounded-2xl border border-black/[0.05] dark:border-white/[0.06] hover:border-black/10 dark:hover:border-white/[0.12] transition-all duration-200 p-3.5 sm:p-5 space-y-3 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-xl shadow-xs dark:shadow-none ${
                      activeMenuPostId === post.$id ? 'z-40' : 'z-0'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0 w-8 h-8 sm:w-9 sm:h-9">
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
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
                          </div>
                          {(post.is_officer || post.is_verified) && (
                            <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#0c1017] bg-white dark:bg-[#0c1017] flex items-center justify-center pointer-events-none shadow-xs">
                              <InstagramVerifiedBadge className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
                            <span className="font-semibold text-xs sm:text-[13px] text-slate-900 dark:text-slate-100 truncate">
                              {post.author_display_name.startsWith('@') ? post.author_display_name.slice(1) : post.author_display_name}
                            </span>
                            {post.tags?.[0] && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-medium">
                                <Hash className="w-2.5 h-2.5" />
                                <span>{post.tags[0]}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 dark:text-white/40 font-mono pt-0.5">
                            <span title={new Date(post.$createdAt).toLocaleString()}>{formatRelativeTime(post.$createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3-Dot Context Menu */}
                      <div className="relative flex items-center gap-1">
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
                              {(isAuthor || isAdmin) && (
                                <>
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

                                  {isAuthor && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuPostId(null)
                                        setConfirmDeletePostId(null)
                                        setEditingPost(post)
                                        setEditPostContent(post.content)
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors text-left cursor-pointer"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Edit post</span>
                                    </button>
                                  )}

                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-0.5 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </div>

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {post.attachments.map((fileId, i) => {
                          const name = post.attachment_names?.[i] || 'Document Attachment'
                          const size = post.attachment_sizes?.[i] || ''
                          const isPdf = name.toLowerCase().endsWith('.pdf')
                          const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(name)
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
                              className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]"
                            >
                              <div className="flex items-center gap-3 overflow-hidden pr-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isPdf ? 'bg-rose-500/15 border-rose-500/30 text-rose-500' : 'bg-gold/15 border-gold/30 text-gold'}`}>
                                  {isPdf ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                    {name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500 dark:text-white/40">
                                    {size || 'Attachment'}
                                  </div>
                                </div>
                              </div>

                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-lg bg-surface hover:bg-gold hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-black/[0.08] dark:border-white/[0.1] font-bold text-[11px] font-mono transition-colors shrink-0"
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

                        <button
                          type="button"
                          onClick={() => handleSharePost(post)}
                          className="group flex items-center gap-1.5 transition-colors cursor-pointer select-none active:scale-90 p-1 -m-1"
                          title="Share post"
                        >
                          <Share2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500 dark:text-white/60 group-hover:text-gold transition-transform duration-200 group-hover:scale-110" />
                        </button>
                      </div>

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
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Post Modal */}
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
                placeholder="Update your post content..."
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

      {/* ─── Instagram-Style Comments Modal ─── */}
      {activeCommentPost && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-[24px] sm:rounded-[28px] bg-white dark:bg-[#0c1017] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0 bg-white dark:bg-[#0c1017]">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Discussion
                </h3>
                {activeCommentPost.tags?.[0] && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/25 font-bold truncate">
                    #{activeCommentPost.tags[0]}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setActiveCommentPost(null)
                  setReplyingToComment(null)
                }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Original Post Card Preview (Instagram / Threads Style) */}
            <div className="p-4 sm:p-5 border-b border-black/[0.08] dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] space-y-3 shrink-0 max-h-[36vh] overflow-y-auto scrollbar-thin">
              {/* Author Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={activeCommentPost.is_anonymous ? '#' : `/community/${activeCommentPost.author_display_name.replace(/^@/, '')}`}
                    className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center ring-2 ring-gold/25"
                  >
                    {activeCommentPost.author_avatar && !activeCommentPost.author_avatar.startsWith('preset:') ? (
                      <Image
                        src={activeCommentPost.author_avatar}
                        alt={activeCommentPost.author_display_name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized={Boolean(activeCommentPost.author_avatar.startsWith('data:') || activeCommentPost.author_avatar.includes('appwrite'))}
                      />
                    ) : (
                      renderAvatarIcon(activeCommentPost.author_avatar, activeCommentPost.author_display_name, 'w-5 h-5 text-gold')
                    )}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={activeCommentPost.is_anonymous ? '#' : `/community/${activeCommentPost.author_display_name.replace(/^@/, '')}`}
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:underline truncate"
                      >
                        {activeCommentPost.author_display_name}
                      </Link>
                      {(activeCommentPost.is_officer || activeCommentPost.is_verified) && (
                        <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block shrink-0" />
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gold/15 text-gold border border-gold/30">
                        Author
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/40">
                      <span>{activeCommentPost.author_year_section || 'BSIT'}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(activeCommentPost.$createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="text-[13px] sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans pl-0.5 whitespace-pre-wrap">
                {activeCommentPost.content}
              </div>

              {/* Attachments / Media Preview */}
              {activeCommentPost.attachments && activeCommentPost.attachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {activeCommentPost.attachments.map((fileId, i) => {
                    const name = activeCommentPost.attachment_names?.[i] || 'Document Attachment'
                    const size = activeCommentPost.attachment_sizes?.[i] || ''
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
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface-subtle border border-black/[0.06] dark:border-white/[0.08] hover:border-gold/40 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isPdf ? 'bg-rose-500/15 border-rose-500/30 text-rose-500' : 'bg-gold/15 border-gold/30 text-gold'
                          }`}>
                            {isPdf ? <FileText className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">{name}</div>
                            {size && <div className="text-[10px] text-slate-500 dark:text-white/40 font-mono">{size}</div>}
                          </div>
                        </div>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-surface hover:bg-gold hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-black/[0.08] dark:border-white/[0.1] font-bold text-[10px] font-mono transition-colors shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Engagement Stats Bar */}
              <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500 dark:text-white/40 border-t border-black/[0.04] dark:border-white/[0.04]">
                <span className="flex items-center gap-1.5 font-mono">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                  <span>{activeCommentPost.likes_count || 0} likes</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  <MessageCircle className="w-3.5 h-3.5 text-gold" />
                  <span>{comments.length} comments</span>
                </span>
              </div>
            </div>

            {/* Discussion Header Strip */}
            <div className="px-5 py-2.5 bg-black/[0.015] dark:bg-white/[0.015] border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-gold" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider">
                  Comments ({comments.length})
                </span>
              </div>
            </div>

            {/* Comments Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 scrollbar-thin">
              {commentsLoading ? (
                <CommentsListSkeleton />
              ) : comments.length === 0 ? (
                <div className="text-center py-12 space-y-1">
                  <div className="font-semibold text-xs text-slate-700 dark:text-white/80">No comments yet</div>
                  <div className="text-[11px] text-slate-400">Start the conversation below.</div>
                </div>
              ) : (
                comments.map(c => {
                  const handle = c.author_display_name.startsWith('@') || c.author_display_name.startsWith('Anonymous')
                    ? c.author_display_name
                    : `@${c.author_display_name.toLowerCase().replace(/[^a-z0-9_.]/g, '')}`
                  const cleanHandle = handle.replace(/^@/, '')
                  const isReplyingThis = replyingToComment?.id === (c.parent_id || c.$id)
                  return (
                    <div key={c.$id} className={`flex items-start gap-3 group transition-all duration-150 rounded-xl p-1 -m-1 ${isReplyingThis ? 'bg-gold/[0.05] ring-1 ring-gold/25' : ''}`}>
                      <Link
                        href={c.is_anonymous ? '#' : `/community/${cleanHandle}`}
                        className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center ring-1 ring-black/10 dark:ring-white/10 mt-0.5"
                      >
                        {c.author_avatar && !c.author_avatar.startsWith('preset:') ? (
                          <Image
                            src={c.author_avatar}
                            alt={c.author_display_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized={Boolean(c.author_avatar.startsWith('data:') || c.author_avatar.includes('appwrite'))}
                          />
                        ) : (
                          renderAvatarIcon(c.author_avatar, c.author_display_name, 'w-4 h-4 text-gold')
                        )}
                      </Link>

                      <div className="flex-1 min-w-0 text-xs sm:text-[13px] leading-relaxed">
                        <div className="inline">
                          <Link
                            href={c.is_anonymous ? '#' : `/community/${cleanHandle}`}
                            className="font-bold text-slate-900 dark:text-white hover:underline mr-1.5"
                          >
                            {handle}
                          </Link>
                          {(c.is_officer || c.is_verified) && (
                            <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block mr-1.5" />
                          )}
                          {c.reply_to_handle && (
                            <span className="font-semibold text-gold mr-1.5 select-none">
                              @{c.reply_to_handle.replace(/^@/, '')}
                            </span>
                          )}
                          <span className="text-slate-800 dark:text-slate-200 break-words">{c.content}</span>
                        </div>
                        <div className="flex items-center gap-3.5 mt-1 text-[11px] text-slate-400 dark:text-white/40">
                          <span>{formatRelativeTime(c.$createdAt)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const targetId = c.parent_id || c.$id
                              setReplyingToComment({ id: targetId, author: cleanHandle })
                              setNewCommentText(`@${cleanHandle} `)
                            }}
                            className="font-bold text-slate-600 dark:text-white/70 hover:text-gold transition-colors cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-slate-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-500 pt-1 shrink-0 transition-colors cursor-pointer"
                        title="Like comment"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Sticky Instagram Comment Input Bar */}
            <div className="px-4 sm:px-5 py-3 border-t border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#0c1017] shrink-0">
              {replyingToComment && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gold/10 border border-gold/25 text-xs text-gold mb-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                  <div className="flex items-center gap-1.5 truncate">
                    <CornerDownLeft className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="truncate">
                      Replying to <span className="font-bold underline decoration-gold/40">@{replyingToComment.author}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingToComment(null)
                      setNewCommentText('')
                    }}
                    className="p-1 rounded-full hover:bg-gold/20 text-gold transition-colors cursor-pointer shrink-0"
                    title="Cancel reply"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center ring-1 ring-black/10 dark:ring-white/10">
                  {user?.avatar && !user.avatar.startsWith('preset:') ? (
                    <Image
                      src={user.avatar}
                      alt="Current user"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized={Boolean(user.avatar.startsWith('data:') || user.avatar.includes('appwrite'))}
                    />
                  ) : (
                    renderAvatarIcon(user?.avatar, user?.name, 'w-4 h-4 text-gold')
                  )}
                </div>

                <div className="flex-1 flex items-center bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] focus-within:border-gold rounded-full px-4 py-1.5 transition-colors">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    placeholder={user ? (replyingToComment ? `Reply to @${replyingToComment.author}...` : 'Add a comment...') : 'Connect account to comment'}
                    disabled={!user}
                    className="w-full bg-transparent text-xs sm:text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!user || !newCommentText.trim()}
                    onClick={handleAddComment}
                    className="text-xs font-bold text-gold hover:text-gold-muted disabled:opacity-20 disabled:cursor-not-allowed transition-opacity cursor-pointer pl-2 shrink-0"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Followers / Following Modal (Minimalist Instagram Style) ─── */}
      {followModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1017] border border-black/[0.08] dark:border-white/[0.12] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-semibold text-sm text-slate-900 dark:text-white capitalize">
                {followModal.type}
              </span>
              <button
                type="button"
                onClick={() => setFollowModal(prev => ({ ...prev, open: false }))}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-3 space-y-1 scrollbar-thin">
              {followModal.loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading {followModal.type}...</div>
              ) : followModal.users.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No {followModal.type} yet.</div>
              ) : (
                followModal.users.map(u => (
                  <Link
                    key={u.handle}
                    href={`/community/${u.handle}`}
                    onClick={() => setFollowModal(prev => ({ ...prev, open: false }))}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center text-gold font-bold text-xs ring-1 ring-black/5 dark:ring-white/10">
                      {u.avatar && !u.avatar.startsWith('preset:') ? (
                        <Image src={u.avatar} alt={u.name} width={36} height={36} className="w-full h-full object-cover" />
                      ) : (
                        renderAvatarIcon(u.avatar, u.name, 'w-4 h-4 text-gold')
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        @{u.handle}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Social Media Share Post Modal ─── */}
      <SharePostModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false)
          setShareModalPost(null)
        }}
        post={shareModalPost}
      />
    </div>
  )
}
