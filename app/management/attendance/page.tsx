'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  X,
  Save,
  CalendarDays,
  Clock,
  MapPin,
  QrCode,
  RefreshCw,
  Download,
  Users,
  ClipboardList,
  AlertTriangle,
  Trash2,
  Eye,
  Camera,
  Award,
  Sparkles,
} from 'lucide-react'
import { officers as allOfficers } from '@/data/officers'
import FormField, { inputStyles } from '../_components/FormField'
import Select from '../_components/Select'
import EmptyState from '../_components/EmptyState'
import { useToast } from '../_components/Toast'
import { supabase } from '@/lib/supabase'
import {
  MeetingStore,
  QRStore,
  AttendanceStore,
  PointStore,
  computeOfficerStanding,
  type Meeting,
  type OfficerQR,
  type AttendanceRecord,
  type AttendanceStatus,
  type OfficerStanding,
} from '../_context/attendance-store'

/* ─── Types & Constants ─── */

type Tab = 'meetings' | 'qrcodes' | 'standing'

const tabConfig: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
  { key: 'meetings', label: 'Meetings', icon: CalendarDays },
  { key: 'qrcodes', label: 'QR Codes', icon: QrCode },
  { key: 'standing', label: 'Standing & Credit Score', icon: Award },
]

const meetingTypeOptions = [
  { value: 'regular', label: 'Regular Meeting' },
  { value: 'emergency', label: 'Emergency Meeting' },
]

const meetingStatusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

/* ─── Helpers ─── */

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

function getStatusColor(status: Meeting['status']): string {
  switch (status) {
    case 'scheduled':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/25'
    case 'active':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
    case 'completed':
      return 'bg-white/8 text-white/40 border-white/10'
    case 'cancelled':
      return 'bg-red-500/15 text-red-400 border-red-500/25'
    default:
      return 'bg-white/8 text-white/40 border-white/10'
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter((w) => !['Jr.', 'II', 'III', 'IV'].includes(w))
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function AttendanceManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('meetings')

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-2xl text-foreground-theme tracking-tight">
          Attendance System
        </h1>
        <p className="text-sm text-muted-foreground-theme mt-1">
          Manage meetings, officer QR codes, and track attendance.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-border-theme w-fit">
        {tabConfig.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
              ${activeTab === tab.key
                ? 'bg-gold/15 text-amber-600 dark:text-gold shadow-xs font-bold'
                : 'text-muted-foreground-theme hover:text-foreground-theme'
              }
            `}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'meetings' && <MeetingsTab />}
      {activeTab === 'qrcodes' && <QRCodesTab />}
      {activeTab === 'standing' && <OfficerStandingTab />}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MEETINGS TAB
   ═══════════════════════════════════════════════════ */

function MeetingsTab() {
  const { toast } = useToast()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<'regular' | 'emergency'>('regular')
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const refreshMeetings = useCallback(() => {
    setMeetings(MeetingStore.getAll())
  }, [])

  // Attendance Roster Modal state
  const [rosterMeeting, setRosterMeeting] = useState<Meeting | null>(null)
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterRecords, setRosterRecords] = useState<AttendanceRecord[]>([])

  const refreshRosterRecords = useCallback((meetingId: string) => {
    setRosterRecords(AttendanceStore.getByMeeting(meetingId))
  }, [])

  function handleOpenRoster(meeting: Meeting) {
    setRosterMeeting(meeting)
    setRosterRecords(AttendanceStore.getByMeeting(meeting.id))
  }

  function handleSetOfficerStatus(
    meetingId: string,
    officerName: string,
    position: string,
    status: AttendanceStatus
  ) {
    AttendanceStore.setStatus(meetingId, officerName, position, status)
    refreshRosterRecords(meetingId)
    refreshMeetings()
    toast(`${officerName} marked as ${status}.`)
  }

  useEffect(() => {
    async function initMeetings() {
      await MeetingStore.syncWithSupabase()
      refreshMeetings()
    }
    initMeetings()

    const channel = supabase
      .channel('attendance-meetings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_meetings' },
        async () => {
          await MeetingStore.syncWithSupabase()
          refreshMeetings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshMeetings])

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.location.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase())
  )

  function resetForm() {
    setFormTitle('')
    setFormType('regular')
    setFormDate('')
    setFormStartTime('')
    setFormEndTime('')
    setFormLocation('')
    setFormDescription('')
  }

  function handleCreate() {
    if (!formTitle || !formDate || !formStartTime || !formEndTime) {
      toast('Please fill in all required fields.')
      return
    }
    MeetingStore.create({
      title: formTitle,
      type: formType,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      location: formLocation,
      description: formDescription,
      createdBy: 'admin',
    })
    resetForm()
    setShowAddModal(false)
    refreshMeetings()
    toast('Meeting created successfully.')
  }

  function handleStatusChange(id: string, status: Meeting['status']) {
    MeetingStore.update(id, { status })
    refreshMeetings()
    toast(`Meeting status updated to "${status}".`)
  }

  function handleDelete(id: string) {
    MeetingStore.delete(id)
    setDeleteConfirmId(null)
    refreshMeetings()
    toast('Meeting deleted.')
  }

  return (
    <>
      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground-theme" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search meetings..."
            className="w-full bg-surface-theme border border-border-theme rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit cursor-pointer"
        >
          <Plus size={16} />
          <span>New Meeting</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="border border-gold/20 rounded-xl bg-surface-theme p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-foreground-theme">Create New Meeting</h3>
            <button onClick={() => { setShowAddModal(false); resetForm() }} className="text-muted-foreground-theme hover:text-foreground-theme transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Title" htmlFor="meeting-title" required>
              <input id="meeting-title" type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. General Assembly" className={inputStyles} />
            </FormField>
            <FormField label="Type" required>
              <Select
                id="meeting-type"
                value={formType}
                onChange={(val) => setFormType(val as 'regular' | 'emergency')}
                options={meetingTypeOptions}
              />
            </FormField>
            <FormField label="Date" htmlFor="meeting-date" required>
              <input id="meeting-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className={inputStyles} />
            </FormField>
            <FormField label="Location" htmlFor="meeting-location">
              <input id="meeting-location" type="text" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="e.g. CCIS Room 201" className={inputStyles} />
            </FormField>
            <FormField label="Start Time" htmlFor="meeting-start" required>
              <input id="meeting-start" type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} className={inputStyles} />
            </FormField>
            <FormField label="End Time" htmlFor="meeting-end" required>
              <input id="meeting-end" type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} className={inputStyles} />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="meeting-desc">
            <textarea
              id="meeting-desc"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Brief description of the meeting agenda..."
              rows={3}
              className={`${inputStyles} resize-none`}
            />
          </FormField>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors cursor-pointer">
              <Save size={13} /> Create Meeting
            </button>
            <button onClick={() => { setShowAddModal(false); resetForm() }} className="px-3 py-2 rounded-lg text-xs text-muted-foreground-theme border border-border-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meetings List */}
      <div className="space-y-3">
        {filtered.map((meeting) => {
          const attendees = AttendanceStore.getByMeeting(meeting.id)
          return (
            <div
              key={meeting.id}
              className="border border-border-theme hover:border-gold/30 rounded-xl bg-surface-theme shadow-xs transition-all duration-300 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-display font-bold text-base text-foreground-theme">
                      {meeting.title}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                    {meeting.type === 'emergency' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25">
                        <AlertTriangle size={9} />
                        Emergency
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground-theme flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={12} />
                      {formatDate(meeting.date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} />
                      {formatTime(meeting.startTime)} – {formatTime(meeting.endTime)}
                    </span>
                    {meeting.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={12} />
                        {meeting.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={12} />
                      {attendees.filter((a) => a.status !== 'absent').length} logged
                    </span>
                  </div>
                  {meeting.description && (
                    <p className="text-xs text-muted-foreground-theme/70 mt-1 line-clamp-2">{meeting.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenRoster(meeting)}
                    title="Edit Attendance (Present / Late / Absent)"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-border-theme text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:border-gold/30 hover:bg-gold/[0.06] transition-all flex items-center justify-center cursor-pointer"
                  >
                    <ClipboardList size={15} />
                  </button>
                  <Link
                    href="/camera"
                    onClick={() => {
                      if (meeting.status !== 'active') {
                        MeetingStore.update(meeting.id, { status: 'active' })
                      }
                    }}
                    title="Open Attendance Scanner"
                    className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:text-amber-500 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Camera size={15} />
                  </Link>
                  <Select
                    id={`status-${meeting.id}`}
                    value={meeting.status}
                    onChange={(val) => handleStatusChange(meeting.id, val as Meeting['status'])}
                    options={meetingStatusOptions}
                  />
                  {deleteConfirmId === meeting.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(meeting.id)}
                        className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 transition-colors cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1.5 rounded-lg text-[10px] text-muted-foreground-theme border border-border-theme hover:text-foreground-theme transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(meeting.id)}
                      className="p-2 rounded-lg text-muted-foreground-theme hover:text-red-500 hover:bg-red-500/[0.06] transition-all cursor-pointer"
                      title="Delete meeting"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<CalendarDays size={24} className="text-muted-foreground-theme" />}
          title="No meetings yet"
          description="Create your first meeting to start tracking attendance."
        />
      )}

      {/* Meeting Attendance Roster Modal */}
      {rosterMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setRosterMeeting(null)}
        >
          <div
            className="bg-white dark:bg-[#121929] border border-border-theme rounded-2xl p-5 sm:p-6 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-border-theme">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base text-foreground-theme">
                    {rosterMeeting.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(rosterMeeting.status)}`}>
                    {rosterMeeting.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground-theme mt-1">
                  {formatDate(rosterMeeting.date)} · {formatTime(rosterMeeting.startTime)} – {formatTime(rosterMeeting.endTime)}
                  {rosterMeeting.location && ` · ${rosterMeeting.location}`}
                </p>
              </div>
              <button
                onClick={() => setRosterMeeting(null)}
                className="text-muted-foreground-theme hover:text-foreground-theme p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Count Summary */}
            {(() => {
              const presentCount = rosterRecords.filter((r) => r.status === 'present' || (!r.status && r.scannedAt)).length
              const lateCount = rosterRecords.filter((r) => r.status === 'late').length
              const absentCount = allOfficers.length - (presentCount + lateCount)

              return (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center">
                    <span className="text-base font-display font-black text-emerald-600 dark:text-emerald-400">{presentCount}</span>
                    <span className="text-[10px] block font-mono text-muted-foreground-theme uppercase tracking-wider">Present</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-center">
                    <span className="text-base font-display font-black text-amber-600 dark:text-amber-400">{lateCount}</span>
                    <span className="text-[10px] block font-mono text-muted-foreground-theme uppercase tracking-wider">Late</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-center">
                    <span className="text-base font-display font-black text-red-600 dark:text-red-400">{Math.max(0, absentCount)}</span>
                    <span className="text-[10px] block font-mono text-muted-foreground-theme uppercase tracking-wider">Absent</span>
                  </div>
                </div>
              )
            })()}

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground-theme" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search officer name or position..."
                className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none focus:border-gold/50"
              />
            </div>

            {/* Officer List with 3-Way Status Toggle */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[220px]">
              {allOfficers
                .filter(
                  (o) =>
                    o.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                    o.position.toLowerCase().includes(rosterSearch.toLowerCase())
                )
                .map((officer) => {
                  const record = rosterRecords.find((r) => r.officerName === officer.name)
                  const currentStatus: AttendanceStatus = record ? (record.status || 'present') : 'absent'

                  return (
                    <div
                      key={officer.name}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-border-theme hover:border-gold/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border-theme flex items-center justify-center font-display font-bold text-[10px] text-gold/80 shrink-0">
                          {getInitials(officer.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-xs text-foreground-theme truncate">
                            {officer.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground-theme truncate">
                              {officer.position}
                            </span>
                            {record?.method === 'qr' && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                                QR
                              </span>
                            )}
                            {record?.method === 'manual' && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold">
                                Manual
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3-Way Toggle */}
                      <div className="flex items-center gap-1 bg-slate-200 dark:bg-black/40 p-1 rounded-xl border border-border-theme shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() =>
                            handleSetOfficerStatus(rosterMeeting.id, officer.name, officer.position, 'present')
                          }
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-muted-foreground-theme hover:text-foreground-theme'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() =>
                            handleSetOfficerStatus(rosterMeeting.id, officer.name, officer.position, 'late')
                          }
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-muted-foreground-theme hover:text-foreground-theme'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() =>
                            handleSetOfficerStatus(rosterMeeting.id, officer.name, officer.position, 'absent')
                          }
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-red-500 text-white shadow-xs'
                              : 'text-muted-foreground-theme hover:text-foreground-theme'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-border-theme flex justify-end">
              <button
                onClick={() => setRosterMeeting(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-foreground-theme transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════
   QR CODES TAB
   ═══════════════════════════════════════════════════ */

function QRCodesTab() {
  const { toast } = useToast()
  const [qrCodes, setQRCodes] = useState<OfficerQR[]>([])
  const [search, setSearch] = useState('')
  const [generatingAll, setGeneratingAll] = useState(false)
  const [previewQR, setPreviewQR] = useState<OfficerQR | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [confirmRegenOfficer, setConfirmRegenOfficer] = useState<{ name: string; position: string } | null>(null)
  const [showConfirmRegenAll, setShowConfirmRegenAll] = useState(false)

  const refreshQR = useCallback(() => {
    setQRCodes(QRStore.getAll())
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshQR()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshQR])

  const officersWithQR = allOfficers.map((officer) => ({
    ...officer,
    qr: qrCodes.find((q) => q.officerName === officer.name),
  }))

  const filtered = officersWithQR.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.position.toLowerCase().includes(search.toLowerCase())
  )

  function handleGenerate(name: string, position: string) {
    QRStore.generate(name, position)
    refreshQR()
    toast(`QR code generated for ${name}.`)
  }

  function executeGenerateAll() {
    setGeneratingAll(true)
    QRStore.generateAll(allOfficers.map((o) => ({ name: o.name, position: o.position })))
    refreshQR()
    setGeneratingAll(false)
    toast('QR codes generated for all officers.')
  }

  function handleGenerateAllClick() {
    if (qrCodes.length > 0) {
      setShowConfirmRegenAll(true)
    } else {
      executeGenerateAll()
    }
  }

  async function handlePreview(qr: OfficerQR) {
    setPreviewQR(qr)
    try {
      const QRCode = (await import('qrcode')).default
      const payload = QRStore.buildPayload(qr.token)
      const url = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#F5A623',
          light: '#0D1117',
        },
      })
      setQrImageUrl(url)
    } catch {
      toast('Failed to generate QR preview.')
    }
  }

  async function handleDownload(qr: OfficerQR) {
    try {
      const QRCode = (await import('qrcode')).default
      const payload = QRStore.buildPayload(qr.token)
      const url = await QRCode.toDataURL(payload, {
        width: 600,
        margin: 2,
        color: {
          dark: '#F5A623',
          light: '#0D1117',
        },
      })
      const link = document.createElement('a')
      link.href = url
      link.download = `PSITS-QR-${qr.officerName.replace(/\s+/g, '-')}.png`
      link.click()
      toast(`QR downloaded for ${qr.officerName}.`)
    } catch {
      toast('Failed to download QR.')
    }
  }

  return (
    <>
      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground-theme" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search officers..."
            className="w-full bg-surface-theme border border-border-theme rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
          />
        </div>
        <button
          onClick={handleGenerateAllClick}
          disabled={generatingAll}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-gold to-[#FFA726] text-[#0D1117] font-display font-bold text-sm hover:shadow-[0_4px_16px_rgba(245,166,35,0.3)] active:scale-[0.97] transition-all duration-200 w-fit disabled:opacity-50 cursor-pointer"
        >
          <QrCode size={16} />
          <span>{generatingAll ? 'Generating...' : 'Generate All QR'}</span>
        </button>
      </div>

      {/* Officers Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((officer) => (
          <div
            key={officer.name}
            className="group border border-border-theme hover:border-gold/30 rounded-xl bg-surface-theme shadow-xs transition-all duration-300 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy via-surface to-navy border border-gold/15 flex items-center justify-center font-display font-bold text-xs text-gold/80 flex-shrink-0">
                {getInitials(officer.name)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[9px] text-amber-600 dark:text-gold/80 font-bold uppercase tracking-[0.15em] block mb-0.5">
                  {officer.position}
                </span>
                <h4 className="font-display font-bold text-sm text-foreground-theme leading-tight truncate">
                  {officer.name}
                </h4>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border-theme flex items-center justify-between">
              {officer.qr ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${officer.qr.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] text-muted-foreground-theme font-mono">
                      {officer.qr.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(officer.qr!)}
                      className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-gold/[0.06] transition-all cursor-pointer"
                      title="Preview QR"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => handleDownload(officer.qr!)}
                      className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-gold hover:bg-gold/[0.06] transition-all cursor-pointer"
                      title="Download QR"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmRegenOfficer({ name: officer.name, position: officer.position })}
                      className="p-1.5 rounded-lg text-muted-foreground-theme hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/[0.06] transition-all cursor-pointer"
                      title="Regenerate QR"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleGenerate(officer.name, officer.position)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 dark:text-gold bg-gold/[0.08] border border-gold/20 hover:bg-gold/15 transition-all w-full justify-center cursor-pointer"
                >
                  <QrCode size={11} />
                  Generate QR
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Preview Modal */}
      {previewQR && qrImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setPreviewQR(null); setQrImageUrl(null) }}>
          <div className="bg-white dark:bg-[#121929] border border-border-theme rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-foreground-theme">QR Code Preview</h3>
              <button onClick={() => { setPreviewQR(null); setQrImageUrl(null) }} className="text-muted-foreground-theme hover:text-foreground-theme transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt={`QR for ${previewQR.officerName}`} className="w-48 h-48 rounded-xl bg-white p-2 border border-border-theme" />
              <div className="text-center">
                <p className="font-display font-bold text-sm text-foreground-theme">{previewQR.officerName}</p>
                <p className="text-[11px] text-amber-600 dark:text-gold/80 font-mono uppercase tracking-wider font-semibold">{previewQR.position}</p>
                <p className="text-[10px] text-muted-foreground-theme mt-1 font-mono">
                  Token: {previewQR.token.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleDownload(previewQR)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-colors cursor-pointer shadow-xs"
              >
                <Download size={13} />
                Download PNG
              </button>
              <button
                onClick={() => setConfirmRegenOfficer({ name: previewQR.officerName, position: previewQR.position })}
                className="px-3 py-2 rounded-lg text-xs text-muted-foreground-theme border border-border-theme hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400/20 transition-colors cursor-pointer"
                title="Regenerate QR"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Officer QR Regenerate Confirmation Modal */}
      {confirmRegenOfficer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setConfirmRegenOfficer(null)}
        >
          <div
            className="bg-white dark:bg-[#121929] border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-base text-foreground-theme">
                Regenerate QR Code?
              </h3>
              <p className="text-xs font-semibold text-amber-600 dark:text-gold">
                {confirmRegenOfficer.name} · {confirmRegenOfficer.position}
              </p>
              <p className="text-xs text-muted-foreground-theme leading-relaxed pt-1">
                This will immediately invalidate their current QR code. Any physical ID printed with the old code will no longer work for attendance.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmRegenOfficer(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleGenerate(confirmRegenOfficer.name, confirmRegenOfficer.position)
                  setConfirmRegenOfficer(null)
                  if (previewQR?.officerName === confirmRegenOfficer.name) {
                    setPreviewQR(null)
                    setQrImageUrl(null)
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0D1117] text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate All Confirmation Modal */}
      {showConfirmRegenAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowConfirmRegenAll(false)}
        >
          <div
            className="bg-white dark:bg-[#121929] border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-display font-bold text-base text-foreground-theme">
                Regenerate All QR Codes?
              </h3>
              <p className="text-xs text-muted-foreground-theme leading-relaxed pt-1">
                Active QR codes already exist. Regenerating all codes will invalidate all previously printed officer IDs at once.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirmRegenAll(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmRegenAll(false)
                  executeGenerateAll()
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0D1117] text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RefreshCw size={13} />
                Regenerate All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════
   RADIAL PIE-STYLE CREDIT SCORE GAUGE
   ═══════════════════════════════════════════════════ */

function CreditScoreGauge({ score, tier }: { score: number; tier: OfficerStanding['tier'] }) {
  const size = 114
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, Math.max(0, score / 110))
  const strokeDashoffset = circumference - progress * circumference

  const strokeColor =
    tier === 'max'
      ? '#F5A623'
      : tier === 'high'
      ? '#0284C7'
      : tier === 'warning'
      ? '#D97706'
      : tier === 'critical'
      ? '#E11D48'
      : '#059669'

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-slate-200 dark:text-white/[0.08]"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${strokeColor}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="font-display font-black text-xl text-foreground-theme tracking-tight leading-none">
          {score}
        </span>
        <span className="text-[9px] font-mono text-muted-foreground-theme uppercase tracking-wider mt-1">
          / 110 PTS
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   OFFICER STANDING & CREDIT SCORE TAB (WHITEBOARD SPEC)
   ═══════════════════════════════════════════════════ */

function OfficerStandingTab() {
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [standings, setStandings] = useState<OfficerStanding[]>([])
  const [adjustTarget, setAdjustTarget] = useState<OfficerStanding | null>(null)

  // Point adjustment modal state
  const [adjustPoints, setAdjustPoints] = useState<number>(5)
  const [adjustReason, setAdjustReason] = useState<'contribution' | 'assessment' | 'negligence' | 'custom'>('contribution')
  const [adjustNote, setAdjustNote] = useState('')

  const refreshStandings = useCallback(() => {
    const list = allOfficers.map((o) => computeOfficerStanding(o.name, o.position))
    setStandings(list)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshStandings()
    }, 0)
    return () => clearTimeout(timer)
  }, [refreshStandings])

  function handleAddAdjustment() {
    if (!adjustTarget) return
    PointStore.add({
      officerName: adjustTarget.officerName,
      points: Number(adjustPoints),
      reason: adjustReason,
      note: adjustNote.trim() || undefined,
    })
    refreshStandings()
    setAdjustTarget(null)
    setAdjustNote('')
    toast(`Points updated for ${adjustTarget.officerName}.`)
  }

  // Summary tallies
  const maxTierCount = standings.filter((s) => s.tier === 'max').length
  const highTierCount = standings.filter((s) => s.tier === 'high').length
  const warningCount = standings.filter((s) => s.tier === 'warning').length
  const criticalCount = standings.filter((s) => s.tier === 'critical').length

  const filtered = standings.filter((s) => {
    const matchesSearch =
      s.officerName.toLowerCase().includes(search.toLowerCase()) ||
      s.position.toLowerCase().includes(search.toLowerCase())
    if (!matchesSearch) return false
    if (filterTier === 'all') return true
    return s.tier === filterTier
  })

  return (
    <>
      {/* Overview Header / Rules Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-border-theme rounded-xl bg-surface-theme p-4 text-center shadow-xs">
          <p className="text-2xl font-display font-black text-foreground-theme">{standings.length}</p>
          <p className="text-[10px] text-muted-foreground-theme font-mono uppercase tracking-wider mt-1">Officers</p>
        </div>
        <div className="border border-gold/20 rounded-xl bg-gold/[0.04] p-4 text-center shadow-xs">
          <p className="text-2xl font-display font-black text-amber-600 dark:text-gold flex items-center justify-center gap-1">
            <Sparkles size={16} />
            {maxTierCount}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-gold/80 font-mono uppercase tracking-wider mt-1">110 Honor Tier</p>
        </div>
        <div className="border border-sky-500/20 rounded-xl bg-sky-500/[0.04] p-4 text-center shadow-xs">
          <p className="text-2xl font-display font-black text-sky-600 dark:text-sky-400">{highTierCount}</p>
          <p className="text-[10px] text-sky-600 dark:text-sky-400/80 font-mono uppercase tracking-wider mt-1">105 High Tier</p>
        </div>
        <div className="border border-amber-500/20 rounded-xl bg-amber-500/[0.04] p-4 text-center shadow-xs">
          <p className="text-2xl font-display font-black text-amber-600 dark:text-amber-400">{warningCount}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400/80 font-mono uppercase tracking-wider mt-1">Warning (80)</p>
        </div>
        <div className="border border-red-500/20 rounded-xl bg-red-500/[0.04] p-4 text-center col-span-2 sm:col-span-1 shadow-xs">
          <p className="text-2xl font-display font-black text-red-600 dark:text-red-400">{criticalCount}</p>
          <p className="text-[10px] text-red-600 dark:text-red-400/80 font-mono uppercase tracking-wider mt-1">Removal (≤75)</p>
        </div>
      </div>

      {/* Search & Tier Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground-theme" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search officer standing..."
            className="w-full bg-surface-theme border border-border-theme rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none focus:border-gold/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'All Officers' },
            { key: 'max', label: '110 Honor Tier' },
            { key: 'high', label: '105 High Tier' },
            { key: 'normal', label: 'Good Standing' },
            { key: 'warning', label: 'Warning (80)' },
            { key: 'critical', label: 'Removal (≤75)' },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilterTier(pill.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                filterTier === pill.key
                  ? 'bg-slate-200 dark:bg-white/15 text-foreground-theme font-bold border border-border-theme'
                  : 'text-muted-foreground-theme hover:text-foreground-theme border border-border-theme hover:bg-slate-100 dark:hover:bg-white/[0.02]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Officer Credit Score Cards Grid */}
      <div className="grid md:grid-cols-2 gap-3.5">
        {filtered.map((s) => {
          return (
            <div
              key={s.officerName}
              className={`relative border rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-xs ${
                s.tier === 'max'
                  ? 'bg-gradient-to-br from-gold/[0.08] via-surface-theme to-gold/[0.02] border-gold/30 hover:border-gold/50'
                  : s.tier === 'high'
                  ? 'bg-gradient-to-br from-sky-500/[0.06] via-surface-theme to-transparent border-sky-500/25 hover:border-sky-500/40'
                  : s.tier === 'warning'
                  ? 'bg-gradient-to-br from-amber-500/[0.06] via-surface-theme to-transparent border-amber-500/30 hover:border-amber-500/50'
                  : s.tier === 'critical'
                  ? 'bg-gradient-to-br from-red-500/[0.08] via-surface-theme to-transparent border-red-500/35 hover:border-red-500/60'
                  : 'bg-surface-theme border-border-theme hover:border-gold/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Radial Credit Gauge */}
                <CreditScoreGauge score={s.score} tier={s.tier} />

                {/* Officer Information & Details */}
                <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="font-display font-bold text-sm text-foreground-theme truncate">
                        {s.officerName}
                      </h4>
                      <p className="text-[10px] text-amber-600 dark:text-gold/80 font-mono uppercase tracking-wider font-semibold">
                        {s.position}
                      </p>
                    </div>

                    {/* Tier Badge */}
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border self-center sm:self-auto ${
                        s.tier === 'max'
                          ? 'bg-gold/15 text-amber-700 dark:text-gold border-gold/30'
                          : s.tier === 'high'
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30'
                          : s.tier === 'warning'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : s.tier === 'critical'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      {s.tier === 'max' && '110 Honor Tier'}
                      {s.tier === 'high' && '105 High Tier'}
                      {s.tier === 'normal' && 'Good Standing'}
                      {s.tier === 'warning' && 'Warning Tier'}
                      {s.tier === 'critical' && 'Removal Risk'}
                    </span>
                  </div>

                  {/* Leave Credits (Whiteboard System) */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-border-theme space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground-theme border-b border-border-theme pb-1">
                      <span>Leave Privileges Available</span>
                      <span className="text-foreground-theme font-bold">
                        {s.leavesAvailable.medical > 0
                          ? `${s.leavesAvailable.medical} each`
                          : 'No leaves (need 105+)'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="px-1.5 py-1 rounded bg-white dark:bg-white/[0.03] border border-border-theme">
                        <span className="block text-[9px] text-muted-foreground-theme">Medical</span>
                        <span className="text-xs font-bold text-foreground-theme">
                          {s.leavesAvailable.medical}
                        </span>
                      </div>
                      <div className="px-1.5 py-1 rounded bg-white dark:bg-white/[0.03] border border-border-theme">
                        <span className="block text-[9px] text-muted-foreground-theme">Personal</span>
                        <span className="text-xs font-bold text-foreground-theme">
                          {s.leavesAvailable.personal}
                        </span>
                      </div>
                      <div className="px-1.5 py-1 rounded bg-white dark:bg-white/[0.03] border border-border-theme">
                        <span className="block text-[9px] text-muted-foreground-theme">Academic</span>
                        <span className="text-xs font-bold text-foreground-theme">
                          {s.leavesAvailable.academic}
                        </span>
                      </div>
                    </div>
                    {s.hasPrivileges && (
                      <p className="text-[10px] text-amber-600 dark:text-gold/90 font-mono text-center pt-0.5 font-semibold">
                        Eligible for Seminars (Travel) & Tokens
                      </p>
                    )}
                  </div>

                  {/* Real-time stats pills & Adjust button */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground-theme">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        +{s.stats.presentCount * 3} ({s.stats.presentCount} present)
                      </span>
                      {s.stats.absentCount > 0 && (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          -{s.stats.absentCount * 5} ({s.stats.absentCount} abs)
                        </span>
                      )}
                      {s.stats.lateCount > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {s.stats.lateCount} lates
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setAdjustTarget(s)
                        setAdjustPoints(5)
                        setAdjustReason('contribution')
                        setAdjustNote('')
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-gold/80 bg-gold/[0.08] border border-gold/20 hover:bg-gold/15 hover:text-amber-700 dark:hover:text-gold transition-all shrink-0 cursor-pointer"
                    >
                      + Adjust
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Point Adjustment Modal */}
      {adjustTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setAdjustTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#121929] border border-border-theme rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-foreground-theme">Adjust Credit Points</h3>
                <p className="text-xs text-amber-600 dark:text-gold font-semibold mt-0.5">
                  {adjustTarget.officerName} · {adjustTarget.score} PTS
                </p>
              </div>
              <button onClick={() => setAdjustTarget(null)} className="text-muted-foreground-theme hover:text-foreground-theme cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Whiteboard Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-muted-foreground-theme uppercase tracking-wider block">
                Whiteboard Point Presets
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustPoints(5)
                    setAdjustReason('contribution')
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    adjustPoints === 5 && adjustReason === 'contribution'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-border-theme text-muted-foreground-theme hover:text-foreground-theme'
                  }`}
                >
                  <span className="block font-display font-bold text-sm">+5</span>
                  <span className="text-[9px] block">Contribution</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustPoints(7)
                    setAdjustReason('assessment')
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    adjustPoints === 7 && adjustReason === 'assessment'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-border-theme text-muted-foreground-theme hover:text-foreground-theme'
                  }`}
                >
                  <span className="block font-display font-bold text-sm">+7</span>
                  <span className="text-[9px] block">Assessment</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustPoints(-3)
                    setAdjustReason('negligence')
                  }}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                    adjustPoints === -3 && adjustReason === 'negligence'
                      ? 'bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300 font-bold'
                      : 'bg-slate-50 dark:bg-white/[0.02] border-border-theme text-muted-foreground-theme hover:text-foreground-theme'
                  }`}
                >
                  <span className="block font-display font-bold text-sm">-3</span>
                  <span className="text-[9px] block">Negligence</span>
                </button>
              </div>
            </div>

            {/* Custom Value & Note */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-mono text-muted-foreground-theme block mb-1">Points Delta (+ or -)</label>
                <input
                  type="number"
                  value={adjustPoints}
                  onChange={(e) => {
                    setAdjustPoints(Number(e.target.value))
                    setAdjustReason('custom')
                  }}
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3 py-2 text-sm text-foreground-theme outline-none focus:border-gold/50"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-muted-foreground-theme block mb-1">Reason / Note (Optional)</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Sugalaw Photobooth Committee"
                  className="w-full bg-slate-50 dark:bg-white/[0.04] border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground-theme placeholder:text-muted-foreground-theme/50 outline-none focus:border-gold/50"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAdjustTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border-theme text-muted-foreground-theme hover:text-foreground-theme hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdjustment}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-[#0D1117] font-bold text-xs hover:bg-[#FFA726] transition-all shadow-md cursor-pointer"
              >
                Apply Points
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

