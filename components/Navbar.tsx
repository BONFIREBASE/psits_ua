'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ShoppingBag, Sun, Moon, User, FileText, Settings, LogOut, ChevronDown, Bell, CheckCheck, Sparkles } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from '@/components/ThemeProvider'
import { supabase } from '@/lib/supabase'
import { appwrite, APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } from '@/lib/appwrite'
import {
  getMyNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
  type CommunityNotificationItem,
} from '@/app/community/actions'

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/officers', label: 'Officers' },
  { href: '/community', label: 'Community' },
  { href: '/projects', label: 'Projects' },
]

function InstagramVerifiedBadge({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Verified"
      className={`${className} shrink-0 text-amber-400 inline-block align-middle select-none drop-shadow-sm`}
      fill="currentColor"
    >
      <title>Verified</title>
      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6s-2.95.875-3.6 2.148c-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5s.875 2.95 2.148 3.6c-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148s2.95-.875 3.6-2.148c.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z" />
      <path d="M10.2 16.2 6.5 12.5l1.4-1.4 2.3 2.3 6-6 1.4 1.4z" className="fill-slate-950 dark:fill-[#0c1017]" />
    </svg>
  )
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const isCommunity = pathname === '/community' || pathname.startsWith('/community')
  const isMerchActive = pathname === '/merch' || pathname.startsWith('/merch/')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string | null>(null)
  const [communityUser, setCommunityUser] = useState<{
    name: string
    username?: string
    avatar?: string
    email?: string
    isVerified?: boolean
  } | null>(null)

  const [notifications, setNotifications] = useState<CommunityNotificationItem[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const notifDropdownRef = useRef<HTMLDivElement>(null)
  const mobileNotifDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isCommunity) return

    const loadUser = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {}
          const isOfficer = meta.role === 'officer' || meta.role === 'admin'
          const isVerified = Boolean(isOfficer || meta.is_verified || meta.community_tos_accepted)
          setCommunityUser({
            name: meta.full_name || session.user.email?.split('@')[0] || 'Student',
            username: meta.community_username || '',
            avatar: meta.community_avatar || meta.avatar_url || '',
            email: session.user.email || '',
            isVerified,
          })
        } else {
          setCommunityUser(null)
        }
      }).catch(() => setCommunityUser(null))
    }

    loadUser()

    const handleProfileUpdate = () => loadUser()
    window.addEventListener('psits:profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('psits:profile-updated', handleProfileUpdate)
  }, [isCommunity])

  const myHandleNormalized = (communityUser?.username || communityUser?.name || '')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_.]/g, '')

  useEffect(() => {
    if (!myHandleNormalized) return
    let ignore = false

    const fetchNotifs = async () => {
      const res = await getMyNotificationsAction({
        userHandle: myHandleNormalized,
        userEmail: communityUser?.email,
        limit: 25,
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
        const myEmail = (communityUser?.email || '').toLowerCase().trim()

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
          try {
            navigator.vibrate?.([40, 50, 40])
          } catch {}
        }

        if (events.some(e => e.includes('.update'))) {
          void fetchNotifs()
        }
      })
    } catch (err) {
      console.warn('Navbar notification subscription error:', err)
    }

    return () => {
      ignore = true
      if (unsubscribe) unsubscribe()
    }
  }, [myHandleNormalized, communityUser?.email])

  const handleNotificationClick = async (item: CommunityNotificationItem) => {
    if (!item.is_read) {
      setNotifications(prev => prev.map(n => (n.$id === item.$id ? { ...n, is_read: true } : n)))
      setUnreadNotifCount(prev => Math.max(0, prev - 1))
      await markNotificationAsReadAction(item.$id)
    }
    setNotifDropdownOpen(false)

    if (item.type === 'follow') {
      router.push(`/community/${item.actor_handle}`)
      return
    }

    if (item.post_id) {
      if (pathname.startsWith('/community')) {
        window.dispatchEvent(new CustomEvent('psits:open-post', { detail: { postId: item.post_id } }))
        const el = document.getElementById(`post-${item.post_id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        router.push(`/community?post=${item.post_id}`)
      }
    }
  }

  const handleMarkAllNotifsRead = async () => {
    if (!myHandleNormalized) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadNotifCount(0)
    await markAllNotificationsAsReadAction(myHandleNormalized)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { resolvedTheme, toggleTheme } = useTheme()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const mobileProfileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target) &&
        mobileProfileMenuRef.current &&
        !mobileProfileMenuRef.current.contains(target)
      ) {
        setProfileMenuOpen(false)
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(target) &&
        mobileNotifDropdownRef.current &&
        !mobileNotifDropdownRef.current.contains(target)
      ) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setOpen(false)
    setProfileMenuOpen(false)
    setNotifDropdownOpen(false)
  }

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      window.addEventListener('keydown', onKeyDown)
    }
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[130] flex justify-center pointer-events-none px-4 pt-3 sm:pt-4">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`
            pointer-events-auto
            relative flex items-center justify-between
            w-full max-w-3xl
            h-12 sm:h-14
            px-3 sm:px-4
            rounded-full
            border
            transition-all duration-500 ease-out
            ${scrolled
              ? 'bg-white/85 dark:bg-[#0D1117]/85 backdrop-blur-xl border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.18),0_12px_36px_rgba(0,0,0,0.6),0_0_20px_rgba(245,166,35,0.06)]'
              : 'bg-white/70 dark:bg-[#0D1117]/60 backdrop-blur-md border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_4px_24px_rgba(0,0,0,0.3)]'
            }
          `}
        >
          {/* Specular glass rim highlight */}
          <div
            aria-hidden="true"
            className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent pointer-events-none rounded-full"
          />

          {/* Brand Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 shrink-0 pl-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-full"
            aria-label="PSITS-UA Home"
          >
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Image
                src="/assets/logo/PSITS logo.png"
                alt="PSITS-UA"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
            </motion.div>
            <span className="font-display font-bold text-[14px] sm:text-[15px] tracking-tight text-slate-900 dark:text-white select-none">
              PSITS<span className="text-gold">-U</span><span className="text-[#E63946]">A</span>
            </span>
          </Link>

          {/* Desktop Nav Links & Theme Toggle */}
          <div className="hidden md:flex items-center gap-1.5">
            <ul
              className="flex items-center gap-1"
              onMouseLeave={() => setHoveredPath(null)}
            >
              {links.map(({ href, label }) => {
                const isActive = pathname === href

                return (
                  <li key={href} className="relative">
                    <Link
                      href={href}
                      onMouseEnter={() => setHoveredPath(href)}
                      className={`
                        relative z-10 block px-3.5 py-1.5 rounded-full text-[13px] font-medium
                        transition-colors duration-200 select-none
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
                        ${isActive
                          ? 'text-[#0D1117] font-semibold'
                          : 'text-slate-600 hover:text-slate-900 dark:text-white/75 dark:hover:text-white'
                        }
                      `}
                    >
                      {label}
                    </Link>

                    {/* Sliding active pill indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-active-pill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F5A623] to-[#FFA726] shadow-[0_2px_12px_rgba(245,166,35,0.4)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}

                    {/* Hover highlight */}
                    {hoveredPath === href && !isActive && (
                      <motion.div
                        layoutId="navbar-hover-pill"
                        className="absolute inset-0 rounded-full bg-black/[0.05] dark:bg-white/[0.08]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="w-[1px] h-4 bg-black/10 dark:bg-white/15 mx-1" />

            {/* Desktop Merch & Theme OR Community Student Profile */}
            {isCommunity ? (
              <div className="relative flex items-center gap-2 pl-0.5">
                {communityUser && (
                  <div className="relative" ref={notifDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false)
                        setNotifDropdownOpen(prev => !prev)
                      }}
                      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        notifDropdownOpen
                          ? 'bg-gold/20 text-gold ring-1 ring-gold/40'
                          : 'text-slate-600 dark:text-slate-300 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                      title="Notifications"
                      aria-label="Notifications"
                    >
                      <Bell size={16} />
                      {unreadNotifCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
                          {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                        </span>
                      )}
                    </button>

                    {/* Desktop Smart Dropdown */}
                    <AnimatePresence>
                      {notifDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-80 max-h-96 rounded-2xl bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-2.5 space-y-1.5 z-50 flex flex-col"
                        >
                          <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                              <Bell size={14} className="text-gold" />
                              <span>Notifications</span>
                              {unreadNotifCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-gold/20 text-gold border border-gold/30">
                                  {unreadNotifCount}
                                </span>
                              )}
                            </div>
                            {unreadNotifCount > 0 && (
                              <button
                                type="button"
                                onClick={handleMarkAllNotifsRead}
                                className="text-[10px] text-slate-500 hover:text-gold flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                              >
                                <CheckCheck size={12} />
                                <span>Mark read</span>
                              </button>
                            )}
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                            {notifications.length === 0 ? (
                              <div className="py-8 text-center space-y-1">
                                <Sparkles size={18} className="text-gold mx-auto" />
                                <div className="text-[11px] font-semibold text-slate-700 dark:text-white/80">All caught up!</div>
                                <p className="text-[10px] text-slate-400">No unread notifications.</p>
                              </div>
                            ) : (
                              notifications.map(item => (
                                <div
                                  key={item.$id}
                                  onClick={() => handleNotificationClick(item)}
                                  className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                                    !item.is_read
                                      ? 'bg-gold/[0.08] dark:bg-gold/[0.12] hover:bg-gold/15'
                                      : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                                  }`}
                                >
                                  <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs">
                                    {item.actor_avatar && !item.actor_avatar.startsWith('preset:') ? (
                                      <Image src={item.actor_avatar} alt="Actor" width={32} height={32} className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{item.actor_name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                                      <span className="font-bold text-slate-900 dark:text-white">{item.actor_name}</span>{' '}
                                      <span className="text-slate-600 dark:text-slate-300">{item.summary}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-slate-400">
                                      <span>{timeAgo(item.$createdAt)}</span>
                                      {!item.is_read && <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="relative" ref={profileMenuRef}>
                  {communityUser ? (
                    <>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(prev => !prev)}
                      className={`flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-subtle hover:bg-gold/15 border transition-all text-xs font-mono cursor-pointer group shadow-sm ${
                        profileMenuOpen ? 'border-gold bg-gold/15 text-gold' : 'border-gold/30 hover:border-gold'
                      }`}
                      title="Student Profile & Settings"
                      aria-expanded={profileMenuOpen}
                    >
                      <div className="w-5 h-5 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-[10px] overflow-hidden shrink-0">
                        {communityUser.avatar && !communityUser.avatar.startsWith('preset:') ? (
                          <Image
                            src={communityUser.avatar}
                            alt="Avatar"
                            width={20}
                            height={20}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{communityUser.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-gold transition-colors max-w-[90px] truncate text-[11px]">
                        {communityUser.username
                          ? (communityUser.username.startsWith('@') ? communityUser.username : `@${communityUser.username}`)
                          : communityUser.name}
                      </span>
                      <ChevronDown size={11} className={`text-slate-400 group-hover:text-gold transition-transform duration-200 ${profileMenuOpen ? 'rotate-180 text-gold' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-surface border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-2.5 space-y-1.5 z-50 backdrop-blur-xl"
                        >
                          {/* Student Details Header (Clickable Link to Profile) */}
                          <Link
                            href={`/community/${(communityUser.username || communityUser.name || 'kasubay').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')}`}
                            onClick={() => setProfileMenuOpen(false)}
                            className="p-2.5 rounded-xl bg-surface-subtle hover:bg-gold/10 border border-black/[0.04] dark:border-white/[0.06] hover:border-gold/30 flex items-center gap-2.5 transition-all cursor-pointer group"
                            title="View your public profile"
                          >
                            <div className="relative shrink-0 w-8 h-8">
                              <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs shrink-0 overflow-hidden">
                                {communityUser.avatar && !communityUser.avatar.startsWith('preset:') ? (
                                  <Image
                                    src={communityUser.avatar}
                                    alt="Avatar"
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{communityUser.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              {communityUser.isVerified && (
                                <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#161b22] bg-white dark:bg-[#161b22] flex items-center justify-center pointer-events-none shadow-sm">
                                  <InstagramVerifiedBadge className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                {communityUser.name}
                              </div>
                              <div className="text-[10px] font-mono text-gold truncate">
                                {communityUser.username
                                  ? (communityUser.username.startsWith('@') ? communityUser.username : `@${communityUser.username}`)
                                  : '@kasubay'}
                              </div>
                            </div>
                          </Link>

                          {/* Quick Dark / Light Mode Switcher */}
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-subtle border border-black/[0.04] dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-white/80">
                              {resolvedTheme === 'dark' ? <Moon size={13} className="text-gold" /> : <Sun size={13} className="text-gold" />}
                              <span>Appearance</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTheme()}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-black/[0.08] dark:border-white/10 hover:border-gold/40 text-[10px] font-mono font-semibold text-slate-800 dark:text-slate-200 hover:text-gold transition-all cursor-pointer shadow-xs capitalize"
                            >
                              {resolvedTheme} mode
                            </button>
                          </div>

                          <div className="w-full h-[1px] bg-black/[0.06] dark:bg-white/[0.06] my-1" />

                          {/* Action Items */}
                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              window.dispatchEvent(new CustomEvent('psits:open-profile'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold/15 text-slate-700 dark:text-white/80 hover:text-gold transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <User size={14} className="text-gold" />
                            <span>Edit Student Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              window.dispatchEvent(new CustomEvent('psits:filter-my-posts'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold/15 text-slate-700 dark:text-white/80 hover:text-gold transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <FileText size={14} className="text-gold" />
                            <span>View My Posts</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              window.dispatchEvent(new CustomEvent('psits:open-onboarding'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold/15 text-slate-700 dark:text-white/80 hover:text-gold transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <Settings size={14} className="text-gold" />
                            <span>Tour & Community Guide</span>
                          </button>

                          <div className="w-full h-[1px] bg-black/[0.06] dark:bg-white/[0.06] my-1" />

                          <button
                            type="button"
                            onClick={async () => {
                              setProfileMenuOpen(false)
                              await supabase.auth.signOut()
                              setCommunityUser(null)
                              window.dispatchEvent(new CustomEvent('psits:profile-updated'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/15 text-rose-500 transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Disconnect Account</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <ThemeToggle size={17} />
                )}
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Merch Store Utility Link */}
                <Link
                  href="/merch"
                  className={`
                    relative p-2 rounded-full transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
                    ${isMerchActive
                      ? 'text-gold bg-gold/15 drop-shadow-[0_0_10px_rgba(245,166,35,0.4)]'
                      : 'text-slate-600 hover:text-slate-900 dark:text-white/75 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08]'
                    }
                  `}
                  title="Official Merch Store"
                  aria-label="Official Merch Store"
                >
                  <ShoppingBag size={17} />
                  <span className="sr-only">Official Merch Store</span>
                </Link>

                <ThemeToggle size={17} />
              </>
            )}
          </div>

          {/* Mobile Right Controls: Notification Bell + Profile + Menu Toggle */}
          <div className="flex items-center gap-1.5 md:hidden">
            {isCommunity && communityUser && (
              <div className="relative" ref={mobileNotifDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false)
                    setNotifDropdownOpen(prev => !prev)
                  }}
                  className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    notifDropdownOpen
                      ? 'bg-gold/20 text-gold ring-1 ring-gold/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-gold hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell size={15} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rose-500 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow-xs">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Mobile Smart Dropdown */}
                <AnimatePresence>
                  {notifDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="fixed inset-x-3 top-16 max-h-[72vh] rounded-2xl bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-2.5 space-y-1.5 z-50 flex flex-col"
                    >
                      <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                          <Bell size={13} className="text-gold" />
                          <span>Notifications</span>
                          {unreadNotifCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-gold/20 text-gold border border-gold/30">
                              {unreadNotifCount}
                            </span>
                          )}
                        </div>
                        {unreadNotifCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllNotifsRead}
                            className="text-[10px] text-slate-500 hover:text-gold flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                          >
                            <CheckCheck size={12} />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center space-y-1">
                            <Sparkles size={18} className="text-gold mx-auto" />
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-white/80">All caught up!</div>
                            <p className="text-[10px] text-slate-400">No unread notifications.</p>
                          </div>
                        ) : (
                          notifications.map(item => (
                            <div
                              key={item.$id}
                              onClick={() => handleNotificationClick(item)}
                              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 ${
                                !item.is_read
                                  ? 'bg-gold/[0.08] dark:bg-gold/[0.12] hover:bg-gold/15'
                                  : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs">
                                {item.actor_avatar && !item.actor_avatar.startsWith('preset:') ? (
                                  <Image src={item.actor_avatar} alt="Actor" width={32} height={32} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{item.actor_name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                                  <span className="font-bold text-slate-900 dark:text-white">{item.actor_name}</span>{' '}
                                  <span className="text-slate-600 dark:text-slate-300">{item.summary}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-slate-400">
                                  <span>{timeAgo(item.$createdAt)}</span>
                                  {!item.is_read && <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {isCommunity ? (
              <div className="relative" ref={mobileProfileMenuRef}>
                {communityUser ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(prev => !prev)}
                      className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs overflow-hidden cursor-pointer"
                      title="Student Profile"
                      aria-expanded={profileMenuOpen}
                    >
                      {communityUser.avatar && !communityUser.avatar.startsWith('preset:') ? (
                        <Image src={communityUser.avatar} alt="Avatar" width={28} height={28} className="w-full h-full object-cover" />
                      ) : (
                        <span>{communityUser.name.charAt(0).toUpperCase()}</span>
                      )}
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-surface border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-2.5 space-y-1.5 z-50 backdrop-blur-xl"
                        >
                          {/* Student Details Header (Clickable Link to Profile) */}
                          <Link
                            href={`/community/${(communityUser.username || communityUser.name || 'kasubay').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '')}`}
                            onClick={() => setProfileMenuOpen(false)}
                            className="p-2.5 rounded-xl bg-surface-subtle hover:bg-gold/10 border border-black/[0.04] dark:border-white/[0.06] hover:border-gold/30 flex items-center gap-2.5 transition-all cursor-pointer group"
                            title="View your public profile"
                          >
                            <div className="relative shrink-0 w-8 h-8">
                              <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs shrink-0 overflow-hidden">
                                {communityUser.avatar && !communityUser.avatar.startsWith('preset:') ? (
                                  <Image
                                    src={communityUser.avatar}
                                    alt="Avatar"
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{communityUser.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              {communityUser.isVerified && (
                                <div className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#161b22] bg-white dark:bg-[#161b22] flex items-center justify-center pointer-events-none shadow-sm">
                                  <InstagramVerifiedBadge className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                {communityUser.name}
                              </div>
                              <div className="text-[10px] font-mono text-gold truncate">
                                {communityUser.username
                                  ? (communityUser.username.startsWith('@') ? communityUser.username : `@${communityUser.username}`)
                                  : '@kasubay'}
                              </div>
                            </div>
                          </Link>

                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-subtle border border-black/[0.04] dark:border-white/[0.06]">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-white/80">
                              {resolvedTheme === 'dark' ? <Moon size={13} className="text-gold" /> : <Sun size={13} className="text-gold" />}
                              <span>Appearance</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleTheme()}
                              className="px-2.5 py-1 rounded-lg bg-surface border border-black/[0.08] dark:border-white/10 hover:border-gold/40 text-[10px] font-mono font-semibold text-slate-800 dark:text-slate-200 hover:text-gold transition-all cursor-pointer shadow-xs capitalize"
                            >
                              {resolvedTheme} mode
                            </button>
                          </div>

                          <div className="w-full h-[1px] bg-black/[0.06] dark:bg-white/[0.06] my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              window.dispatchEvent(new CustomEvent('psits:open-profile'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold/15 text-slate-700 dark:text-white/80 hover:text-gold transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <User size={14} className="text-gold" />
                            <span>Edit Student Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              window.dispatchEvent(new CustomEvent('psits:filter-my-posts'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold/15 text-slate-700 dark:text-white/80 hover:text-gold transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <FileText size={14} className="text-gold" />
                            <span>View My Posts</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfileMenuOpen(false)
                              window.dispatchEvent(new CustomEvent('psits:open-onboarding'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gold/15 text-slate-700 dark:text-white/80 hover:text-gold transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <Settings size={14} className="text-gold" />
                            <span>Tour & Community Guide</span>
                          </button>

                          <div className="w-full h-[1px] bg-black/[0.06] dark:bg-white/[0.06] my-1" />

                          <button
                            type="button"
                            onClick={async () => {
                              setProfileMenuOpen(false)
                              await supabase.auth.signOut()
                              setCommunityUser(null)
                              window.dispatchEvent(new CustomEvent('psits:profile-updated'))
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/15 text-rose-500 transition-colors text-xs font-medium text-left cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Disconnect Account</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <ThemeToggle size={18} />
                )}
              </div>
            ) : (
              <ThemeToggle size={18} />
            )}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="
                p-2 rounded-full
                text-gold hover:bg-black/5 dark:hover:bg-white/[0.08]
                transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60
                cursor-pointer select-none
              "
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="pointer-events-none"
                  >
                    <X size={20} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="pointer-events-none"
                  >
                    <Menu size={20} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.nav>
      </header>

      {/* Mobile Menu Overlay & Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[125] bg-black/40 dark:bg-black/75 backdrop-blur-md md:hidden pointer-events-auto"
          />
        )}

        {open && (
          <motion.div
            key="nav-menu"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-20 left-4 right-4 z-[128] md:hidden pointer-events-auto"
          >
            <div className="
              relative overflow-hidden
              bg-white/95 dark:bg-[#0D1117]/95 backdrop-blur-xl
              border border-black/10 dark:border-white/10
              rounded-2xl p-3
              shadow-[0_16px_48px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_16px_48px_rgba(0,0,0,0.6)]
            ">
              <ul className="flex flex-col gap-1">
                {links.map(({ href, label }) => {
                  const isActive = pathname === href

                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className={`
                          block px-4 py-3 rounded-xl text-[15px] font-medium
                          transition-all duration-200
                          ${isActive
                            ? 'bg-gradient-to-r from-[#F5A623] to-[#FFA726] text-[#0D1117] font-semibold shadow-[0_4px_14px_rgba(245,166,35,0.35)]'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-black/[0.04] dark:text-white/85 dark:hover:text-white dark:hover:bg-white/[0.06]'
                          }
                        `}
                      >
                        {label}
                      </Link>
                    </li>
                  )
                })}

                {/* Mobile Drawer Official Merch Link */}
                <div className="my-1 border-t border-black/5 dark:border-white/10" />
                <li>
                  <Link
                    href="/merch"
                    onClick={() => setOpen(false)}
                    className={`
                      flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium
                      transition-all duration-200
                      ${isMerchActive
                        ? 'bg-gradient-to-r from-[#F5A623] to-[#FFA726] text-[#0D1117] font-semibold shadow-[0_4px_14px_rgba(245,166,35,0.35)]'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-black/[0.04] dark:text-white/85 dark:hover:text-white dark:hover:bg-white/[0.06]'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={17} className={isMerchActive ? 'text-slate-950' : 'text-gold'} />
                      <span>Official Merch</span>
                    </span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                      isMerchActive ? 'bg-slate-950/15 text-slate-950' : 'bg-gold/15 text-gold'
                    }`}>
                      Store
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

