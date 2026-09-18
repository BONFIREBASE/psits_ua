'use client'

import { useState, useEffect, useRef, type FormEvent } from 'react'
import Image from 'next/image'
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
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import UseAnimations from 'react-useanimations'
import github from 'react-useanimations/lib/github'
import {
  projectsData as initialProjects,
  Project,
  ProjectCategory,
  ProjectStatus,
} from '@/data/projects'
import { getProjects } from '@/lib/supabase'
import { submitPublicProjectAction } from '@/app/management/projects/actions'
import TurnstileWidget, { TurnstileWidgetHandle } from '@/components/TurnstileWidget'

const categories: { label: ProjectCategory; icon: LucideIcon }[] = [
  { label: 'All', icon: Layers },
  { label: 'Capstone', icon: GraduationCap },
  { label: 'Open Source', icon: FolderGit2 },
  { label: 'Campus Utility', icon: Sparkles },
  { label: 'Hackathon', icon: Radio },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Submit modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false)
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

  // Load live approved projects from Supabase
  useEffect(() => {
    async function loadLiveProjects() {
      try {
        const dbProjects = await getProjects()
        if (dbProjects && dbProjects.length > 0) {
          // Strictly filter out any unapproved / pending submissions
          const publicList: Project[] = dbProjects
            .filter((p) => p.status !== 'Pending')
            .map((p) => {
              const matchedInitial = initialProjects.find(
                (init) =>
                  init.title.toLowerCase().trim() === p.title.toLowerCase().trim() ||
                  init.id === p.id
              )
              const teamTag = p.tags?.find((t) => t.toLowerCase().startsWith('by:'))
              const teamName =
                teamTag ? teamTag.replace(/^by:\s*/i, '') : matchedInitial?.team || 'PSITS-UA Student Developers'
              const displayTags = (p.tags || []).filter((t) => !t.toLowerCase().startsWith('by:'))
              return {
                id: p.id,
                title: p.title,
                category: (p.category as Project['category']) || matchedInitial?.category || 'Campus Utility',
                description: p.description,
                problemStatement: matchedInitial?.problemStatement,
                tags: displayTags.length > 0 ? displayTags : matchedInitial?.tags || ['PSITS-UA'],
                team: teamName,
                year: matchedInitial?.year || '2026',
                status: (p.status as ProjectStatus) || 'Active',
                featured: matchedInitial?.featured ?? true,
                imageUrl: p.image_url || matchedInitial?.imageUrl || undefined,
                liveUrl: p.demo_url || matchedInitial?.liveUrl || undefined,
                githubUrl: p.github_url || matchedInitial?.githubUrl || undefined,
              }
            })

          // Guarantee flagship projects like Sugalaw PSITS Photobooth are always present
          const merged = [...publicList]
          for (const init of initialProjects) {
            if (!merged.some((p) => p.title.toLowerCase().trim() === init.title.toLowerCase().trim())) {
              merged.unshift(init)
            }
          }

          setProjects(merged)
        }
      } catch (err) {
        console.error('Failed to load projects from Supabase:', err)
      }
    }
    loadLiveProjects()
  }, [])

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
    if (turnstileRef.current) {
      turnstileRef.current.reset()
    }
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
      setSubmitError('Please complete the Cloudflare security challenge.')
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
    <div className="pt-32 pb-28 max-w-6xl mx-auto px-6 space-y-12">
      {/* Header with Call to Action */}
      <header className="border-b border-white/10 pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4 max-w-2xl">
          <p className="font-mono text-xs text-gold tracking-widest uppercase flex items-center gap-2">
            <span>04 / Student Innovations · Showcase</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-pulse" />
          </p>
          <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase leading-[1.08]">
            Projects & <span className="text-gold">Innovations</span>
          </h1>
          <p className="text-white/80 text-base font-normal leading-relaxed">
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
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(245,166,35,0.25)] hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] cursor-pointer"
          >
            <Plus size={16} />
            <span>Submit Your Project</span>
          </button>
        </div>
      </header>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface border border-white/10 rounded-xl">
          {categories.map(({ label, icon: Icon }) => {
            const isActive = selectedCategory === label
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedCategory(label)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gold text-base font-bold shadow-[0_0_15px_rgba(245,166,35,0.35)]'
                    : 'text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-base' : 'text-gold'} />
                {label}
              </button>
            )
          })}
        </div>

        <div className="relative min-w-[260px] md:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stack, title, team..."
            className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-muted/60 focus:outline-none focus:border-gold/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-surface border border-white/5 rounded-2xl p-8">
          <p className="text-gold font-display font-bold text-lg mb-2">
            No projects matched your criteria
          </p>
          <p className="text-muted text-sm">
            Try resetting your search query or selecting another category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All')
              setSearchQuery('')
            }}
            className="mt-5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${filteredProjects.length === 1 ? 'max-w-2xl' : 'md:grid-cols-2'} gap-6`}>
          {filteredProjects.map((project: Project) => (
            <div
              key={project.id}
              className="group bg-surface border border-white/5 hover:border-gold/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_0_25px_rgba(245,166,35,0.08)]"
            >
              <div className="space-y-4">
                {project.imageUrl && (
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#0a0e17] border border-white/10 mb-2">
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 700px"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-1 rounded-md border border-gold/20">
                    {project.category}
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    {project.year}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-white group-hover:text-gold transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted font-mono mt-1">
                    By {project.team}
                  </p>
                </div>

                <p className="text-muted text-sm leading-relaxed">
                  {project.description}
                </p>

                {project.problemStatement && (
                  <div className="p-3 bg-base/60 border-l-2 border-gold/50 rounded-r-lg">
                    <p className="text-xs text-white/80 leading-relaxed italic">
                      <span className="text-gold font-semibold not-italic">
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
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-muted border border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors"
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
                      className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors"
                      aria-label="Visit Live Project"
                    >
                      <ExternalLink size={13} />
                      <span>Live Site</span>
                    </a>
                  )}
                </div>

                <div className="text-[11px] font-mono text-muted/60">
                  {project.id.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Callout Section */}
      <section className="border border-white/10 bg-surface/30 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl space-y-2.5">
          <p className="font-mono text-xs text-gold uppercase tracking-[0.2em] font-bold">
            Showcase Your Work
          </p>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            Built something impactful for UA or Antique?
          </h2>
          <p className="text-white/60 text-sm leading-relaxed font-normal">
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
          >
            <span>Submit Project for Review</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      {/* Submit Project Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => !submitting && setShowSubmitModal(false)}
        >
          <div
            className="bg-[#0e1422] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0e17]/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">
                    Submit Project for Review
                  </h2>
                  <p className="text-[11px] text-white/50 font-mono">
                    PSITS-UA Student Innovation Showcase
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            {submitSuccess ? (
              <div className="p-8 sm:p-10 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="font-display font-black text-2xl text-white">
                  Submission Received!
                </h3>
                <p className="text-white/70 text-sm max-w-md leading-relaxed">
                  Thank you for submitting your project. It is currently placed in the
                  <span className="text-amber-400 font-semibold"> Pending Review </span>
                  queue. Once verified and approved by the PSITS-UA management team, it will appear live on the public showcase.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false)
                    resetForm()
                  }}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitProject} className="flex flex-col flex-1 overflow-hidden">
                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-rose-400" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Project Title */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                      Project Title <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KasUbAy Campus Route Finder"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
                    />
                  </div>

                  {/* Authors / Team & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                        Authors / Team <span className="text-gold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. BSIT 3-A Capstone Group 2"
                        value={formTeam}
                        onChange={(e) => setFormTeam(e.target.value)}
                        className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as ProjectCategory)}
                        className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold/50"
                      >
                        <option value="Capstone">Capstone Project</option>
                        <option value="Campus Utility">Campus Utility</option>
                        <option value="Open Source">Open Source Tool</option>
                        <option value="Hackathon">Hackathon Build</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                      Project Description <span className="text-gold">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Summarize the core features, objectives, and campus impact of your system..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 resize-none"
                    />
                  </div>

                  {/* Tech Stack Tags */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                      Tech Stack / Tags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Next.js, Flutter, Tailwind, Supabase, IoT"
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                      className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
                    />
                  </div>

                  {/* URLs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                        Live Demo / Video URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={formDemoUrl}
                        onChange={(e) => setFormDemoUrl(e.target.value)}
                        className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                        GitHub / Source Code URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={formGithubUrl}
                        onChange={(e) => setFormGithubUrl(e.target.value)}
                        className="w-full bg-[#121929] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50"
                      />
                    </div>
                  </div>

                  {/* Screenshot / Thumbnail Upload */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                      Project Banner / Screenshot (Cloudflare R2, Max 5MB)
                    </label>
                    <div className="flex items-center gap-4">
                      {thumbnailPreview ? (
                        <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-white/20 shrink-0">
                          <Image
                            src={thumbnailPreview}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormThumbnail(null)
                              setThumbnailPreview(null)
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-white/15 hover:border-gold/40 rounded-xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                          <UploadCloud size={20} className="text-gold/80 mb-1" />
                          <span className="text-xs text-white/70 font-mono">
                            Click or drag screenshot here
                          </span>
                          <span className="text-[10px] text-white/40 font-mono mt-0.5">
                            PNG, JPG, or WebP up to 5MB
                          </span>
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

                  {/* Cloudflare Turnstile Bot Protection */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-white/50 flex items-center gap-1">
                        <ShieldCheck size={13} className="text-gold" /> Bot Challenge Protection
                      </span>
                      {turnstileToken ? (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-400">Required</span>
                      )}
                    </div>
                    <TurnstileWidget
                      ref={turnstileRef}
                      action="project-submit"
                      onVerify={(token) => {
                        setTurnstileToken(token)
                        setSubmitError(null)
                      }}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => setSubmitError('Turnstile challenge failed. Please retry.')}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#0a0e17]/60">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-mono text-white/50 hover:text-white transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !turnstileToken}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-[#0D1117] font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Uploading & Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Submit Project</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
