'use client'

import { useState, useEffect, type FormEvent } from 'react'
import {
  CalendarDays,
  Plus,
  Search,
  MapPin,
  Users,
  Star,
  Edit2,
  Trash2,
  X,
  Save,
  Clock,
  Filter,
} from 'lucide-react'
import {
  type Activity,
} from '@/data/events'
import FormField, { inputStyles } from '../_components/FormField'
import Select from '../_components/Select'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { ManagementCardGridSkeleton } from '../_components/SkeletonPreloader'
import { useToast } from '../_components/Toast'
import { getEvents, supabase } from '@/lib/supabase'
import { createEventAction, updateEventAction, deleteEventAction } from './actions'

export type EventStatus = 'Scheduled' | 'Completed' | 'Postponed' | 'Cancelled'

export type ManagedActivity = Activity & {
  status?: EventStatus
}

const semesterOptions = [
  { value: '1st Semester (2026)', label: '1st Semester (2026)' },
  { value: '2nd Semester (2027)', label: '2nd Semester (2027)' },
]

const categoryOptions = [
  { value: 'Governance', label: 'Governance' },
  { value: 'Competition', label: 'Competition' },
  { value: 'Social', label: 'Social' },
  { value: 'Academic', label: 'Academic' },
  { value: 'Career', label: 'Career' },
]

const statusOptions = [
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Postponed', label: 'Postponed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const categoryColorMap: Record<Activity['category'], string> = {
  Governance: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Competition: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  Social: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Academic: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  Career: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
}

export default function EventsManagementPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<ManagedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<'All' | Activity['semester']>('All')
  const [categoryFilter, setCategoryFilter] = useState<'All' | Activity['category']>('All')

  async function load() {
    try {
      const dbEvents = await getEvents()
      if (dbEvents && dbEvents.length > 0) {
        const mapped: ManagedActivity[] = dbEvents.map((ev) => {
          let involved = 'CCIS IT Students & Officers'
          if (ev.description && ev.description.includes(' · Involved: ')) {
            involved = ev.description.split(' · Involved: ')[1]
          } else if (ev.description) {
            involved = ev.description
          }
          const semester = ev.date.includes('2026')
            ? '1st Semester (2026)'
            : '2nd Semester (2027)'

          return {
            id: ev.id,
            month: ev.date,
            dates: ev.date,
            activity: ev.title,
            involved,
            venue: ev.location,
            personsResponsible: 'PSITS-UA Officers',
            semester,
            category: (categoryOptions.some((c) => c.value === ev.category)
              ? ev.category
              : 'Academic') as Activity['category'],
            status: (ev.status === 'Upcoming' ? 'Scheduled' : ev.status || 'Scheduled') as EventStatus,
          }
        })
        setEvents(mapped)
      }
    } catch {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()

    const channel = supabase
      .channel('events-mgmt-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ManagedActivity | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form states
  const [formMonth, setFormMonth] = useState('')
  const [formActivity, setFormActivity] = useState('')
  const [formInvolved, setFormInvolved] = useState('')
  const [formVenue, setFormVenue] = useState('')
  const [formSemester, setFormSemester] = useState<Activity['semester']>('1st Semester (2026)')
  const [formCategory, setFormCategory] = useState<Activity['category']>('Governance')
  const [formStatus, setFormStatus] = useState<'Scheduled' | 'Completed' | 'Postponed' | 'Cancelled'>('Scheduled')
  const [formFeatured, setFormFeatured] = useState(false)

  // Filtered events
  const filteredEvents = events.filter((ev) => {
    const matchSearch =
      ev.activity.toLowerCase().includes(search.toLowerCase()) ||
      ev.venue.toLowerCase().includes(search.toLowerCase()) ||
      ev.involved.toLowerCase().includes(search.toLowerCase()) ||
      ev.month.toLowerCase().includes(search.toLowerCase())
    const matchSemester = semesterFilter === 'All' || ev.semester === semesterFilter
    const matchCategory = categoryFilter === 'All' || ev.category === categoryFilter
    return matchSearch && matchSemester && matchCategory
  })

  // Stats
  const firstSemCount = events.filter((e) => e.semester === '1st Semester (2026)').length
  const secondSemCount = events.filter((e) => e.semester === '2nd Semester (2027)').length
  const featuredCount = events.filter((e) => e.featured).length

  function openAddModal() {
    setFormMonth('')
    setFormActivity('')
    setFormInvolved('CCIS IT Students')
    setFormVenue('CCIS Lobby')
    setFormSemester('1st Semester (2026)')
    setFormCategory('Academic')
    setFormStatus('Scheduled')
    setFormFeatured(false)
    setShowAddModal(true)
  }

  function openEditModal(event: ManagedActivity) {
    setEditingEvent(event)
    setFormMonth(event.month)
    setFormActivity(event.activity)
    setFormInvolved(event.involved)
    setFormVenue(event.venue)
    setFormSemester(event.semester)
    setFormCategory(event.category)
    setFormStatus(event.status || 'Scheduled')
    setFormFeatured(Boolean(event.featured))
  }

  async function handleSaveNew(e: FormEvent) {
    e.preventDefault()
    if (!formActivity.trim() || !formMonth.trim()) {
      toast('Please provide an activity title and schedule.')
      return
    }

    const formData = new FormData()
    formData.append('title', formActivity.trim())
    formData.append('date', formMonth.trim())
    formData.append('time', 'TBA')
    formData.append('location', formVenue.trim() || 'CCIS Lobby')
    formData.append('category', formCategory)
    formData.append('description', formInvolved.trim() || 'CCIS IT Students')
    formData.append('status', formStatus)

    const res = await createEventAction(formData)
    if (!res.success) {
      toast(res.error || 'Failed to save event')
      return
    }

    const newActivity: ManagedActivity = {
      id: (res.data as { id: string })?.id || `act-${Date.now()}`,
      month: formMonth.trim(),
      activity: formActivity.trim(),
      involved: formInvolved.trim() || 'CCIS IT Students',
      venue: formVenue.trim() || 'CCIS Lobby',
      semester: formSemester,
      category: formCategory,
      status: formStatus,
      featured: formFeatured,
    }

    setEvents([newActivity, ...events])
    setShowAddModal(false)
    toast('Event saved to database!')
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingEvent) return

    const formData = new FormData()
    formData.append('title', formActivity.trim())
    formData.append('date', formMonth.trim())
    formData.append('time', 'TBA')
    formData.append('location', formVenue.trim() || 'CCIS Lobby')
    formData.append('category', formCategory)
    formData.append('description', formInvolved.trim() || 'CCIS IT Students')
    formData.append('status', formStatus)

    const res = await updateEventAction(editingEvent.id, formData)
    if (!res.success) {
      toast(res.error || 'Failed to update event')
      return
    }

    const updated: ManagedActivity = {
      ...editingEvent,
      month: formMonth.trim(),
      activity: formActivity.trim(),
      involved: formInvolved.trim(),
      venue: formVenue.trim(),
      semester: formSemester,
      category: formCategory,
      status: formStatus,
      featured: formFeatured,
    }

    setEvents(events.map((e) => (e.id === editingEvent.id ? updated : e)))
    setEditingEvent(null)
    toast('Event updated successfully in database!')
  }

  async function handleDelete(id: string) {
    setEvents(events.filter((e) => e.id !== id))
    setDeleteConfirmId(null)
    try {
      await deleteEventAction(id)
      toast('Event removed from database.')
    } catch {
      toast('Event removed from view.')
    }
  }

  function toggleFeatured(id: string) {
    setEvents(
      events.map((e) => (e.id === id ? { ...e, featured: !e.featured } : e))
    )
    toast('Event highlight toggled.')
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground-theme tracking-tight">
            Events & Calendar
          </h1>
          <p className="text-sm text-muted-foreground-theme mt-1">
            Schedule, manage, and coordinate PSITS-UA activities, general assemblies, and tech competitions.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] font-semibold text-sm transition-all duration-200 shadow-lg shadow-gold/10 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Activity</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            Total Activities
          </span>
          <span className="font-display font-black text-2xl text-foreground-theme mt-1 block">
            {events.length}
          </span>
        </div>
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            1st Semester
          </span>
          <span className="font-display font-black text-2xl text-amber-600 dark:text-gold mt-1 block">
            {firstSemCount}
          </span>
        </div>
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            2nd Semester
          </span>
          <span className="font-display font-black text-2xl text-sky-600 dark:text-sky-400 mt-1 block">
            {secondSemCount}
          </span>
        </div>
        <div className="bg-surface-theme border border-border-theme rounded-xl p-4 shadow-xs">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider block">
            Featured Highlights
          </span>
          <span className="font-display font-black text-2xl text-amber-500 mt-1 block">
            {featuredCount}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-theme border border-border-theme rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground-theme"
            />
            <input
              type="text"
              placeholder="Search by activity, venue, or participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Semester Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', '1st Semester (2026)', '2nd Semester (2027)'] as const).map((sem) => (
              <button
                key={sem}
                onClick={() => setSemesterFilter(sem)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  semesterFilter === sem
                    ? 'bg-gold/15 text-amber-600 dark:text-gold border border-gold/30 font-bold'
                    : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {sem === 'All' ? 'All Semesters' : sem.split(' ')[0] + ' Sem'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border-theme">
          <span className="text-[11px] text-muted-foreground-theme font-mono uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={12} /> Category:
          </span>
          {(['All', 'Governance', 'Competition', 'Social', 'Academic', 'Career'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-200 dark:bg-white/15 text-foreground-theme font-bold border border-slate-300 dark:border-white/20'
                  : 'text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.03]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <ManagementCardGridSkeleton count={4} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} className="text-slate-400 dark:text-white/20" />}
          title="No activities found"
          description="Try changing your search term, semester filter, or schedule a new event."
          action={
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add First Activity</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEvents.map((act) => {
            const isDeleting = deleteConfirmId === act.id

            return (
              <div
                key={act.id}
                className="group relative bg-surface-theme border border-border-theme hover:border-border-theme-strong rounded-xl p-5 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-sm"
              >
                <div className="space-y-3">
                  {/* Top Bar: Month + Category + Featured */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground-theme bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-md border border-border-theme">
                        <Clock size={12} className="text-muted-foreground-theme/70" />
                        {act.month}
                      </span>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                          categoryColorMap[act.category] || 'text-muted-foreground-theme bg-surface-theme border-border-theme'
                        }`}
                      >
                        {act.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFeatured(act.id)}
                        title={act.featured ? 'Featured Highlight' : 'Mark as Featured'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          act.featured
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-slate-400 dark:text-white/20 hover:text-amber-500 hover:bg-amber-500/10'
                        }`}
                      >
                        <Star size={14} className={act.featured ? 'fill-amber-500' : ''} />
                      </button>
                      <StatusBadge status={act.status || 'Scheduled'} />
                    </div>
                  </div>

                  {/* Activity Title */}
                  <div>
                    <h3 className="font-display font-bold text-foreground-theme text-base leading-snug group-hover:text-amber-600 dark:group-hover:text-gold transition-colors">
                      {act.activity}
                    </h3>
                  </div>

                  {/* Venue & Involved */}
                  <div className="space-y-1.5 pt-1 text-xs text-muted-foreground-theme font-mono">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-muted-foreground-theme/70 flex-shrink-0" />
                      <span className="truncate">{act.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-muted-foreground-theme/70 flex-shrink-0" />
                      <span className="truncate">{act.involved}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border-theme text-xs font-mono">
                  <span className="text-muted-foreground-theme text-[11px]">
                    {act.semester.includes('1st') ? '1st Semester' : '2nd Semester'}
                  </span>

                  <div className="flex items-center gap-1">
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                        <span className="text-red-500 text-[11px]">Confirm delete?</span>
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 rounded text-muted-foreground-theme hover:text-foreground-theme text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(act)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(act.id)}
                          className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-red-500 hover:bg-red-500/[0.08] transition-colors cursor-pointer"
                          title="Delete activity"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                  <CalendarDays size={18} />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                  Schedule New Activity
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
                <FormField label="Activity Title" required>
                  <input
                    type="text"
                    placeholder="e.g. IT Hackathon & CodeFest 2026"
                    value={formActivity}
                    onChange={(e) => setFormActivity(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Target Schedule / Month" required>
                    <input
                      type="text"
                      placeholder="e.g. October 2026"
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>

                  <FormField label="Target Venue" required>
                    <input
                      type="text"
                      placeholder="e.g. CCIS Computer Lab 2"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Involved / Target Participants" required>
                  <input
                    type="text"
                    placeholder="e.g. 1st - 4th Year BSIT Students"
                    value={formInvolved}
                    onChange={(e) => setFormInvolved(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <FormField label="Semester">
                    <Select
                      value={formSemester}
                      onChange={(val) => setFormSemester(val as Activity['semester'])}
                      options={semesterOptions}
                    />
                  </FormField>

                  <FormField label="Category">
                    <Select
                      value={formCategory}
                      onChange={(val) => setFormCategory(val as Activity['category'])}
                      options={categoryOptions}
                    />
                  </FormField>

                  <FormField label="Status">
                    <Select
                      value={formStatus}
                      onChange={(val) => setFormStatus(val as EventStatus)}
                      options={statusOptions}
                    />
                  </FormField>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/5 border border-border-theme text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground-theme font-medium">
                      Feature on public homepage highlights
                    </span>
                  </label>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
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
                  <span>Save Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {editingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setEditingEvent(null)}
        >
          <div
            className="bg-white dark:bg-[#0e1422] border border-border-theme rounded-xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                  <Edit2 size={18} />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-foreground-theme">
                  Edit Activity Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4 scrollbar-minimal overscroll-contain">
                <FormField label="Activity Title" required>
                  <input
                    type="text"
                    value={formActivity}
                    onChange={(e) => setFormActivity(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField label="Schedule / Month" required>
                    <input
                      type="text"
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>

                  <FormField label="Venue" required>
                    <input
                      type="text"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      className={inputStyles}
                      required
                    />
                  </FormField>
                </div>

                <FormField label="Involved / Target Participants" required>
                  <input
                    type="text"
                    value={formInvolved}
                    onChange={(e) => setFormInvolved(e.target.value)}
                    className={inputStyles}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <FormField label="Semester">
                    <Select
                      value={formSemester}
                      onChange={(val) => setFormSemester(val as Activity['semester'])}
                      options={semesterOptions}
                    />
                  </FormField>

                  <FormField label="Category">
                    <Select
                      value={formCategory}
                      onChange={(val) => setFormCategory(val as Activity['category'])}
                      options={categoryOptions}
                    />
                  </FormField>

                  <FormField label="Status">
                    <Select
                      value={formStatus}
                      onChange={(val) => setFormStatus(val as EventStatus)}
                      options={statusOptions}
                    />
                  </FormField>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formFeatured}
                      onChange={(e) => setFormFeatured(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/5 border border-border-theme text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    <span className="text-xs font-mono text-muted-foreground-theme font-medium">
                      Feature on public homepage highlights
                    </span>
                  </label>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-border-theme flex-shrink-0 bg-slate-50 dark:bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-lg border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  <Save size={14} />
                  <span>Update Activity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
