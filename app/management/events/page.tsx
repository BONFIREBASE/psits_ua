'use client'

import { useState, type FormEvent } from 'react'
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
  calendarActivities as initialActivities,
  type Activity,
} from '@/data/events'
import FormField, { inputStyles } from '../_components/FormField'
import Select from '../_components/Select'
import StatusBadge from '../_components/StatusBadge'
import EmptyState from '../_components/EmptyState'
import { useToast } from '../_components/Toast'

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
  const [events, setEvents] = useState<ManagedActivity[]>(() =>
    initialActivities.map((act) => ({
      ...act,
      status: 'Scheduled',
    }))
  )
  const [search, setSearch] = useState('')
  const [semesterFilter, setSemesterFilter] = useState<'All' | Activity['semester']>('All')
  const [categoryFilter, setCategoryFilter] = useState<'All' | Activity['category']>('All')

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

  function handleSaveNew(e: FormEvent) {
    e.preventDefault()
    if (!formActivity.trim() || !formMonth.trim()) {
      toast('Please provide an activity title and schedule.')
      return
    }

    const newActivity: ManagedActivity = {
      id: `act-${Date.now()}`,
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
    toast('Event added to calendar. (Placeholder)')
    console.log('[Management] Created event:', newActivity)
  }

  function handleSaveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingEvent) return

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
    toast('Event updated successfully. (Placeholder)')
    console.log('[Management] Updated event:', updated)
  }

  function handleDelete(id: string) {
    setEvents(events.filter((e) => e.id !== id))
    setDeleteConfirmId(null)
    toast('Event removed from calendar. (Placeholder)')
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
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
            Events & Calendar
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Schedule, manage, and coordinate PSITS-UA activities, general assemblies, and tech competitions.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] font-semibold text-sm transition-all duration-200 shadow-lg shadow-gold/10"
        >
          <Plus size={16} />
          <span>New Activity</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
          <span className="text-[11px] text-white/35 font-mono uppercase tracking-wider block">
            Total Activities
          </span>
          <span className="font-display font-black text-2xl text-white mt-1 block">
            {events.length}
          </span>
        </div>
        <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
          <span className="text-[11px] text-white/35 font-mono uppercase tracking-wider block">
            1st Semester
          </span>
          <span className="font-display font-black text-2xl text-gold mt-1 block">
            {firstSemCount}
          </span>
        </div>
        <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
          <span className="text-[11px] text-white/35 font-mono uppercase tracking-wider block">
            2nd Semester
          </span>
          <span className="font-display font-black text-2xl text-sky-400 mt-1 block">
            {secondSemCount}
          </span>
        </div>
        <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4">
          <span className="text-[11px] text-white/35 font-mono uppercase tracking-wider block">
            Featured Highlights
          </span>
          <span className="font-display font-black text-2xl text-amber-300 mt-1 block">
            {featuredCount}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
            />
            <input
              type="text"
              placeholder="Search by activity, venue, or participants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Semester Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', '1st Semester (2026)', '2nd Semester (2027)'] as const).map((sem) => (
              <button
                key={sem}
                onClick={() => setSemesterFilter(sem)}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  semesterFilter === sem
                    ? 'bg-gold/15 text-gold border border-gold/30'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {sem === 'All' ? 'All Semesters' : sem.split(' ')[0] + ' Sem'}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-white/6">
          <span className="text-[11px] text-white/30 font-mono uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter size={12} /> Category:
          </span>
          {(['All', 'Governance', 'Competition', 'Social', 'Academic', 'Career'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-200 ${
                categoryFilter === cat
                  ? 'bg-white/15 text-white font-medium border border-white/20'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/[0.03]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={24} className="text-white/20" />}
          title="No activities found"
          description="Try changing your search term, semester filter, or schedule a new event."
          action={
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors"
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
                className="group relative bg-[#0d121f] border border-white/6 hover:border-white/12 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Month + Category + Featured */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-white/60 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/6">
                        <Clock size={12} className="text-white/40" />
                        {act.month}
                      </span>
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                          categoryColorMap[act.category] || 'text-white/50 bg-white/5 border-white/10'
                        }`}
                      >
                        {act.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFeatured(act.id)}
                        title={act.featured ? 'Featured Highlight' : 'Mark as Featured'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          act.featured
                            ? 'text-amber-400 bg-amber-400/10'
                            : 'text-white/20 hover:text-white/60 hover:bg-white/[0.04]'
                        }`}
                      >
                        <Star size={14} className={act.featured ? 'fill-amber-400' : ''} />
                      </button>
                      <StatusBadge status={act.status || 'Scheduled'} />
                    </div>
                  </div>

                  {/* Activity Title */}
                  <div>
                    <h3 className="font-display font-bold text-white text-base leading-snug group-hover:text-gold transition-colors">
                      {act.activity}
                    </h3>
                  </div>

                  {/* Venue & Involved */}
                  <div className="space-y-1.5 pt-1 text-xs text-white/45 font-mono">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-white/30 flex-shrink-0" />
                      <span className="truncate">{act.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-white/30 flex-shrink-0" />
                      <span className="truncate">{act.involved}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/6 text-xs font-mono">
                  <span className="text-white/30 text-[11px]">
                    {act.semester.includes('1st') ? '1st Semester' : '2nd Semester'}
                  </span>

                  <div className="flex items-center gap-1">
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                        <span className="text-red-400 text-[11px]">Confirm delete?</span>
                        <button
                          onClick={() => handleDelete(act.id)}
                          className="px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-semibold transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 rounded text-white/40 hover:text-white text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(act)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(act.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
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
            className="bg-[#0e1422] border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/6 flex-shrink-0 bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                  <CalendarDays size={18} />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-white">
                  Schedule New Activity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
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
                    placeholder="e.g. All CCIS IT Students & Faculty"
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
                      className="w-4 h-4 rounded bg-white/5 border border-white/20 text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    <span className="text-xs font-mono text-white/80">
                      Feature on public homepage highlights
                    </span>
                  </label>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-white/6 flex-shrink-0 bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04] text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm"
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
            className="bg-[#0e1422] border border-white/10 rounded-xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pinned Header */}
            <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-white/6 flex-shrink-0 bg-[#0e1422]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                  <Edit2 size={18} />
                </div>
                <h2 className="font-display font-bold text-base sm:text-lg text-white">
                  Edit Activity Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
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
                      className="w-4 h-4 rounded bg-white/5 border border-white/20 text-gold focus:ring-gold/30 focus:ring-offset-0"
                    />
                    <span className="text-xs font-mono text-white/80">
                      Feature on public homepage highlights
                    </span>
                  </label>
                </div>
              </div>

              {/* Pinned Footer */}
              <div className="flex items-center justify-end gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-t border-white/6 flex-shrink-0 bg-[#0e1422]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.04] text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-[#0a0e17] text-xs font-bold transition-colors shadow-sm"
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
