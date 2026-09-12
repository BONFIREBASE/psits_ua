'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Calendar, Tag, ExternalLink } from 'lucide-react'
import { socialDispatches, type SocialDispatch } from '@/data/announcements'
import StatusBadge from '../_components/StatusBadge'

export default function BlogListPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  const categories = ['All', ...new Set(socialDispatches.map((d) => d.category))]

  const filtered = socialDispatches.filter((d) => {
    const matchesSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.excerpt.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      categoryFilter === 'All' || d.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">
            Blog / Dispatches
          </h1>
          <p className="text-sm text-white/35 mt-1">
            Manage social dispatches, event recaps, and announcements.
          </p>
        </div>
        <Link
          href="/management/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit"
        >
          <Plus size={16} />
          <span>New Post</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${categoryFilter === cat
                  ? 'bg-gold/15 text-gold border border-gold/25'
                  : 'bg-white/[0.03] text-white/40 border border-white/8 hover:text-white/60 hover:border-white/15'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-2.5">
        {filtered.map((dispatch) => (
          <DispatchRow key={dispatch.id} dispatch={dispatch} />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-white/30">No posts match your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DispatchRow({ dispatch }: { dispatch: SocialDispatch }) {
  return (
    <div className="group flex items-center gap-4 p-4 rounded-xl border border-white/6 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
      {/* Thumbnail */}
      <div className="w-16 h-16 sm:w-20 sm:h-14 rounded-lg bg-surface/60 overflow-hidden flex-shrink-0 relative border border-white/6">
        {dispatch.imageUrl ? (
          <Image
            src={dispatch.imageUrl}
            alt={dispatch.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag size={16} className="text-white/15" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-display font-bold text-white/85 truncate">
            {dispatch.title}
          </h3>
          <StatusBadge status="Published" />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {dispatch.date}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-white/35">
            {dispatch.category}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {dispatch.postUrl && (
          <a
            href={dispatch.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/20 hover:text-gold/70 hover:bg-white/[0.04] transition-colors"
            title="View on Facebook"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  )
}
