'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Globe,
  GraduationCap,
  ShieldAlert,
  RotateCcw,
  Camera,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  autoResolveStudentEligibilityAction,
  checkUsernameAvailabilityAction,
} from '@/app/community/actions'
import { detectProhibitedHandle } from '@/lib/community-validation'
import { compressImageToWebP } from '@/lib/image-compress'

function GithubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function LinkedinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.95 0-1.68.73-1.68 1.68s.73 1.68 1.68 1.68 1.68-.73 1.68-1.68-.73-1.68-1.68-1.68z" />
    </svg>
  )
}

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

interface CommunityOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  user: { email: string; name: string; avatar?: string } | null
  currentProfile: CommunityUserProfile | null
  onProfileUpdated: (profile: CommunityUserProfile) => void
  initialStep?: 1 | 2 | 3 | 4
}


const AVAILABLE_INTERESTS_HOBBIES = [
  'Gaming & Esports',
  'Programming',
  'Visual Arts & Design',
  'Music & Audio',
  'Singing',
  'Dancing',
  'Photography',
  'Videography & Editing',
  'Creative Writing',
  'Anime & Pop Culture',
  'Fitness & Sports',
  'Content Creation',
]

export default function CommunityOnboardingModal(props: CommunityOnboardingModalProps) {
  if (!props.isOpen) return null

  return (
    <CommunityOnboardingModalContent
      key={`${props.user?.email || 'guest'}-${props.initialStep}`}
      {...props}
    />
  )
}

function CommunityOnboardingModalContent({
  onClose,
  user,
  currentProfile,
  onProfileUpdated,
  initialStep = 1,
}: CommunityOnboardingModalProps) {
  // Always respects initialStep (defaults to 1 so the user experiences the full tour from scratch)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => initialStep)

  // Compliance Checkbox States
  const [agreeConduct, setAgreeConduct] = useState(false)
  const [agreeAudit, setAgreeAudit] = useState(false)
  const [agreeTos, setAgreeTos] = useState(false)

  // Auth Loading
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Profile Form States
  const [displayName, setDisplayName] = useState(() => currentProfile?.name || user?.name || '')
  // Do NOT auto-default to an ID/email prefix - let user type their own handle
  // Automatically clear any prohibited legacy student ID or email prefix so input starts completely blank
  const [username, setUsername] = useState(() => {
    const existing = currentProfile?.username ? currentProfile.username.replace(/^@/, '').trim() : ''
    if (!existing) return ''
    const pii = detectProhibitedHandle(existing, user?.email, currentProfile?.name || user?.name)
    if (pii.prohibited) return ''
    return existing
  })

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_.]/g, '')
    setUsername(raw)
  }

  // 1. Synchronous validation derived directly during render (zero cascading renders!)
  const cleanUsername = username.trim().toLowerCase().replace(/^@/, '')
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

  // 2. Asynchronous server validation state (only updated in async network callbacks)
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

  // Debounced server validation when synchronous validation passes
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

  // Computed handle status
  const isCheckingHandle = !syncError && (asyncCheck.checking || asyncCheck.handle !== cleanUsername)
  const isHandleValid = !syncError && !isCheckingHandle && asyncCheck.available && asyncCheck.handle === cleanUsername
  const handleStatusMessage = syncError
    ? syncError
    : isCheckingHandle
    ? 'Checking...'
    : isHandleValid
    ? '✓ Available'
    : `✕ ${asyncCheck.error || 'Unavailable'}`

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
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(
    () => currentProfile?.hobbies || ['Gaming & Esports', 'Programming']
  )
  const [githubUrl, setGithubUrl] = useState(() => currentProfile?.github || '')
  const [linkedinUrl, setLinkedinUrl] = useState(() => currentProfile?.linkedin || '')
  const [portfolioUrl, setPortfolioUrl] = useState(() => currentProfile?.portfolio || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSubStep, setProfileSubStep] = useState<1 | 2 | 3 | 4>(1)
  const [eligibilityResult, setEligibilityResult] = useState<{
    verified: boolean
    isOfficer: boolean
    officerTitle?: string
    studentNo?: string
    name: string
    yearSection: string
    error?: string
  } | null>(null)

  // Background automated CCIS student verification (Zero user typing)
  useEffect(() => {
    if (!user?.email) return
    let isMounted = true

    autoResolveStudentEligibilityAction({
      email: user.email,
      googleName: user.name,
    }).then((res) => {
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
    }).catch(() => {
      // ignore
    })

    return () => {
      isMounted = false
    }
  }, [user?.email, user?.name, currentProfile?.name])

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP).')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const compressed = await compressImageToWebP(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 })
      const reader = new FileReader()
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string
        setCustomAvatarUrl(previewUrl)
        setAvatarMode('custom')
      }
      reader.readAsDataURL(compressed)
    } catch (err) {
      console.error('Avatar processing error:', err)
    } finally {
      setIsUploadingAvatar(false)
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = ''
    }
  }

  // All 3 required checkboxes satisfied?
  const allAgreed = agreeConduct && agreeAudit && agreeTos

  const handleSelectAllCompliance = () => {
    const nextState = !allAgreed
    setAgreeConduct(nextState)
    setAgreeAudit(nextState)
    setAgreeTos(nextState)
  }

  // Google OAuth Login
  const handleGoogleSignIn = async () => {
    setAuthError(null)
    setIsSigningIn(true)
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/community?setup=1`
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

  // Toggle skill / hobby tag
  const toggleHobby = (hobby: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    )
  }

  // Save profile setup
  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)

    try {
      const activeAvatar = avatarMode === 'custom' && customAvatarUrl
        ? customAvatarUrl
        : (user.avatar || '')

      const verifiedYearSection = eligibilityResult?.yearSection || yearSection || 'BSIT'

      const formattedUsername = username.trim()
        ? (username.trim().startsWith('@') ? username.trim() : `@${username.trim()}`)
        : `@kasubay_${Math.floor(Math.random() * 8999 + 1000)}`

      const updatedData: CommunityUserProfile = {
        email: user.email,
        name: displayName.trim() || user.name,
        username: formattedUsername,
        avatar: activeAvatar,
        yearSection: verifiedYearSection,
        bio: bio.trim(),
        hobbies: selectedHobbies,
        github: githubUrl.trim(),
        linkedin: linkedinUrl.trim(),
        portfolio: portfolioUrl.trim(),
        tosAccepted: true,
        tosAcceptedAt: new Date().toISOString(),
      }

      // Persist to Supabase User Metadata
      await supabase.auth.updateUser({
        data: {
          full_name: updatedData.name,
          community_username: updatedData.username,
          community_avatar: updatedData.avatar,
          year_section: updatedData.yearSection,
          bio: updatedData.bio,
          hobbies: updatedData.hobbies,
          social_github: updatedData.github,
          social_linkedin: updatedData.linkedin,
          social_portfolio: updatedData.portfolio,
          community_tos_accepted: true,
          community_tos_accepted_at: updatedData.tosAcceptedAt,
        },
      })

      // Cache locally for 0ms reads
      try {
        localStorage.setItem(
          `psits_community_profile_${user.email}`,
          JSON.stringify(updatedData)
        )
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

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [step])

  return (
    <div
      ref={scrollContainerRef}
      role="region"
      aria-label="Community Student Onboarding"
      className="fixed inset-0 z-[100] bg-canvas text-slate-900 dark:text-white overflow-y-auto pt-28 sm:pt-36 pb-24 selection:bg-gold/20 selection:text-gold"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-10 sm:space-y-12 animate-in fade-in duration-300">
        {/* ─── iOS Segmented Step Indicator (Minimalist bar directly on canvas) ─── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-slate-400 dark:text-white/40">
            {step < 4 ? (
              <>
                <span>Community Onboarding</span>
                <span className="text-gold font-bold">Step {step} of 4</span>
              </>
            ) : (
              <>
                <span className="truncate max-w-[200px] sm:max-w-none text-slate-500 dark:text-white/50">{user?.email || 'Student Account'}</span>
                <span className="text-gold font-bold">Profile Setup · {profileSubStep} of 4</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {step < 4 ? (
              [1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStep(s as 1 | 2 | 3 | 4)}
                  className={`h-2 rounded-full flex-1 transition-all duration-300 cursor-pointer ${
                    step >= s
                      ? 'bg-gold shadow-[0_0_10px_rgba(245,166,35,0.45)]'
                      : 'bg-black/[0.08] dark:bg-white/[0.1] hover:bg-gold/30'
                  }`}
                  title={`Jump to Step ${s}`}
                />
              ))
            ) : (
              [1, 2, 3, 4].map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setProfileSubStep(sub as 1 | 2 | 3 | 4)}
                  className={`h-2 rounded-full flex-1 transition-all duration-300 cursor-pointer ${
                    profileSubStep >= sub
                      ? 'bg-gold shadow-[0_0_10px_rgba(245,166,35,0.45)]'
                      : 'bg-black/[0.08] dark:bg-white/[0.1] hover:bg-gold/30'
                  }`}
                  title={`Stage ${sub} of 4`}
                />
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            STEP 1: THE REAL PURPOSE OF COMMUNITY
           ═══════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-10">
            {/* Mission Header */}
            <div className="space-y-4 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-mono text-xs text-amber-600 dark:text-gold uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
                <span>05 / College of Computing and Information Sciences · Student Exchange</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold/70 animate-pulse" />
              </span>
              <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-900 dark:text-white tracking-tight uppercase leading-[1.05]">
                Why We Built The <span className="text-gold">Community Hub</span>
              </h1>
              <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
                Messenger group chats are chaotic, files expire, and students hesitate to ask programming questions in public. The PSITS Community is our permanent, searchable academic platform built exclusively for BSIT students.
              </p>
            </div>

            {/* Minimalist Editorial Purpose List (No bento boxes, no box cards) */}
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] border-y border-black/[0.06] dark:border-white/[0.08]">
              {/* Pillar 1 */}
              <div className="py-7 sm:py-8 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                <span className="font-mono text-xs text-gold font-bold tracking-widest shrink-0 sm:pt-1">
                  01 / CAPSTONE &amp; CODE
                </span>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                    Technical Discussion &amp; Architecture
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed max-w-2xl">
                    Debug logic errors, share database schemas, and discuss software architectures across Java, Python, PHP, Next.js, and Mobile apps without getting swallowed by group chat memes.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="py-7 sm:py-8 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                <span className="font-mono text-xs text-gold font-bold tracking-widest shrink-0 sm:pt-1">
                  02 / PEER COLLABORATION
                </span>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                    Ask Technical Questions &amp; Debug Together
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed max-w-2xl">
                    Stuck on a tricky algorithm, database query, or lab exercise? Post your questions, code snippets, and Capstone challenges to get guidance from senior batchmates and peers.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="py-7 sm:py-8 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8">
                <span className="font-mono text-xs text-gold font-bold tracking-widest shrink-0 sm:pt-1">
                  03 / PERSISTENT NOTES
                </span>
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-display font-black text-lg sm:text-xl text-slate-900 dark:text-white uppercase tracking-tight">
                    Zero Data Waste &amp; Offline Viewing
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed max-w-2xl">
                    Lecture slide PDFs, syllabus modules, and code notes cache locally in 0ms so you can review threads even when campus Wi-Fi drops or cellular signal is weak.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-6 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Continue to Code of Conduct</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 2: COMMUNITY CODE OF CONDUCT & COMPLIANCE
           ═══════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-10">
            <div className="space-y-4 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-mono text-xs text-amber-600 dark:text-gold uppercase tracking-[0.2em] font-semibold">
                Step 2 of 4 · Academic Covenant
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight uppercase leading-[1.05]">
                Community <span className="text-gold">Code of Conduct</span>
              </h2>
              <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
                To keep this space safe, educational, and productive for all BSIT students, check each covenant to proceed with account connection.
              </p>
            </div>

            {/* Checkbox Group */}
            <div className="space-y-5 sm:space-y-6">
              {/* Check 1 */}
              <div
                role="checkbox"
                aria-checked={agreeConduct}
                tabIndex={0}
                onClick={() => setAgreeConduct(!agreeConduct)}
                onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setAgreeConduct(!agreeConduct)}
                className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer flex items-start gap-5 select-none ${
                  agreeConduct
                    ? 'bg-gold/5 border-gold/40 dark:border-gold/30'
                    : 'bg-surface border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    agreeConduct
                      ? 'bg-gold border-gold text-slate-950 font-black'
                      : 'border-slate-300 dark:border-white/20 bg-transparent'
                  }`}
                >
                  {agreeConduct && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    01. Academic Integrity &amp; Civility
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed">
                    I agree to maintain professional etiquette. Harassment, profanity, bullying, unauthorized exam dumps, and malicious scripts will result in immediate student suspension.
                  </p>
                </div>
              </div>

              {/* Check 2 */}
              <div
                role="checkbox"
                aria-checked={agreeAudit}
                tabIndex={0}
                onClick={() => setAgreeAudit(!agreeAudit)}
                onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setAgreeAudit(!agreeAudit)}
                className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer flex items-start gap-5 select-none ${
                  agreeAudit
                    ? 'bg-gold/5 border-gold/40 dark:border-gold/30'
                    : 'bg-surface border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    agreeAudit
                      ? 'bg-gold border-gold text-slate-950 font-black'
                      : 'border-slate-300 dark:border-white/20 bg-transparent'
                  }`}
                >
                  {agreeAudit && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    02. Verified Student Identity &amp; Accountability
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed">
                    I understand that all discussions are published under my verified student identity. I commit to maintaining professionalism, academic honesty, and constructive peer discourse.
                  </p>
                </div>
              </div>

              {/* Check 3 */}
              <div
                role="checkbox"
                aria-checked={agreeTos}
                tabIndex={0}
                onClick={() => setAgreeTos(!agreeTos)}
                onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setAgreeTos(!agreeTos)}
                className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer flex items-start gap-5 select-none ${
                  agreeTos
                    ? 'bg-gold/5 border-gold/40 dark:border-gold/30'
                    : 'bg-surface border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    agreeTos
                      ? 'bg-gold border-gold text-slate-950 font-black'
                      : 'border-slate-300 dark:border-white/20 bg-transparent'
                  }`}
                >
                  {agreeTos && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                    03. Community Terms &amp; Privacy Compliance
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed">
                    I accept Section 06 (Community Forum Guidelines) and Section 07 (Community Privacy Architecture) governing peer data isolation and edge caching.
                  </p>
                </div>
              </div>
            </div>

            {/* Select All Helper & Continue Button */}
            <div className="pt-6 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSelectAllCompliance}
                className="text-xs font-mono text-gold hover:underline underline-offset-4 cursor-pointer"
              >
                {allAgreed ? 'Deselect All' : 'Agree to All Requirements'}
              </button>

              <button
                type="button"
                disabled={!allAgreed}
                onClick={() => setStep(3)}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gold hover:bg-gold-muted disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Connect</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 3: CONNECT INSTITUTIONAL GOOGLE ACCOUNT
           ═══════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-10">
            <div className="space-y-4 pb-8 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-mono text-xs text-amber-600 dark:text-gold uppercase tracking-[0.2em] font-semibold">
                Step 3 of 4 · Institutional Access
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight uppercase leading-[1.05]">
                Connect Your <span className="text-gold">Student Account</span>
              </h2>
              <p className="text-slate-600 dark:text-white/60 text-sm sm:text-base max-w-2xl leading-relaxed">
                To guarantee that discussions remain strictly between enrolled University of Antique IT majors, authentication is restricted to official student emails.
              </p>
            </div>

            {authError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Centered Rectangular "Continue with Google" Button */}
            <div className="pt-6 sm:pt-10 flex justify-center">
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full max-w-md sm:max-w-lg py-4 sm:py-4.5 px-8 rounded-xl sm:rounded-2xl bg-white dark:bg-[#161B22] hover:bg-slate-50 dark:hover:bg-[#1C2128] border border-black/[0.12] dark:border-white/[0.15] hover:border-gold/50 dark:hover:border-gold/40 text-slate-900 dark:text-white font-display font-bold text-sm sm:text-base tracking-wide transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-3.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            STEP 4: PROFILE SETUP (PROGRESSIVE 4-STAGE FLOW)
           ═══════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
            {/* ─── STAGE 1: PROFILE PHOTO & VERIFIED IDENTITY ─── */}
            {profileSubStep === 1 && (
              <div className="space-y-6">
                {/* Minimalist Verification Status */}
                {eligibilityResult && (
                  <div
                    className={`py-3 px-4 sm:px-5 rounded-2xl flex items-center justify-between gap-3 text-xs border ${
                      eligibilityResult.verified
                        ? 'bg-emerald-500/[0.05] border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/[0.05] border-rose-500/20 text-rose-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span className="font-semibold text-slate-800 dark:text-white/90 truncate">
                        {eligibilityResult.verified
                          ? eligibilityResult.isOfficer
                            ? `Verified Executive · ${eligibilityResult.officerTitle}`
                            : `Verified Student · ${eligibilityResult.yearSection}`
                          : eligibilityResult.error || 'Unverified student account'}
                      </span>
                    </div>
                    {eligibilityResult.studentNo && (
                      <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-white/50 tracking-wider shrink-0">
                        {eligibilityResult.studentNo}
                      </span>
                    )}
                  </div>
                )}

                {/* Profile Photo Selection Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-black/[0.08] dark:border-white/10 flex flex-col items-center text-center space-y-5">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-black/[0.08] dark:border-white/10 shadow-lg bg-surface-subtle flex items-center justify-center">
                      {(avatarMode === 'custom' && customAvatarUrl) || (avatarMode === 'google' && user?.avatar) ? (
                        <Image
                          src={avatarMode === 'custom' && customAvatarUrl ? customAvatarUrl : (user?.avatar || '')}
                          alt="Profile avatar"
                          width={112}
                          height={112}
                          className="w-full h-full object-cover"
                          unoptimized={Boolean(customAvatarUrl?.startsWith('data:'))}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gold/20 to-amber-600/20 text-gold flex items-center justify-center font-display font-black text-3xl uppercase">
                          {(displayName || user?.name || 'U').slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div
                      className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-white dark:bg-[#161B22] shadow border border-black/[0.08] dark:border-white/10 flex items-center justify-center"
                      title={avatarMode === 'google' ? 'Google Account Photo' : 'Custom Uploaded Photo'}
                    >
                      {avatarMode === 'google' ? (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      ) : (
                        <Camera className="w-4 h-4 text-gold" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {displayName || user?.name || 'Student Profile'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      {avatarMode === 'google'
                        ? 'Using your official university Google photo'
                        : 'Custom profile photo active'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] hover:bg-gold/15 dark:hover:bg-gold/20 hover:text-gold border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? 'Processing...' : 'Upload Photo'}</span>
                    </button>

                    {user?.avatar && avatarMode === 'custom' && (
                      <button
                        type="button"
                        onClick={() => setAvatarMode('google')}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Revert to Google profile photo"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Use Google Photo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Navigation CTA for Stage 1 */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setProfileSubStep(2)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STAGE 2: HANDLE, ACADEMIC SECTION & BIO ─── */}
            {profileSubStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-5">
                  {/* Mandatory Username */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block font-semibold flex items-center gap-1.5">
                        <span>Username</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isCheckingHandle
                            ? 'text-slate-400 dark:text-white/40'
                            : isHandleValid
                            ? 'text-emerald-500'
                            : 'text-amber-500'
                        }`}
                      >
                        {isCheckingHandle && (
                          <span className="w-2 h-2 rounded-full border-2 border-gold border-t-transparent animate-spin shrink-0" />
                        )}
                        <span>{handleStatusMessage}</span>
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-sm text-gold select-none pointer-events-none">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        placeholder="kasubays_1 or your_handle"
                        className="w-full bg-surface border border-black/[0.08] dark:border-white/10 rounded-2xl pl-9 pr-5 py-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/45">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>username are public · Real name &amp; student email stay confidential</span>
                    </div>
                  </div>

                  {/* Auto-Verified Section Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block font-semibold">
                        Academic Section
                      </label>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Auto-Verified
                      </span>
                    </div>
                    <div className="w-full bg-surface border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/[0.03] rounded-2xl px-5 py-3.5 text-xs text-slate-900 dark:text-white flex items-center justify-between font-medium">
                      <div className="flex items-center gap-2.5">
                        <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-semibold tracking-wide">
                          {eligibilityResult?.yearSection || yearSection || 'BSIT CCIS'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-slate-500 dark:text-white/60 font-medium">
                        Official CCIS Roster
                      </span>
                    </div>
                  </div>

                  {/* Bio / About Me */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block font-semibold">
                        Bio / About Me
                      </label>
                      <span className="text-[10px] font-mono text-slate-400">Brief introduction</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="e.g. 2nd year IT student into gaming, visual arts, music, and software development..."
                      className="w-full bg-surface border border-black/[0.08] dark:border-white/10 rounded-2xl px-5 py-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-gold resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Navigation Buttons for Stage 2 */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileSubStep(1)}
                    className="px-5 py-3.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={!isHandleValid || isCheckingHandle}
                    onClick={() => setProfileSubStep(3)}
                    className="px-8 py-4 rounded-2xl bg-gold hover:bg-gold-muted disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Interests</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STAGE 3: INTERESTS & PASSIONS ─── */}
            {profileSubStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block font-semibold">
                      Interests &amp; Passions ({selectedHobbies.length})
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">Tap to select passions</span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {AVAILABLE_INTERESTS_HOBBIES.map((hobby) => {
                      const isSelected = selectedHobbies.includes(hobby)
                      return (
                        <button
                          key={hobby}
                          type="button"
                          onClick={() => toggleHobby(hobby)}
                          className={`text-[11px] font-mono px-3.5 sm:px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-gold/15 border-gold text-gold font-bold scale-[1.02]'
                              : 'bg-surface border-black/[0.08] dark:border-white/[0.08] text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {hobby}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Navigation Buttons for Stage 3 */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setProfileSubStep(2)}
                    className="px-5 py-3.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileSubStep(4)}
                    className="px-8 py-4 rounded-2xl bg-gold hover:bg-gold-muted text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue to Socials</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STAGE 4: SOCIAL LINKS & FINISH ─── */}
            {profileSubStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-white/50 block font-semibold">
                      Developer &amp; Social Links
                    </label>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">
                      All Optional
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
                    Link your public profiles so classmates can collaborate with you or view your project portfolio.
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="relative">
                    <GithubIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="GitHub username (e.g. juanit)"
                      className="w-full bg-surface border border-black/[0.08] dark:border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="relative">
                    <LinkedinIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="LinkedIn handle or profile URL"
                      className="w-full bg-surface border border-black/[0.08] dark:border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="Personal website or portfolio link"
                      className="w-full bg-surface border border-black/[0.08] dark:border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Final Navigation & Submit Buttons */}
                <div className="pt-6 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setProfileSubStep(3)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Interests</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSavingProfile}
                    onClick={handleSaveProfile}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gold hover:bg-gold-muted disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{isSavingProfile ? 'Saving Profile...' : 'Save & Enter Community'}</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
