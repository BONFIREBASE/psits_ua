'use client'

import { useState, useRef, useEffect, useSyncExternalStore, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
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

const emptySubscribe = () => () => {}

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: Project[]
}) {
  const [projects] = useState<Project[]>(initialProjects)
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="pt-32 pb-28 max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 space-y-12">
      {/* Header with Call to Action */}
      <ScrollReveal>
        <header className="border-b border-border-theme pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <p className="font-mono text-xs text-amber-600 dark:text-gold tracking-widest uppercase flex items-center gap-2 font-semibold">
              <span>04 / Student Innovations · Showcase</span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
            </p>
            <h1 className="font-display font-black text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-foreground-theme tracking-tight uppercase leading-[1.08] break-words">
              Projects & <span className="text-amber-600 dark:text-gold">Innovations</span>
            </h1>
            <p className="text-muted-foreground-theme text-sm sm:text-base font-normal leading-relaxed break-words">
              Explore capstone systems, open-source utilities, and competition
              builds engineered by Bachelor of Science in Information Technology
              students of the University of Antique.
            </p>
          </div>

          <div className="shrink-0">
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
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-theme border border-border-theme rounded-xl shadow-xs">
          {categories.map(({ label, icon: Icon }) => {
            const isActive = selectedCategory === label
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedCategory(label)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
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

        <div className="relative w-full md:w-72">
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
        <div className={`grid grid-cols-1 ${filteredProjects.length === 1 ? 'max-w-2xl' : 'md:grid-cols-2 xl:grid-cols-3'} gap-6`}>
          {filteredProjects.map((project: Project, index) => (
            <ScrollReveal
              key={project.id}
              delay={(index % 3) * 0.08}
              className="h-full"
            >
              <div
                className="group bg-surface-theme border border-border-theme hover:border-gold/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-[0_0_25px_rgba(245,166,35,0.08)] h-full"
              >
                <div className="space-y-4">
                  {project.imageUrl && (
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0a0e17] border border-border-theme mb-2">
                      <ProgressiveImage
                        src={project.imageUrl}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 700px"
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
                    <h3 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-foreground-theme group-hover:text-amber-600 dark:group-hover:text-gold transition-colors break-words">
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
                className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => !submitting && setShowSubmitModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0C1017] text-white shadow-2xl overflow-hidden flex flex-col my-auto text-left"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#090D14]">
                    <div>
                      <h2 className="font-display font-bold text-base sm:text-lg text-white tracking-tight">
                        Submit Project for Showcase
                      </h2>
                      <p className="text-xs text-white/50 mt-0.5">
                        Share your capstone, utility, or open-source build with the CCIS community.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-mono text-white/40">
                        {currentStep === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
                      </span>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => setShowSubmitModal(false)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  {submitSuccess ? (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                        <CheckCircle2 size={24} />
                      </div>
                      <h3 className="font-display font-bold text-lg text-white">
                        Submission Received
                      </h3>
                      <p className="text-white/60 text-xs max-w-sm leading-relaxed">
                        Your project has been submitted for verification. It will appear on the showcase once approved by the PSITS team.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSubmitModal(false)
                          resetForm()
                        }}
                        className="mt-4 px-5 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0D1117] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitProject} className="flex flex-col">
                      <div className="p-6 space-y-4">
                        {submitError && (
                          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle size={15} className="shrink-0 text-rose-400" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {currentStep === 1 ? (
                          /* STEP 1: Details */
                          <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-4"
                          >
                            {/* Track / Category Segmented Control */}
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                                Category Track
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-white/[0.02] border border-white/8 rounded-xl">
                                {SUBMISSION_CATEGORIES.map((cat) => {
                                  const isSelected = formCategory === cat.value
                                  return (
                                    <button
                                      key={cat.value}
                                      type="button"
                                      onClick={() => setFormCategory(cat.value)}
                                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center truncate cursor-pointer ${
                                        isSelected
                                          ? 'bg-gold text-[#0D1117] font-semibold shadow-sm'
                                          : 'text-white/60 hover:text-white hover:bg-white/5'
                                      }`}
                                    >
                                      {cat.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Title */}
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                                Project Title <span className="text-gold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. KasUbAy Campus Route Finder"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-gold/60 focus:bg-white/[0.05] transition-all"
                              />
                            </div>

                            {/* Authors / Team */}
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                                Authors / Team <span className="text-gold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. BSIT 3-A Capstone Group 2"
                                value={formTeam}
                                onChange={(e) => setFormTeam(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-gold/60 focus:bg-white/[0.05] transition-all"
                              />
                            </div>

                            {/* Pitch / Description */}
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[11px] font-mono uppercase tracking-wider text-white/60">
                                  Pitch / Description <span className="text-gold">*</span>
                                </label>
                                <span className="text-[10px] font-mono text-white/35">
                                  {formDescription.length}/500
                                </span>
                              </div>
                              <textarea
                                rows={3}
                                maxLength={500}
                                required
                                placeholder="Briefly describe what your system does and its campus impact..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-gold/60 focus:bg-white/[0.05] transition-all resize-none leading-relaxed"
                              />
                            </div>
                          </motion.div>
                        ) : (
                          /* STEP 2: Links & Media */
                          <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-4"
                          >
                            {/* Tech Stack */}
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                                Tech Stack
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Next.js, Flutter, Tailwind, Supabase"
                                value={formTags}
                                onChange={(e) => setFormTags(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-gold/60 focus:bg-white/[0.05] transition-all"
                              />
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span className="text-[10px] font-mono text-white/35">Quick add:</span>
                                {QUICK_TAGS.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => addTag(t)}
                                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] hover:bg-gold/15 border border-white/8 hover:border-gold/40 text-white/60 hover:text-gold transition-colors cursor-pointer"
                                  >
                                    +{t}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Demo URL & GitHub */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5 truncate">
                                  Live Demo / Video URL
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://..."
                                  value={formDemoUrl}
                                  onChange={(e) => setFormDemoUrl(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-gold/60 focus:bg-white/[0.05] transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5 truncate">
                                  GitHub Repository
                                </label>
                                <input
                                  type="url"
                                  placeholder="https://github.com/..."
                                  value={formGithubUrl}
                                  onChange={(e) => setFormGithubUrl(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 text-xs focus:outline-none focus:border-gold/60 focus:bg-white/[0.05] transition-all"
                                />
                              </div>
                            </div>

                            {/* Banner / Screenshot upload */}
                            <div>
                              <label className="block text-[11px] font-mono uppercase tracking-wider text-white/60 mb-1.5">
                                Banner / Screenshot <span className="text-white/35 font-normal">(optional)</span>
                              </label>
                              {thumbnailPreview ? (
                                <div className="relative w-full h-24 rounded-xl overflow-hidden border border-white/15 bg-black/40 group">
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
                                <label className="flex items-center gap-3 p-3.5 border border-dashed border-white/15 hover:border-white/30 rounded-xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                  <UploadCloud size={18} className="text-white/40 shrink-0" />
                                  <div className="text-xs text-white/70">
                                    <span>Upload screenshot or banner</span>
                                    <span className="text-[10px] text-white/35 font-mono block mt-0.5">
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
                          </motion.div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-3.5 border-t border-white/8 bg-[#090D14] flex items-center justify-between gap-3">
                        {currentStep === 1 ? (
                          <>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => setShowSubmitModal(false)}
                              className="px-3 py-1.5 rounded-lg text-xs font-mono text-white/50 hover:text-white transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleNextStep}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0D1117] font-semibold text-xs transition-colors cursor-pointer"
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
                              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer"
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
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0D1117] font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
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
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
