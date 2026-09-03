'use client'

import { useState } from 'react'
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
  Clock,
  CheckCircle2,
  Send,
  type LucideIcon,
} from 'lucide-react'
import UseAnimations from 'react-useanimations'
import github from 'react-useanimations/lib/github'
import {
  projectsData,
  Project,
  ProjectCategory,
  ProjectStatus,
} from '@/data/projects'

const categories: { label: ProjectCategory; icon: LucideIcon }[] = [
  { label: 'All', icon: Layers },
  { label: 'Capstone', icon: GraduationCap },
  { label: 'Open Source', icon: FolderGit2 },
  { label: 'Campus Utility', icon: Sparkles },
  { label: 'Hackathon', icon: Radio },
]

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<ProjectCategory>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProjects = projectsData.filter((project) => {
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

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        )
      case 'In Development':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-gold/10 text-gold border border-gold/25">
            <Clock size={11} />
            In Dev
          </span>
        )
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-white/5 text-muted border border-white/10">
            <CheckCircle2 size={11} />
            Completed
          </span>
        )
    }
  }

  return (
    <div className="pt-32 pb-28 max-w-6xl mx-auto px-6 space-y-12">
      {/* Editorial Header */}
      <header className="space-y-4 border-b border-white/10 pb-10">
        <p className="font-mono text-xs text-gold tracking-widest uppercase">
          04 / Student Innovations · Showcase
        </p>
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight uppercase leading-[1.08]">
          Projects & <span className="text-gold">Innovations</span>
        </h1>
        <p className="text-white/80 text-base max-w-2xl font-normal leading-relaxed">
          Explore capstone systems, open-source utilities, and competition
          builds engineered by Bachelor of Science in Information Technology
          students of the University of Antique.
        </p>
      </header>

      {/* Control Bar: Categories & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Segmented Filter */}
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

        {/* Search Bar */}
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
            className="w-full bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-muted/60 focus:outline-none focus:border-gold/50 transition-colors"
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
                {/* Visual Thumbnail */}
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

                {/* Meta header */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-1 rounded-md border border-gold/20">
                      {project.category}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      {project.year}
                    </span>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-white group-hover:text-gold transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-muted font-mono mt-1">
                    By {project.team}
                  </p>
                </div>

                {/* Description */}
                <p className="text-muted text-sm leading-relaxed">
                  {project.description}
                </p>

                {/* Problem Statement Box */}
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

                {/* Tags */}
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

              {/* Actions & Links */}
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

      {/* Student Submission Banner */}
      <section className="bg-surface border border-white/10 rounded-2xl p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-mono">
            <Sparkles size={12} />
            Showcase Your Work
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
            Built something impactful for UA or Antique?
          </h2>
          <p className="text-muted text-sm leading-relaxed">
            We feature approved BSIT capstones, community open-source utilities,
            and competition prototypes built by CCIS students and alumni.
          </p>
          <div className="pt-2">
            <a
              href="mailto:psits-ua@antiquespride.edu.ph?subject=Project%20Showcase%20Submission%20-%20PSITS%20Portal"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#F5A623] via-[#FFBF52] to-[#E09010] text-[#0B0F17] font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] transition-all cursor-pointer"
            >
              <Send size={14} />
              Submit Project for Review
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
