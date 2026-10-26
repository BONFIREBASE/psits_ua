'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  ShieldCheck,
  Check,
  ShieldAlert,
  RotateCcw,
  Camera,
  X,
  ChevronDown,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  autoResolveStudentEligibilityAction,
  checkUsernameAvailabilityAction,
} from '@/app/community/actions'
import { detectProhibitedHandle } from '@/lib/community-validation'
import { compressImageToWebP } from '@/lib/image-compress'
import { appwriteStorage, APPWRITE_STORAGE_BUCKET_ID } from '@/lib/appwrite'
import { ID } from 'appwrite'

export interface CommunityUserProfile {
  email: string
  name: string
  username?: string
  avatar?: string
  yearSection?: string
  bio?: string
  hobbies?: string[]
  github?: string
  linkedin?: string
  portfolio?: string
  tosAccepted?: boolean
  tosAcceptedAt?: string
}

export interface CommunityOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  user: { email: string; name: string; avatar?: string } | null
  currentProfile: CommunityUserProfile | null
  onProfileUpdated: (profile: CommunityUserProfile) => void
  initialStep?: 1 | 2 | 3 | 4
  initialAuthMode?: 'create' | 'continue'
}

const FAQ_ITEMS = [
  {
    q: 'Why is an institutional student email required?',
    a: 'Community Hub is an exclusive academic platform for enrolled University of Antique CCIS students. Authenticating with your @antiquespride.edu.ph account verifies your student identity, keeps discussions strictly peer-to-peer, and eliminates spam and bots.',
  },
  {
    q: 'Will my student number or email address be public?',
    a: 'No. In compliance with R.A. 10173 (Data Privacy Act of 2012), your student number, email, and personal records remain strictly confidential and masked. Only your chosen public username (@username) and academic section are visible.',
  },
  {
    q: 'Can I customize my username and profile photo later?',
    a: 'Yes. You can upload a custom photo, switch back to your university Google photo, or update your bio and academic info anytime from your profile settings.',
  },
  {
    q: 'What kind of content belongs on Community Hub?',
    a: 'Capstone software architecture, programming questions, code debugging, lecture notes, lab guides, hackathon team searches, and CCIS announcements. Harassment or academic dishonesty violate our honor code.',
  },
]

export default function CommunityOnboardingModal(props: CommunityOnboardingModalProps) {
  useEffect(() => {
    if (!props.isOpen) return

    // Immediately blur active elements so mobile keyboard cannot hold focus over the onboarding card
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    const originalBodyOverflow = document.body.style.overflow
    const originalHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // Prevent background wheel and touch scrolling outside the active modal container
    const preventScroll = (e: TouchEvent | WheelEvent) => {
      const target = e.target as HTMLElement | null
      const scrollable = target?.closest('.overflow-y-auto')
      if (!scrollable) {
        e.preventDefault()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        props.onClose()
      }
    }

    window.addEventListener('wheel', preventScroll, { passive: false })
    window.addEventListener('touchmove', preventScroll, { passive: false })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalBodyOverflow
      document.documentElement.style.overflow = originalHtmlOverflow
      window.removeEventListener('wheel', preventScroll)
      window.removeEventListener('touchmove', preventScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [props.isOpen, props.onClose])

  if (!props.isOpen) return null

  return (
    <CommunityOnboardingModalContent
      key={`${props.user?.email || 'guest'}-${props.initialStep || 1}`}
      {...props}
    />
  )
}

function CommunityOnboardingModalContent({
  onClose,
  user,
  currentProfile,
  onProfileUpdated,
}: CommunityOnboardingModalProps) {
  const isSettingUpProfile = Boolean(user?.email)

  // Auth Loading & Error
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Profile Form States
  const [displayName, setDisplayName] = useState(() => currentProfile?.name || user?.name || '')
  const [username, setUsername] = useState(() => {
    const existing = currentProfile?.username ? currentProfile.username.replace(/^@+/, '').trim() : ''
    if (!existing) return ''
    const pii = detectProhibitedHandle(existing, user?.email, currentProfile?.name || user?.name)
    if (pii.prohibited) return ''
    return existing
  })

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_.]/g, '')
    setUsername(raw)
  }

  // Handle validation
  const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '')
  const piiCheck = detectProhibitedHandle(cleanUsername, user?.email, currentProfile?.name || user?.name)

  const syncError = !cleanUsername
    ? 'Required'
    : cleanUsername.length < 3
    ? 'Min 3 chars'
    : !/^[a-z0-9_.]+$/.test(cleanUsername)
    ? 'Letters, numbers, _, .'
    : cleanUsername.startsWith('.') || cleanUsername.endsWith('.') || cleanUsername.startsWith('_') || cleanUsername.endsWith('_')
    ? 'No leading/trailing . or _'
    : cleanUsername.includes('..') || cleanUsername.includes('__')
    ? 'No consecutive dots or _'
    : piiCheck.prohibited
    ? piiCheck.reason
    : ''

  const [asyncCheck, setAsyncCheck] = useState<{
    checking: boolean
    available: boolean
    error: string
    handle: string
  }>({
    checking: false,
    available: false,
    error: '',
    handle: '',
  })

  useEffect(() => {
    if (syncError || !cleanUsername) return

    let isMounted = true
    const timer = setTimeout(async () => {
      setAsyncCheck((prev) => ({ ...prev, checking: true }))
      try {
        const res = await checkUsernameAvailabilityAction(
          cleanUsername,
          user?.email,
          currentProfile?.name || user?.name
        )
        if (!isMounted) return
        setAsyncCheck({
          checking: false,
          available: Boolean(res.available),
          error: res.error || '',
          handle: cleanUsername,
        })
      } catch {
        if (!isMounted) return
        setAsyncCheck({
          checking: false,
          available: false,
          error: 'Validation error',
          handle: cleanUsername,
        })
      }
    }, 350)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [cleanUsername, syncError, user?.email, user?.name, currentProfile?.name])

  const isCheckingHandle = !syncError && (asyncCheck.checking || asyncCheck.handle !== cleanUsername)
  const isHandleValid = !syncError && !isCheckingHandle && asyncCheck.available && asyncCheck.handle === cleanUsername
  const handleStatusMessage = syncError
    ? syncError
    : isCheckingHandle
    ? 'Checking...'
    : isHandleValid
    ? 'Available'
    : asyncCheck.error || 'Unavailable'

  const [yearSection, setYearSection] = useState(() => currentProfile?.yearSection || 'BSIT')
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string>(() => {
    if (currentProfile?.avatar && !currentProfile.avatar.startsWith('preset:')) {
      return currentProfile.avatar
    }
    return ''
  })
  const [avatarMode, setAvatarMode] = useState<'google' | 'custom'>(() => {
    if (currentProfile?.avatar && currentProfile.avatar !== user?.avatar && !currentProfile.avatar.startsWith('preset:')) {
      return 'custom'
    }
    return 'google'
  })
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const [bio, setBio] = useState(() => currentProfile?.bio || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [eligibilityResult, setEligibilityResult] = useState<{
    verified: boolean
    isOfficer: boolean
    officerTitle?: string
    studentNo?: string
    name: string
    yearSection: string
    error?: string
  } | null>(null)

  // Auto-resolve CCIS Roster Verification
  useEffect(() => {
    if (!user?.email) return
    let isMounted = true

    autoResolveStudentEligibilityAction({
      email: user.email,
      googleName: user.name,
    })
      .then((res) => {
        if (!isMounted) return
        setEligibilityResult(res)
        if (res.verified) {
          if (res.name && (!currentProfile?.name || currentProfile.name === user.name)) {
            setDisplayName(res.name)
          }
          if (res.yearSection) {
            setYearSection(res.yearSection)
          }
        }
      })
      .catch(() => {
        // ignore
      })

    return () => {
      isMounted = false
    }
  }, [user?.email, user?.name, currentProfile?.name])

  // Custom Avatar Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const compressed = await compressImageToWebP(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 })
      const createdFile = await appwriteStorage.createFile(
        APPWRITE_STORAGE_BUCKET_ID,
        ID.unique(),
        compressed
      )
      const uploadedUrl = appwriteStorage.getFileView(APPWRITE_STORAGE_BUCKET_ID, createdFile.$id)
      setCustomAvatarUrl(uploadedUrl)
      setAvatarMode('custom')
    } catch {
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = ''
    }
  }

  // Google OAuth Trigger
  const handleGoogleSignIn = async () => {
    setAuthError(null)
    setIsSigningIn(true)
    try {
      const currentPath =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : '/community'
      const target = currentPath.startsWith('/community') ? currentPath : '/community'

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('psits_auth_redirect', target)
        localStorage.setItem('psits_auth_redirect', target)
      }

      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${target}`
          : ''

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            hd: 'antiquespride.edu.ph',
          },
          redirectTo: redirectUrl,
        },
      })

      if (error) {
        setAuthError(error.message)
      }
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize Google authentication.'
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  // Save Kasubay Profile
  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)

    try {
      const activeAvatar =
        avatarMode === 'custom' && customAvatarUrl
          ? customAvatarUrl
          : user.avatar || ''

      const verifiedYearSection = eligibilityResult?.yearSection || yearSection || 'BSIT'

      const cleanHandle = username.trim().replace(/^@+/, '').replace(/[^a-z0-9_.]/g, '')
      const formattedUsername = cleanHandle
        ? `@${cleanHandle}`
        : `@kasubay_${Math.floor(Math.random() * 8999 + 1000)}`

      const updatedData: CommunityUserProfile = {
        email: user.email,
        name: displayName.trim() || user.name,
        username: formattedUsername,
        avatar: activeAvatar,
        yearSection: verifiedYearSection,
        bio: bio.trim(),
        tosAccepted: true,
        tosAcceptedAt: new Date().toISOString(),
      }

      const safeAvatar = updatedData.avatar?.startsWith('data:') ? '' : (updatedData.avatar || '').slice(0, 1024)
      await supabase.auth.updateUser({
        data: {
          full_name: updatedData.name,
          community_username: updatedData.username,
          community_avatar: safeAvatar,
          year_section: updatedData.yearSection,
          student_no: eligibilityResult?.studentNo || undefined,
          roster_full_name: eligibilityResult?.name || undefined,
          identity_status: eligibilityResult?.verified ? 'verified_roster' : 'google_verified',
          bio: updatedData.bio,
          community_tos_accepted: true,
          community_tos_accepted_at: updatedData.tosAcceptedAt,
        },
      })

      try {
        localStorage.setItem(`psits_community_profile_${user.email}`, JSON.stringify(updatedData))
        localStorage.setItem('psits_community_tour_completed', 'true')
      } catch {
        // ignore
      }

      onProfileUpdated(updatedData)
      onClose()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div
      role="region"
      aria-label="Community Hub Access"
      className="fixed inset-0 z-[200] bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overscroll-contain"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault()
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-[#11141a] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-black/5 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-wider uppercase text-gold font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>CCIS Community Hub</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5 space-y-5">
          {/* ══════════════════════════════════════════════════════
              VIEW A: MINIMALIST GATEWAY WITH FAQ
             ══════════════════════════════════════════════════════ */}
          {!isSettingUpProfile ? (
            <div className="space-y-5">
              {/* Mission intro */}
              <div className="space-y-1.5">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                  Connect to Community
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Join discussions, debug code, and collaborate on Capstone with fellow BSIT students.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google Sign-in Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-3">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-white dark:bg-[#161B22] hover:bg-slate-50 dark:hover:bg-[#1C2128] border border-black/10 dark:border-white/15 hover:border-gold/50 text-slate-900 dark:text-white font-display font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Student Google Account'}</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>Restricted to university email</span>
                </div>
              </div>

              {/* System FAQ Section */}
              <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 dark:text-white/40 font-semibold block">
                  Frequently Asked Questions
                </span>

                <div className="divide-y divide-black/5 dark:divide-white/5">
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = openFaq === idx
                    return (
                      <div key={item.q} className="py-2.5">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between text-left gap-3 text-xs font-semibold text-slate-900 dark:text-white hover:text-gold dark:hover:text-gold transition-colors cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 dark:text-white/40 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-gold' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-2 animate-in fade-in duration-150">
                            {item.a}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Minimalist covenant link */}
              <div className="text-center text-[10px] text-slate-500 dark:text-slate-400">
                By connecting, you agree to our{' '}
                <a
                  href="/terms#community"
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold hover:underline underline-offset-2"
                >
                  Academic Code of Conduct
                </a>.
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════
                VIEW B: KASUBAY PROFILE SETUP (FOR NEW STUDENTS)
               ══════════════════════════════════════════════════════ */
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                  Kasubay Profile Setup
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Choose your public handle. Student ID numbers and personal emails are always confidential.
                </p>
              </div>

              {/* CCIS Roster Verification Badge */}
              {eligibilityResult && (
                <div className="py-2.5 px-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="font-semibold truncate">
                      {eligibilityResult.verified
                        ? `${eligibilityResult.yearSection || 'BSIT'} · Verified CCIS Roster`
                        : 'Google Student Account Verified'}
                    </span>
                  </div>
                  {eligibilityResult.studentNo && (
                    <span className="font-mono text-[10px] font-bold opacity-80 shrink-0">
                      {eligibilityResult.studentNo}
                    </span>
                  )}
                </div>
              )}

              {/* Avatar Selector Row */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-slate-900 ring-2 ring-gold/40 shrink-0 flex items-center justify-center">
                  {(avatarMode === 'custom' && customAvatarUrl) || (avatarMode === 'google' && user?.avatar) ? (
                    <Image
                      src={avatarMode === 'custom' && customAvatarUrl ? customAvatarUrl : user?.avatar || ''}
                      alt="Avatar"
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                      unoptimized={Boolean(customAvatarUrl?.startsWith('data:'))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold font-bold text-lg bg-slate-900">
                      {(displayName || user?.name || 'U').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-gold dark:hover:text-gold underline underline-offset-2 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? 'Uploading...' : 'Upload custom photo'}</span>
                    </button>

                    {user?.avatar && avatarMode === 'custom' && (
                      <button
                        type="button"
                        onClick={() => setAvatarMode('google')}
                        className="text-xs font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Use Google photo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    PNG, JPG, or WebP up to 5MB
                  </p>
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isCheckingHandle
                        ? 'text-slate-400'
                        : isHandleValid
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-gold'
                    }`}
                  >
                    {handleStatusMessage}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-gold select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="username"
                    className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold font-mono"
                  />
                </div>
              </div>

              {/* Academic Section */}
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold block">
                  Academic Section
                </label>
                <div className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gold shrink-0" />
                    <span className="font-semibold">{eligibilityResult?.yearSection || yearSection || 'BSIT'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">CCIS IT Major</span>
                </div>
              </div>

              {/* Bio Field */}
              <div className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold block">
                  Short Bio (Optional)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  placeholder="e.g. 3rd year IT student focusing on web and mobile development..."
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold resize-none leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!isHandleValid || isCheckingHandle || isSavingProfile}
                  onClick={handleSaveProfile}
                  className="w-full py-3 px-5 rounded-xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isSavingProfile ? 'Saving Profile...' : 'Save & Enter Community'}</span>
                  <Check className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
