'use client'

import { useState, useRef, useEffect, useSyncExternalStore, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import ProgressiveImage from './ProgressiveImage'
import {
  FolderGit2,
  GraduationCap,
  Sparkles,
  Search,
  ExternalLink,
  Layers,
  ArrowUpRight,
  Radio,
  Plus,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Code2,
  type LucideIcon,
} from 'lucide-react'
import UseAnimations from 'react-useanimations'
import github from 'react-useanimations/lib/github'
import {
  Project,
  ProjectCategory,
} from '@/data/projects'
import { submitPublicProjectAction } from '@/app/management/projects/actions'
import TurnstileWidget, { TurnstileWidgetHandle } from '@/components/TurnstileWidget'
import ScrollReveal from '@/components/ScrollReveal'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const ALLOWED_DOMAIN = '@antiquespride.edu.ph'

const categories: { label: ProjectCategory; icon: LucideIcon }[] = [
  { label: 'All', icon: Layers },
  { label: 'Capstone', icon: GraduationCap },
  { label: 'Open Source', icon: FolderGit2 },
  { label: 'Campus Utility', icon: Sparkles },
  { label: 'Hackathon', icon: Radio },
]

const SUBMISSION_CATEGORIES: {
  value: ProjectCategory
  label: string
}[] = [
    { value: 'Capstone', label: 'Capstone' },
    { value: 'Campus Utility', label: 'Campus Utility' },
    { value: 'Open Source', label: 'Open Source' },
    { value: 'Hackathon', label: 'Hackathon' },
  ]

const QUICK_TAGS = ['Next.js', 'Flutter', 'Supabase', 'Tailwind', 'Python', 'IoT', 'TypeScript', 'PostgreSQL']

const emptySubscribe = () => () => { }

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: Project[]
}) {
  const [projects] = useState<Project[]>(initialProjects)
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Institutional auth state
  const [user, setUser] = useState<User | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Form inputs
  const [formTitle, setFormTitle] = useState('')
  const [formTeam, setFormTeam] = useState('')
  const [formCategory, setFormCategory] = useState<ProjectCategory>('Capstone')
  const [formDescription, setFormDescription] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formDemoUrl, setFormDemoUrl] = useState('')
  const [formGithubUrl, setFormGithubUrl] = useState('')
  const [formThumbnail, setFormThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  function addTag(tag: string) {
    const current = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    if (!current.includes(tag)) {
      const updated = current.length > 0 ? `${current.join(', ')}, ${tag}` : tag
      setFormTags(updated)
    }
  }

  // Check and listen to Supabase authentication session
  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!isMounted) return
        if (session?.user) {
          const email = session.user.email?.toLowerCase() || ''
          if (email.endsWith(ALLOWED_DOMAIN)) {
            setUser(session.user)
            setSessionToken(session.access_token)
            setAuthError(null)
          } else {
            await supabase.auth.signOut()
            setUser(null)
            setSessionToken(null)
            setAuthError(
              `Access restricted: "${email}" is not an @antiquespride.edu.ph account. Please use your official University of Antique Google Workspace email.`
            )
          }
        }
      } catch (err) {
        console.error('Projects session check error:', err)
      } finally {
        if (isMounted) setIsAuthLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (session?.user) {
        const email = session.user.email?.toLowerCase() || ''
        if (email.endsWith(ALLOWED_DOMAIN)) {
          setUser(session.user)
          setSessionToken(session.access_token)
          setAuthError(null)
        } else {
          await supabase.auth.signOut()
          setUser(null)
          setSessionToken(null)
          setAuthError(
            `Access restricted: "${email}" is not an @antiquespride.edu.ph account. Please sign in using your official university email.`
          )
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSessionToken(null)
      }
      setIsAuthLoading(false)
    })

    // Automatically re-open submission modal if redirected from OAuth callback (?submit=1)
    let redirectTimer: ReturnType<typeof setTimeout> | null = null
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('submit') === '1') {
        window.history.replaceState({}, '', window.location.pathname)
        redirectTimer = setTimeout(() => {
          if (isMounted) {
            setShowSubmitModal(true)
          }
        }, 0)
      }
    }

    return () => {
      isMounted = false
      if (redirectTimer) clearTimeout(redirectTimer)
      subscription.unsubscribe()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setAuthError(null)
    setIsSigningIn(true)
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/projects?submit=1`
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
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize Google authentication.'
      )
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSessionToken(null)
      setAuthError(null)
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  // Lock body scroll when modal is active
  useEffect(() => {
    if (showSubmitModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showSubmitModal])

  // Dismiss on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        setShowSubmitModal(false)
      }
    }
    if (showSubmitModal) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showSubmitModal, submitting])

  function resetForm() {
    setFormTitle('')
    setFormTeam('')
    setFormCategory('Capstone')
    setFormDescription('')
    setFormTags('')
    setFormDemoUrl('')
    setFormGithubUrl('')
    setFormThumbnail(null)
    setThumbnailPreview(null)
    setTurnstileToken(null)
    setSubmitError(null)
    setSubmitSuccess(false)
    setCurrentStep(1)
    if (turnstileRef.current) {
      turnstileRef.current.reset()
    }
  }

  function handleNextStep() {
    setSubmitError(null)
    if (!formTitle.trim()) {
      setSubmitError('Please enter a project title.')
      return
    }
    if (!formTeam.trim()) {
      setSubmitError('Please enter your author or team name.')
      return
    }
    if (!formDescription.trim()) {
      setSubmitError('Please provide a brief project summary.')
      return
    }
    setCurrentStep(2)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Screenshot / banner must be under 5MB.')
        return
      }
      setFormThumbnail(file)
      setThumbnailPreview(URL.createObjectURL(file))
      setSubmitError(null)
    }
  }

  async function handleSubmitProject(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!user || !sessionToken) {
      setSubmitError(
        'Institutional authentication required. Please sign in with your @antiquespride.edu.ph Google account.'
      )
      return
    }
    if (!formTitle.trim()) {
      setSubmitError('Please enter the project title.')
      return
    }
    if (!formTeam.trim()) {
      setSubmitError('Please enter your development team or author names.')
      return
    }
    if (!formDescription.trim()) {
      setSubmitError('Please provide a brief summary of what your project does.')
      return
    }
    if (!turnstileToken) {
      setSubmitError('Please complete the security verification challenge.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('sessionToken', sessionToken)
      formData.append('title', formTitle.trim())
      formData.append('team', formTeam.trim())
      formData.append('category', formCategory)
      formData.append('description', formDescription.trim())
      formData.append('tags', formTags.trim())
      formData.append('demoUrl', formDemoUrl.trim())
      formData.append('githubUrl', formGithubUrl.trim())
      formData.append('turnstileToken', turnstileToken)
      if (formThumbnail) {
        formData.append('thumbnail', formThumbnail)
      }

      const res = await submitPublicProjectAction(formData)
      if (res.success) {
        setSubmitSuccess(true)
      } else {
        setSubmitError(res.error || 'Failed to submit project. Please try again.')
        if (turnstileRef.current) turnstileRef.current.reset()
        setTurnstileToken(null)
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Network error occurred.')
      if (turnstileRef.current) turnstileRef.current.reset()
      setTurnstileToken(null)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategory === 'All' || project.category === selectedCategory

    const query = searchQuery.toLowerCase().trim()
    const matchesSearch =
      query === '' ||
      project.title.toLowerCase().includes(query) ||
      project.description.toLowerCase().includes(query) ||
      project.team.toLowerCase().includes(query) ||
      project.tags.some((tag) => tag.toLowerCase().includes(query))

    return matchesCategory && matchesSearch
  })

  return (
    <div className="pt-28 sm:pt-32 pb-20 sm:pb-28 max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
      {/* Header with Call to Action */}
      <ScrollReveal>
        <header className="border-b border-border-theme pb-8 sm:pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-3xl xl:max-w-4xl">
            <p className="font-mono text-xs text-amber-600 dark:text-gold tracking-widest uppercase flex items-center gap-2 font-semibold">
              <span>04 / Student Innovations · Showcase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
            </p>
            <h1 className="font-display font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-6xl text-foreground-theme tracking-tight uppercase leading-[1.05] break-normal">
              Projects & <span className="inline-block text-amber-600 dark:text-gold">Innovations</span>
            </h1>
            <p className="text-muted-foreground-theme text-sm sm:text-base font-normal leading-relaxed max-w-2xl break-normal">
              Explore capstone systems, open-source utilities, and competition
              builds engineered by Bachelor of Science in Information Technology
              students of the University of Antique.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-theme border border-border-theme shadow-xs">
                {user.user_metadata?.avatar_url ? (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-gold/40">
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gold/20 text-amber-600 dark:text-gold flex items-center justify-center font-bold text-[10px]">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground-theme truncate max-w-[130px]">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign out of student account"
                  className="text-muted-foreground-theme hover:text-foreground-theme p-1 rounded transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowSubmitModal(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus size={16} />
              <span>Submit Your Project</span>
            </button>
          </div>
        </header>
      </ScrollReveal>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-surface-theme border border-border-theme rounded-xl shadow-xs overflow-x-auto scrollbar-none max-w-full">
          {categories.map(({ label, icon: Icon }) => {
            const isActive = selectedCategory === label
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedCategory(label)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${isActive
                    ? 'bg-gold text-[#0D1117] font-bold shadow-[0_0_15px_rgba(245,166,35,0.35)]'
                    : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <Icon size={14} className={isActive ? 'text-[#0D1117]' : 'text-amber-600 dark:text-gold'} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground-theme"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stack, title, team..."
            className="w-full bg-surface-theme border border-border-theme rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground-theme placeholder:text-muted-foreground-theme/60 focus:outline-none focus:border-gold/50 transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground-theme hover:text-foreground-theme"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-surface-theme border border-border-theme rounded-2xl p-8 shadow-xs">
          <p className="text-amber-600 dark:text-gold font-display font-bold text-lg mb-2">
            No projects matched your criteria
          </p>
          <p className="text-muted-foreground-theme text-sm">
            Try resetting your search query or selecting another category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All')
              setSearchQuery('')
            }}
            className="mt-5 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-foreground-theme text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${filteredProjects.length === 1 ? 'max-w-2xl' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-5 sm:gap-6`}>
          {filteredProjects.map((project: Project, index) => (
            <ScrollReveal
              key={project.id}
              delay={(index % 3) * 0.08}
              className="h-full"
            >
              <div
                className="group bg-surface-theme border border-border-theme hover:border-gold/40 rounded-2xl p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-[0_0_25px_rgba(245,166,35,0.08)] h-full"
              >
                <div className="space-y-4">
                  {project.imageUrl && (
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0a0e17] border border-border-theme mb-2">
                      <ProgressiveImage
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                        ambientGlow
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-gold bg-gold/10 px-2.5 py-1 rounded-md border border-gold/20 font-bold">
                      {project.category}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground-theme">
                      {project.year}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-foreground-theme group-hover:text-amber-600 dark:group-hover:text-gold transition-colors break-normal">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground-theme font-mono mt-1 break-words">
                      By {project.team}
                    </p>
                  </div>

                  <p className="text-muted-foreground-theme text-sm leading-relaxed break-words">
                    {project.description}
                  </p>

                  {project.problemStatement && (
                    <div className="p-3 bg-canvas-theme/60 border-l-2 border-gold/50 rounded-r-lg">
                      <p className="text-xs text-foreground-theme/80 leading-relaxed italic">
                        <span className="text-amber-600 dark:text-gold font-semibold not-italic">
                          Impact:
                        </span>{' '}
                        {project.problemStatement}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] text-muted-foreground-theme border border-border-theme"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-border-theme flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground-theme hover:text-foreground-theme transition-colors"
                        aria-label="View Source Code on GitHub"
                      >
                        <UseAnimations
                          animation={github}
                          size={18}
                          strokeColor="#F5A623"
                          className="cursor-pointer"
                        />
                        <span>Repository</span>
                      </a>
                    )}

                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-gold hover:text-gold/80 transition-colors font-medium"
                        aria-label="Visit Live Project"
                      >
                        <ExternalLink size={13} />
                        <span>Live Site</span>
                      </a>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground-theme/60">
                    {project.id.toUpperCase()}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Callout Section */}
      <ScrollReveal>
        <section className="border border-border-theme bg-surface-theme/60 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
          <div className="max-w-xl space-y-2.5">
            <p className="font-mono text-xs text-amber-600 dark:text-gold uppercase tracking-[0.2em] font-bold">
              Showcase Your Work
            </p>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-foreground-theme tracking-tight leading-tight">
              Built something impactful for UA or Antique?
            </h2>
            <p className="text-muted-foreground-theme text-sm leading-relaxed font-normal">
              We feature approved BSIT capstones, community open-source utilities, and competition prototypes built by CCIS students and alumni.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowSubmitModal(true)
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider hover:bg-gold-light transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
            >
              <span>Submit Project for Review</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
      </ScrollReveal>

      {/* Submit Project Modal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {showSubmitModal && (
              <div
                className="fixed inset-0 z-[200] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => !submitting && setShowSubmitModal(false)}
              >
                <div
                  className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Pinned Header */}
                  <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold shrink-0">
                        <Code2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme truncate">
                          Submit Project for Showcase
                        </h2>
                        <p className="text-xs text-muted-foreground-theme truncate">
                          BSIT capstone & student innovation review
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {user && !submitSuccess && (
                        <span className="text-[11px] font-mono text-muted-foreground-theme">
                          {currentStep === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setShowSubmitModal(false)}
                        className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  {submitSuccess ? (
                    <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-1">
                        <CheckCircle2 size={24} />
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                        Submission Received
                      </h3>
                      <p className="text-xs text-muted-foreground-theme max-w-sm leading-relaxed">
                        Your project has been submitted for verification. It will appear on the public showcase once approved by the PSITS team.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubmitModal(false)
                          resetForm()
                        }}
                        className="mt-3 px-5 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] font-bold text-xs transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  ) : isAuthLoading ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                      <Loader2 size={24} className="animate-spin text-gold" />
                      <p className="text-xs font-mono text-muted-foreground-theme">
                        Checking institutional credentials...
                      </p>
                    </div>
                  ) : !user ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-5 text-center">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold mx-auto">
                          <Code2 size={20} />
                        </div>

                        <div className="space-y-1 max-w-sm mx-auto">
                          <h3 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                            Sign In to Submit Project
                          </h3>
                          <p className="text-xs text-muted-foreground-theme leading-relaxed">
                            Sign in with your university account to share your work with the CCIS showcase.
                          </p>
                        </div>

                        {authError && (
                          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-left flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400 leading-relaxed max-w-sm mx-auto">
                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <div className="pt-1 max-w-sm mx-auto">
                          <button
                            type="button"
                            disabled={isSigningIn}
                            onClick={handleGoogleSignIn}
                            className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-border-theme bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs sm:text-sm font-medium text-foreground-theme transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSigningIn ? (
                              <Loader2 size={16} className="animate-spin text-gold" />
                            ) : (
                              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z" />
                                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z" />
                              </svg>
                            )}
                            <span>Continue with Google</span>
                          </button>
                        </div>
                      </div>

                      {/* Gating Footer */}
                      <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422] text-center">
                        <p className="text-[11px] text-muted-foreground-theme leading-relaxed">
                          By signing in, you agree to our{' '}
                          <Link
                            href="/terms"
                            target="_blank"
                            className="text-foreground-theme hover:text-amber-600 dark:hover:text-gold underline underline-offset-2 transition-colors font-medium"
                          >
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link
                            href="/privacy"
                            target="_blank"
                            className="text-foreground-theme hover:text-amber-600 dark:hover:text-gold underline underline-offset-2 transition-colors font-medium"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitProject} className="flex flex-col flex-1 overflow-hidden">
                      <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 scrollbar-minimal overscroll-contain">
                        {/* Submitter Strip */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-border-theme">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {user.user_metadata?.avatar_url ? (
                              <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-gold/40">
                                <Image
                                  src={user.user_metadata.avatar_url}
                                  alt="Avatar"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gold/20 text-amber-600 dark:text-gold flex items-center justify-center font-bold text-xs shrink-0">
                                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-semibold text-foreground-theme truncate">
                                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </p>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                  <Check size={9} /> Verified
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground-theme font-mono truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleSignOut}
                            title="Sign out"
                            className="p-1 rounded-md text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-200/60 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <LogOut size={13} />
                          </button>
                        </div>

                        {submitError && (
                          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0 text-rose-500" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {currentStep === 1 ? (
                          /* STEP 1: Details */
                          <div className="space-y-4">
                            {/* Category Track */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold">
                                Category Track
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg">
                                {SUBMISSION_CATEGORIES.map((cat) => {
                                  const isSelected = formCategory === cat.value
                                  return (
                                    <button
                                      key={cat.value}
                                      type="button"
                                      onClick={() => setFormCategory(cat.value)}
                                      className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors text-center cursor-pointer ${isSelected
                                          ? 'bg-gold text-[#0a0e17] font-bold shadow-xs'
                                          : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-200/60 dark:hover:bg-white/5'
                                        }`}
                                    >
                                      {cat.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Project Title */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold">
                                Project Title <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Sugalaw PSITS Photobooth"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20"
                              />
                            </div>

                            {/* Authors / Team */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold">
                                Development Team / Authors <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. BSIT 4-A Capstone Group 3"
                                value={formTeam}
                                onChange={(e) => setFormTeam(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20"
                              />
                            </div>

                            {/* Description */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold">
                                  Project Description <span className="text-red-500 dark:text-red-400 ml-0.5">*</span>
                                </label>
                                <span className="text-[10px] font-mono text-muted-foreground-theme">
                                  {formDescription.length}/500
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                maxLength={500}
                                required
                                placeholder="Explain what the project does and the campus problem it addresses..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20 resize-none min-h-[90px]"
                              />
                            </div>
                          </div>
                        ) : (
                          /* STEP 2: Links & Media */
                          <div className="space-y-4">
                            {/* Tech Stack */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold">
                                Tech Stack / Tags
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Next.js, Flutter, Tailwind, Supabase"
                                value={formTags}
                                onChange={(e) => setFormTags(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20"
                              />
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-mono text-muted-foreground-theme">Quick add:</span>
                                {QUICK_TAGS.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => addTag(t)}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] border border-border-theme hover:border-gold/40 text-muted-foreground-theme hover:text-foreground-theme transition-colors cursor-pointer"
                                  >
                                    +{t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Demo URL & GitHub */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold truncate">
                                  Live Demo or Video URL
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={formDemoUrl}
                                  onChange={(e) => setFormDemoUrl(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold truncate">
                                  GitHub / Source Code URL
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://github.com/..."
                                  value={formGithubUrl}
                                  onChange={(e) => setFormGithubUrl(e.target.value)}
                                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-black/20 dark:hover:border-white/20"
                                />
                              </div>
                            </div>

                            {/* Cover / Screenshot */}
                            <div className="space-y-1.5">
                              <label className="block font-mono text-[11px] text-slate-600 dark:text-white/60 uppercase tracking-[0.1em] font-semibold">
                                Project Cover Image / Screenshot <span className="text-muted-foreground-theme font-normal font-sans">(optional)</span>
                              </label>
                              {thumbnailPreview ? (
                                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border-theme bg-black/40 group">
                                  <Image
                                    src={thumbnailPreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-3">
                                    <span className="text-[10px] font-mono text-white truncate max-w-[240px]">
                                      {formThumbnail?.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormThumbnail(null)
                                        setThumbnailPreview(null)
                                      }}
                                      className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                                      title="Remove image"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="flex items-center gap-3 p-3.5 border border-dashed border-border-theme hover:border-gold/50 rounded-lg cursor-pointer bg-slate-50/70 hover:bg-slate-100/70 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] transition-colors">
                                  <UploadCloud size={18} className="text-muted-foreground-theme shrink-0" />
                                  <div className="text-xs text-foreground-theme">
                                    <span className="font-medium">Upload screenshot or cover</span>
                                    <span className="text-[10px] text-muted-foreground-theme font-mono block mt-0.5">
                                      PNG, JPG, WebP up to 5MB (16:9 ratio recommended)
                                    </span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pinned Footer */}
                      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422]">
                        {currentStep === 1 ? (
                          <>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setShowSubmitModal(false)}
                              className="px-4 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm cursor-pointer"
                            >
                              <span>Continue</span>
                              <ChevronRight size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setCurrentStep(1)}
                              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                            >
                              <ChevronLeft size={13} />
                              <span>Back</span>
                            </button>

                            <div className="flex items-center gap-3">
                              <div className={turnstileToken ? 'hidden' : 'block'}>
                                <TurnstileWidget
                                  ref={turnstileRef}
                                  action="project-submit"
                                  className="scale-[0.8] origin-right"
                                  onVerify={(token) => {
                                    setTurnstileToken(token)
                                    setSubmitError(null)
                                  }}
                                  onExpire={() => setTurnstileToken(null)}
                                  onError={() => setSubmitError('Verification failed. Please try again.')}
                                />
                              </div>

                              {turnstileToken && (
                                <button
                                  type="submit"
                                  disabled={submitting}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" />
                                      <span>Submitting...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check size={13} />
                                      <span>Submit Project</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
