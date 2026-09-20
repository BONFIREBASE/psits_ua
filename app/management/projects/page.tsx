'use client'

import { useState, useEffect, type FormEvent } from 'react'
import Image from 'next/image'
import {
  Code2,
  Plus,
  Search,
  ExternalLink,
  Star,
  Edit2,
  Trash2,
  X,
  Save,
  Tag,
  Users,
  Calendar,
  Layers,
  Check,
  Clock,
} from 'lucide-react'

function GithubIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
import {
  projectsData as initialProjects,
  type Project,
  type ProjectCategory,
  type ProjectStatus,
} from '@/data/projects'
import FormField, { inputStyles, textareaStyles } from '../_components/FormField'
import Select from '../_components/Select'
import FileUpload from '../_components/FileUpload'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { useToast } from '../_components/Toast'
import { getProjects } from '@/lib/supabase'
import { createProjectAction, updateProjectAction, deleteProjectAction, approveProjectAction } from './actions'

const categoryOptions = [
  { value: 'Campus Utility', label: 'Campus Utility' },
  { value: 'Capstone', label: 'Capstone Project' },
  { value: 'Open Source', label: 'Open Source' },
  { value: 'Hackathon', label: 'Hackathon Entry' },
]

const statusOptions = [
  { value: 'Active', label: 'Active / Live' },
  { value: 'Pending', label: 'Pending Approval' },
  { value: 'In Development', label: 'In Development' },
  { value: 'Completed', label: 'Completed' },
]

export default function ProjectsManagementPage() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory>('All')
  const [statusFilter, setStatusFilter] = useState<'All' | ProjectStatus | 'Pending'>('All')

  useEffect(() => {
    async function load() {
      try {
        const dbProjects = await getProjects()
        if (dbProjects && dbProjects.length > 0) {
          const mapped: Project[] = dbProjects.map((p) => {
            const matchedInitial = initialProjects.find(
              (init) =>
                init.title.toLowerCase().trim() === p.title.toLowerCase().trim() ||
                init.id === p.id
            )
            const teamTag = p.tags?.find((t) => t.toLowerCase().startsWith('by:'))
            const teamName =
              teamTag ? teamTag.replace(/^by:\s*/i, '') : matchedInitial?.team || 'PSITS-UA Student Developers'
            return {
              id: p.id,
              title: p.title,
              category: (p.category as Project['category']) || matchedInitial?.category || 'Campus Utility',
              description: p.description,
              problemStatement: matchedInitial?.problemStatement,
              tags: p.tags && p.tags.length > 0 ? p.tags : matchedInitial?.tags || [],
              team: teamName,
              year: matchedInitial?.year || '2026',
              status: (p.status as ProjectStatus) || 'Active',
              featured: matchedInitial?.featured ?? false,
              imageUrl: p.image_url || matchedInitial?.imageUrl || undefined,
              liveUrl: p.demo_url || matchedInitial?.liveUrl || undefined,
              githubUrl: p.github_url || matchedInitial?.githubUrl || undefined,
            }
          })

          const merged = [...mapped]
          for (const init of initialProjects) {
            if (!merged.some((p) => p.title.toLowerCase().trim() === init.title.toLowerCase().trim())) {
              merged.unshift(init)
            }
          }
          setProjects(merged)
        }
      } catch {}
    }
    load()
  }, [])

  async function handleApprove(id: string) {
    const res = await approveProjectAction(id)
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'Active' } : p))
      )
      toast('Project approved and published to public showcase!', 'success')
    } else {
      toast(res.error || 'Failed to approve project', 'error')
    }
  }

  // Modals & confirmation
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form states
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState<Project['category']>('Campus Utility')
  const [formStatus, setFormStatus] = useState<ProjectStatus>('Active')
  const [formYear, setFormYear] = useState('2026')
  const [formTeam, setFormTeam] = useState('PSITS-UA Tech Team')
  const [formDescription, setFormDescription] = useState('')
  const [formProblem, setFormProblem] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formLiveUrl, setFormLiveUrl] = useState('')
  const [formGithubUrl, setFormGithubUrl] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)

  // Filtered list
  const filtered = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter
    const matchStat = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchCat && matchStat
  })

  // Metrics
  const totalCount = projects.length
  const activeCount = projects.filter((p) => p.status === 'Active').length
  const inDevCount = projects.filter((p) => p.status === 'In Development').length
  const featuredCount = projects.filter((p) => p.featured).length
  const pendingCount = projects.filter((p) => p.status === 'Pending').length

  function openAddModal() {
    setFormTitle('')
    setFormCategory('Campus Utility')
    setFormStatus('Active')
    setFormYear('2026')
    setFormTeam('PSITS-UA Tech Team')
    setFormDescription('')
    setFormProblem('')
    setFormTags('Campus Utility, PSITS-UA, Web')
    setFormLiveUrl('')
    setFormGithubUrl('')
    setFormFeatured(false)
    setFormImagePreview(null)
    setShowAddModal(true)
  }

  function openEditModal(project: Project) {
    setEditingProject(project)
    setFormTitle(project.title)
    setFormCategory(project.category)
    setFormStatus(project.status)
    setFormYear(project.year)
    setFormTeam(project.team)
    setFormDescription(project.description)
    setFormProblem(project.problemStatement || '')
    setFormTags(project.tags.join(', '))
    setFormLiveUrl(project.liveUrl || '')
    setFormGithubUrl(project.githubUrl || '')
    setFormFeatured(Boolean(project.featured))
    setFormImagePreview(project.imageUrl || null)
  }

  async function handleSaveNew(e: FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formDescription.trim()) {
      toast('Please provide project title and description.')
      return
    }

    const formData = new FormData()
    formData.append('title', formTitle.trim())
    formData.append('category', formCategory)
    formData.append('description', formDescription.trim())
    formData.append('team', formTeam.trim())
    formData.append('tags', formTags)
    formData.append('status', formStatus)
    formData.append('demoUrl', formLiveUrl.trim())
    formData.append('githubUrl', formGithubUrl.trim())
    if (formImage) formData.append('thumbnail', formImage)

    const res = await createProjectAction(formData)
    if (!res.success) {
      toast(res.error || 'Failed to save project')
      return
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const newProject: Project = {
      id: (res.data as { id: string })?.id || `proj-${Date.now()}`,
      title: formTitle.trim(),
      category: formCategory,
      description: formDescription.trim(),
      problemStatement: formProblem.trim() || undefined,
      tags: tagsArray.length ? tagsArray : ['PSITS-UA'],
      team: formTeam.trim() || 'PSITS-UA Tech Team',
      year: formYear.trim() || '2026',
      status: formStatus,
      featured: formFeatured,
      imageUrl: (res.data as { image_url?: string })?.image_url || formImagePreview || undefined,
      liveUrl: formLiveUrl.trim() || undefined,
      githubUrl: formGithubUrl.trim() || undefined,
    }

    setProjects([newProject, ...projects])
    setShowAddModal(false)
    toast('Project saved successfully!')
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingProject) return

    const formData = new FormData()
    formData.append('title', formTitle.trim())
    formData.append('category', formCategory)
    formData.append('description', formDescription.trim())
    formData.append('team', formTeam.trim())
    formData.append('tags', formTags)
    formData.append('status', formStatus)
    formData.append('demoUrl', formLiveUrl.trim())
    formData.append('githubUrl', formGithubUrl.trim())
    if (editingProject.imageUrl) {
      formData.append('existingImageUrl', editingProject.imageUrl)
    }
    if (formImage) {
      formData.append('thumbnail', formImage)
    }

    const res = await updateProjectAction(editingProject.id, formData)
    if (!res.success) {
      toast(res.error || 'Failed to update project')
      return
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const updated: Project = {
      ...editingProject,
      title: formTitle.trim(),
      category: formCategory,
      description: formDescription.trim(),
      problemStatement: formProblem.trim() || undefined,
      tags: tagsArray.length ? tagsArray : editingProject.tags,
      team: formTeam.trim(),
      year: formYear.trim(),
      status: formStatus,
      featured: formFeatured,
      imageUrl: (res.data as { image_url?: string })?.image_url || formImagePreview || editingProject.imageUrl,
      liveUrl: formLiveUrl.trim() || undefined,
      githubUrl: formGithubUrl.trim() || undefined,
    }

    setProjects(projects.map((p) => (p.id === editingProject.id ? updated : p)))
    setEditingProject(null)
    toast('Project updated successfully in database!')
  }

  async function handleDelete(id: string) {
    const proj = projects.find((p) => p.id === id)
    setProjects(projects.filter((p) => p.id !== id))
    setDeleteConfirmId(null)
    try {
      await deleteProjectAction(id, proj?.imageUrl)
      toast('Project removed successfully.')
    } catch {
      toast('Project removed from view.')
    }
  }

  function toggleFeatured(id: string) {
    setProjects(
      projects.map((p) => (p.id === id ? { ...p, featured: !p.featured } : p))
    )
    toast('Project featured status updated.')
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground-theme tracking-tight">
            Projects Showcase
          </h1>
          <p className="text-sm text-muted-foreground-theme mt-1">
            Manage student capstones, campus software utilities, hackathon submissions, and open-source tools.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] font-semibold text-sm transition-all duration-200 shadow-lg shadow-gold/10 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            Total Projects
          </span>
          <span className="font-display font-black text-2xl text-foreground-theme mt-1 block">
            {totalCount}
          </span>
        </div>
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`cursor-pointer rounded-xl p-4 border transition-all shadow-xs ${
            pendingCount > 0
              ? 'bg-amber-500/[0.08] border-amber-500/40 hover:bg-amber-500/15'
              : 'bg-surface-theme border-border-theme'
          }`}
        >
          <span className="text-[11px] text-amber-600 dark:text-amber-300/80 font-mono uppercase tracking-wider block flex items-center gap-1.5 font-bold">
            <Clock size={12} className="text-amber-500" /> Pending Review
          </span>
          <span className="font-display font-black text-2xl text-amber-600 dark:text-amber-400 mt-1 block">
            {pendingCount}
          </span>
        </div>
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            Active / Live
          </span>
          <span className="font-display font-black text-2xl text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeCount}
          </span>
        </div>
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            In Development
          </span>
          <span className="font-display font-black text-2xl text-amber-500 mt-1 block">
            {inDevCount}
          </span>
        </div>
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            Featured
          </span>
          <span className="font-display font-black text-2xl text-amber-600 dark:text-gold mt-1 block">
            {featuredCount}
          </span>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-surface-theme border border-border-theme rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground-theme"
            />
            <input
              type="text"
              placeholder="Search projects by title, description, team, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Pending', 'Active', 'In Development', 'Completed'] as const).map((stat) => (
              <button
                key={stat}
                onClick={() => setStatusFilter(stat)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === stat
                    ? stat === 'Pending'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-gold/15 text-amber-600 dark:text-gold border border-gold/30 font-bold'
                    : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span>{stat}</span>
                {stat === 'Pending' && pendingCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-[#0a0e17] text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border-theme">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers size={12} /> Category:
          </span>
          {(['All', 'Campus Utility', 'Capstone', 'Open Source', 'Hackathon'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-200 dark:bg-white/15 text-foreground-theme font-medium border border-border-theme'
                  : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.03]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Code2 size={24} className="text-muted-foreground-theme" />}
          title="No projects found"
          description="Try modifying your search query or add a new project to the showcase."
          action={
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add First Project</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((proj) => {
            const isDeleting = deleteConfirmId === proj.id

            return (
              <div
                key={proj.id}
                className={`group bg-surface-theme border rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between shadow-xs ${
                  proj.status === 'Pending'
                    ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                    : 'border-border-theme hover:border-gold/30'
                }`}
              >
                {/* Pending Submission Header Banner */}
                {proj.status === 'Pending' && (
                  <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-500 dark:text-amber-400" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300 font-bold">
                        Pending Officer Review
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApprove(proj.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                        title="Approve & Publish to Public Showcase"
                      >
                        <Check size={13} />
                        <span>Approve & Publish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(proj.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 border border-red-500/30 text-[11px] font-medium transition-all cursor-pointer"
                        title="Decline submission"
                      >
                        <X size={13} />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                )}
                {/* Image Banner / Preview */}
                {proj.imageUrl ? (
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-white/[0.02] overflow-hidden border-b border-border-theme">
                    <Image
                      src={proj.imageUrl}
                      alt={proj.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  </div>
                ) : (
                  <div className="h-24 w-full bg-gradient-to-br from-gold/10 via-slate-100 dark:via-white/[0.02] to-transparent border-b border-border-theme flex items-center px-5">
                    <Code2 size={24} className="text-muted-foreground-theme/40" />
                  </div>
                )}

                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Header line: Category + Status + Featured */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-gold/10 text-amber-600 dark:text-gold border border-gold/20">
                        {proj.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleFeatured(proj.id)}
                          title={proj.featured ? 'Featured Highlight' : 'Mark as Featured'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            proj.featured
                              ? 'text-amber-500 bg-amber-500/10'
                              : 'text-muted-foreground-theme/40 hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <Star size={14} className={proj.featured ? 'fill-amber-500 text-amber-500' : ''} />
                        </button>
                        <StatusBadge status={proj.status} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-bold text-foreground-theme text-lg group-hover:text-amber-600 dark:group-hover:text-gold transition-colors">
                      {proj.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground-theme leading-relaxed line-clamp-3">
                      {proj.description}
                    </p>

                    {/* Problem Statement if available */}
                    {proj.problemStatement && (
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-border-theme text-[11px] text-muted-foreground-theme italic">
                        &ldquo;{proj.problemStatement}&rdquo;
                      </div>
                    )}

                    {/* Team & Year */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground-theme pt-1">
                      <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                        <Users size={12} className="text-muted-foreground-theme/60 flex-shrink-0" />
                        <span className="truncate">{proj.team}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-muted-foreground-theme/60" />
                        {proj.year}
                      </span>
                    </div>

                    {/* Tags */}
                    {proj.tags && proj.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {proj.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-muted-foreground-theme border border-border-theme"
                          >
                            <Tag size={9} className="text-muted-foreground-theme/60" />
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Links Bar */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-theme text-xs font-mono">
                    <div className="flex items-center gap-2">
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-amber-600 dark:text-gold hover:underline text-[11px]"
                          title="Open Live Preview"
                        >
                          <ExternalLink size={12} />
                          <span>Live Demo</span>
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-muted-foreground-theme hover:text-foreground-theme transition-colors text-[11px]"
                          title="Open Source Code"
                        >
                          <GithubIcon size={12} />
                          <span>Repository</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                          <span className="text-red-500 text-[11px]">Delete?</span>
                          <button
                            onClick={() => handleDelete(proj.id)}
                            className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 rounded text-muted-foreground-theme hover:text-foreground-theme text-[11px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          {proj.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(proj.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors text-xs font-semibold cursor-pointer"
                              title="Approve & Publish to Public Showcase"
                            >
                              <Check size={13} />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(proj)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(proj.id)}
                            className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-red-500 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                  <Code2 size={18} />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                  Add Showcase Project
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNew} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 scrollbar-minimal overscroll-contain">
                <FormField label="Project Title" required>
                  <input
                    type="text"
                    placeholder="e.g. Sugalaw PSITS Photobooth"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Category">
                    <Select
                      value={formCategory}
                      onChange={(val) => setFormCategory(val as Project['category'])}
                      options={categoryOptions}
                    />
                  </FormField>

                  <FormField label="Status">
                    <Select
                      value={formStatus}
                      onChange={(val) => setFormStatus(val as ProjectStatus)}
                      options={statusOptions}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Development Team / Authors" required>
                    <input
                      type="text"
                      placeholder="e.g. PSITS-UA Tech & Pubmat Team"
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>

                  <FormField label="Year Released" required>
                    <input
                      type="text"
                      placeholder="e.g. 2026"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Short Description" required>
                  <textarea
                    rows={3}
                    placeholder="Explain what the project does and its purpose..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={textareaStyles}
                    required
                  />
                </FormField>

                <FormField label="Problem Statement / Objective">
                  <textarea
                    rows={2}
                    placeholder="What campus problem does this system address?"
                    value={formProblem}
                    onChange={(e) => setFormProblem(e.target.value)}
                    className={textareaStyles}
                  />
                </FormField>

                <FormField label="Tags (comma-separated)">
                  <input
                    type="text"
                    placeholder="e.g. Campus Utility, Photography, PSITS-UA"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className={inputStyles}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Live Demo or Facebook Post URL">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formLiveUrl}
                      onChange={(e) => setFormLiveUrl(e.target.value)}
                      className={inputStyles}
                    />
                  </FormField>

                  <FormField label="GitHub / Source Code URL">
                    <input
                      type="url"
                      placeholder="https://github.com/..."
                      value={formGithubUrl}
                      onChange={(e) => setFormGithubUrl(e.target.value)}
                      className={inputStyles}
                    />
                  </FormField>
                </div>

                <FormField label="Project Cover Image / Screenshot">
                  <FileUpload
                    accept="image/*"
                    preview={formImagePreview}
                    onChange={(file: File | null) => {
                      setFormImage(file)
                      if (file) {
                        setFormImagePreview(URL.createObjectURL(file))
                      } else {
                        setFormImagePreview(null)
                      }
                    }}
                  />
                </FormField>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-theme border border-border-theme text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    <span className="text-xs font-mono text-foreground-theme">
                      Feature in public project highlights
                    </span>
                  </label>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingProject(null)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                  <Edit2 size={18} />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                  Edit Project Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 scrollbar-minimal overscroll-contain">
                <FormField label="Project Title" required>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Category">
                    <Select
                      value={formCategory}
                      onChange={(val) => setFormCategory(val as Project['category'])}
                      options={categoryOptions}
                    />
                  </FormField>

                  <FormField label="Status">
                    <Select
                      value={formStatus}
                      onChange={(val) => setFormStatus(val as ProjectStatus)}
                      options={statusOptions}
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Development Team / Authors" required>
                    <input
                      type="text"
                      value={formTeam}
                      onChange={(e) => setFormTeam(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>

                  <FormField label="Year Released" required>
                    <input
                      type="text"
                      value={formYear}
                      onChange={(e) => setFormYear(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Short Description" required>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className={textareaStyles}
                    required
                  />
                </FormField>

                <FormField label="Problem Statement / Objective">
                  <textarea
                    rows={2}
                    value={formProblem}
                    onChange={(e) => setFormProblem(e.target.value)}
                    className={textareaStyles}
                  />
                </FormField>

                <FormField label="Tags (comma-separated)">
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className={inputStyles}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Live Demo or Facebook Post URL">
                    <input
                      type="url"
                      value={formLiveUrl}
                      onChange={(e) => setFormLiveUrl(e.target.value)}
                      className={inputStyles}
                    />
                  </FormField>

                  <FormField label="GitHub / Source Code URL">
                    <input
                      type="url"
                      value={formGithubUrl}
                      onChange={(e) => setFormGithubUrl(e.target.value)}
                      className={inputStyles}
                    />
                  </FormField>
                </div>

                <FormField label="Project Cover Image / Screenshot">
                  <FileUpload
                    accept="image/*"
                    preview={formImagePreview}
                    onChange={(file: File | null) => {
                      if (file) {
                        setFormImagePreview(URL.createObjectURL(file))
                      } else {
                        setFormImagePreview(null)
                      }
                    }}
                  />
                </FormField>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-theme border border-border-theme text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    <span className="text-xs font-mono text-foreground-theme">
                      Feature in public project highlights
                    </span>
                  </label>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-border-theme flex-shrink-0 bg-white dark:bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Save size={14} />
                  <span>Update Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
