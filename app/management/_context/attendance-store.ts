'use client'

import {
  createMeetingAction,
  deleteMeetingAction,
  recordAttendanceScanAction,
} from '../attendance/actions'
import { getMeetings, getAttendanceRecords } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────

export interface Meeting {
  id: string
  title: string
  type: 'regular' | 'emergency'
  date: string            // "2026-09-20" (ISO date)
  startTime: string       // "14:00" (24h)
  endTime: string         // "16:00"
  location: string
  description: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  createdBy: string
}

export interface OfficerQR {
  officerName: string
  position: string
  token: string           // Crypto-random UUID
  generatedAt: string
  isActive: boolean
}

export type AttendanceStatus = 'present' | 'late' | 'absent'

export interface AttendanceRecord {
  id: string
  meetingId: string
  officerName: string
  position: string
  scannedAt: string
  qrToken: string
  status?: AttendanceStatus
  method?: 'qr' | 'manual'
}

export interface QRPayload {
  sys: 'PSITS-UA-ATTENDANCE'
  tkn: string
  ver: number
}

export type ScanResult =
  | { success: true; officerName: string; position: string; meetingTitle: string }
  | { success: false; error: string; code: 'NO_MEETING' | 'INVALID_QR' | 'INACTIVE_QR' | 'ALREADY_SCANNED' | 'UNKNOWN_TOKEN'; officerName?: string; position?: string }

// ─── Constants ───────────────────────────────────────────────

const STORAGE_KEYS = {
  meetings: 'psits_attendance_meetings',
  qrCodes: 'psits_attendance_qr_codes',
  records: 'psits_attendance_records',
  points: 'psits_point_adjustments',
} as const

/** Grace period in minutes */
const GRACE_BEFORE = 15
const GRACE_AFTER = 30

// ─── Helpers ─────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

// ─── Meeting Store ───────────────────────────────────────────

export const MeetingStore = {
  getAll(): Meeting[] {
    return getFromStorage<Meeting>(STORAGE_KEYS.meetings)
  },

  getById(id: string): Meeting | undefined {
    return this.getAll().find((m) => m.id === id)
  },

  create(meeting: Omit<Meeting, 'id' | 'createdAt' | 'status'>): Meeting {
    const newMeeting: Meeting = {
      ...meeting,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'scheduled',
    }
    const all = this.getAll()
    all.push(newMeeting)
    setToStorage(STORAGE_KEYS.meetings, all)
    createMeetingAction(meeting).catch(() => {})
    return newMeeting
  },

  update(id: string, updates: Partial<Omit<Meeting, 'id' | 'createdAt'>>): Meeting | null {
    const all = this.getAll()
    const idx = all.findIndex((m) => m.id === id)
    if (idx === -1) return null
    all[idx] = { ...all[idx], ...updates }
    setToStorage(STORAGE_KEYS.meetings, all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter((m) => m.id !== id)
    if (filtered.length === all.length) return false
    setToStorage(STORAGE_KEYS.meetings, filtered)
    // Also delete related attendance records
    const records = getFromStorage<AttendanceRecord>(STORAGE_KEYS.records)
    setToStorage(STORAGE_KEYS.records, records.filter((r) => r.meetingId !== id))
    deleteMeetingAction(id).catch(() => {})
    return true
  },

  async syncWithSupabase(): Promise<void> {
    try {
      const dbMeetings = await getMeetings()
      if (dbMeetings && dbMeetings.length > 0) {
        const local = this.getAll()
        const merged = [...local]
        for (const dbm of dbMeetings) {
          if (!merged.some((m) => m.id === dbm.id)) {
            merged.push({
              id: dbm.id,
              title: dbm.title,
              type: dbm.type,
              date: dbm.date,
              startTime: dbm.start_time,
              endTime: dbm.end_time,
              location: dbm.location,
              description: dbm.description,
              status: dbm.status as any,
              createdAt: dbm.created_at,
              createdBy: dbm.created_by,
            })
          }
        }
        setToStorage(STORAGE_KEYS.meetings, merged)
      }
    } catch {}
  },

  /** Get the currently active meeting (explicitly active or within scheduled time window) */
  getActiveMeeting(): Meeting | null {
    const allMeetings = this.getAll()

    // 1. Manually activated meetings take highest priority (e.g., Emergency meetings or Host clicked Active)
    const explicitActive = allMeetings.find((m) => m.status === 'active')
    if (explicitActive) {
      return explicitActive
    }

    // 2. Otherwise check scheduled meetings within today's time window (+ grace periods)
    const now = new Date()
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    for (const meeting of allMeetings) {
      if (meeting.status === 'cancelled' || meeting.status === 'completed') continue
      if (meeting.date !== todayDate) continue

      const [startH, startM] = meeting.startTime.split(':').map(Number)
      const [endH, endM] = meeting.endTime.split(':').map(Number)

      const meetingStart = new Date(now)
      meetingStart.setHours(startH, startM, 0, 0)

      const meetingEnd = new Date(now)
      meetingEnd.setHours(endH, endM, 0, 0)

      // Apply grace periods
      const windowStart = new Date(meetingStart.getTime() - GRACE_BEFORE * 60 * 1000)
      const windowEnd = new Date(meetingEnd.getTime() + GRACE_AFTER * 60 * 1000)

      if (now >= windowStart && now <= windowEnd) {
        return meeting
      }
    }

    return null
  },
}

// ─── QR Code Store ───────────────────────────────────────────

export const QRStore = {
  getAll(): OfficerQR[] {
    return getFromStorage<OfficerQR>(STORAGE_KEYS.qrCodes)
  },

  getByOfficer(officerName: string): OfficerQR | undefined {
    return this.getAll().find((q) => q.officerName === officerName)
  },

  getByToken(token: string): OfficerQR | undefined {
    return this.getAll().find((q) => q.token === token)
  },

  /** Generate or regenerate QR for an officer */
  generate(officerName: string, position: string): OfficerQR {
    const all = this.getAll()
    const existingIdx = all.findIndex((q) => q.officerName === officerName)

    const qr: OfficerQR = {
      officerName,
      position,
      token: generateId(),
      generatedAt: new Date().toISOString(),
      isActive: true,
    }

    if (existingIdx !== -1) {
      all[existingIdx] = qr
    } else {
      all.push(qr)
    }

    setToStorage(STORAGE_KEYS.qrCodes, all)
    return qr
  },

  /** Deactivate an officer's QR (e.g., when officer changes) */
  deactivate(officerName: string): boolean {
    const all = this.getAll()
    const idx = all.findIndex((q) => q.officerName === officerName)
    if (idx === -1) return false
    all[idx].isActive = false
    setToStorage(STORAGE_KEYS.qrCodes, all)
    return true
  },

  /** Generate QR codes for all officers at once */
  generateAll(officers: { name: string; position: string }[]): OfficerQR[] {
    const result: OfficerQR[] = []
    for (const officer of officers) {
      result.push(this.generate(officer.name, officer.position))
    }
    return result
  },

  /** Build the QR payload string (what gets encoded in the QR image) */
  buildPayload(token: string): string {
    const payload: QRPayload = {
      sys: 'PSITS-UA-ATTENDANCE',
      tkn: token,
      ver: 1,
    }
    return JSON.stringify(payload)
  },

  /** Parse and validate a QR payload string */
  parsePayload(raw: string): QRPayload | null {
    try {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        parsed.sys === 'PSITS-UA-ATTENDANCE' &&
        typeof parsed.tkn === 'string' &&
        parsed.ver === 1
      ) {
        return parsed as QRPayload
      }
      return null
    } catch {
      return null
    }
  },
}

// ─── Attendance Store ────────────────────────────────────────

export const AttendanceStore = {
  getAll(): AttendanceRecord[] {
    return getFromStorage<AttendanceRecord>(STORAGE_KEYS.records)
  },

  getByMeeting(meetingId: string): AttendanceRecord[] {
    return this.getAll().filter((r) => r.meetingId === meetingId)
  },

  hasScanned(meetingId: string, officerName: string): boolean {
    return this.getAll().some(
      (r) =>
        r.meetingId === meetingId &&
        r.officerName === officerName &&
        (r.status === 'present' || r.status === 'late' || !r.status)
    )
  },

  setStatus(
    meetingId: string,
    officerName: string,
    position: string,
    status: AttendanceStatus
  ): AttendanceRecord {
    const all = this.getAll()
    const idx = all.findIndex(
      (r) => r.meetingId === meetingId && r.officerName === officerName
    )

    if (idx !== -1) {
      all[idx] = {
        ...all[idx],
        status,
        method: all[idx].method || 'manual',
      }
      setToStorage(STORAGE_KEYS.records, all)
      return all[idx]
    } else {
      const newRecord: AttendanceRecord = {
        id: generateId(),
        meetingId,
        officerName,
        position,
        scannedAt: new Date().toISOString(),
        qrToken: 'manual-override',
        status,
        method: 'manual',
      }
      all.push(newRecord)
      setToStorage(STORAGE_KEYS.records, all)
      return newRecord
    }
  },

  log(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const newRecord: AttendanceRecord = {
      status: 'present',
      method: 'qr',
      ...record,
      id: generateId(),
    }
    const all = this.getAll()
    all.push(newRecord)
    setToStorage(STORAGE_KEYS.records, all)
    recordAttendanceScanAction({
      meetingId: record.meetingId,
      officerName: record.officerName,
      position: record.position,
      qrToken: record.qrToken,
      status: newRecord.status,
      method: newRecord.method,
    }).catch(() => {})
    return newRecord
  },

  async syncWithSupabase(): Promise<void> {
    try {
      const dbRecords = await getAttendanceRecords()
      if (dbRecords && dbRecords.length > 0) {
        const local = this.getAll()
        const merged = [...local]
        for (const dbr of dbRecords) {
          if (!merged.some((r) => r.id === dbr.id)) {
            merged.push({
              id: dbr.id,
              meetingId: dbr.meeting_id,
              officerName: dbr.officer_name,
              position: dbr.position,
              scannedAt: dbr.scanned_at,
              qrToken: dbr.qr_token,
              status: dbr.status as any,
              method: dbr.method as any,
            })
          }
        }
        setToStorage(STORAGE_KEYS.records, merged)
      }
    } catch {}
  },
}

// ─── Scan Validation (used by /camera) ───────────────────────

export function validateScan(rawQRData: string): ScanResult {
  // 1. Parse the QR payload
  const payload = QRStore.parsePayload(rawQRData)
  if (!payload) {
    return {
      success: false,
      error: 'Invalid QR code. This QR is not from the PSITS attendance system.',
      code: 'INVALID_QR',
    }
  }

  // 2. Find the officer QR by token
  const officerQR = QRStore.getByToken(payload.tkn)
  if (!officerQR) {
    return {
      success: false,
      error: 'QR code not recognized. It may have been regenerated.',
      code: 'UNKNOWN_TOKEN',
    }
  }

  // 3. Check if QR is active
  if (!officerQR.isActive) {
    return {
      success: false,
      error: `QR for ${officerQR.officerName} is deactivated. Please contact management.`,
      code: 'INACTIVE_QR',
    }
  }

  // 4. Check for active meeting
  const activeMeeting = MeetingStore.getActiveMeeting()
  if (!activeMeeting) {
    return {
      success: false,
      error: 'No active meeting right now. Attendance scanning is disabled.',
      code: 'NO_MEETING',
    }
  }

  // 5. Check if already scanned
  if (AttendanceStore.hasScanned(activeMeeting.id, officerQR.officerName)) {
    return {
      success: false,
      error: `${officerQR.officerName} has already been logged for "${activeMeeting.title}".`,
      code: 'ALREADY_SCANNED',
    }
  }

  // 6. Log attendance
  AttendanceStore.log({
    meetingId: activeMeeting.id,
    officerName: officerQR.officerName,
    position: officerQR.position,
    scannedAt: new Date().toISOString(),
    qrToken: payload.tkn,
  })

  return {
    success: true,
    officerName: officerQR.officerName,
    position: officerQR.position,
    meetingTitle: activeMeeting.title,
  }
}

// ─── Point & Credit Score System (Whiteboard Spec) ───────────

export interface PointAdjustment {
  id: string
  officerName: string
  points: number
  reason: 'contribution' | 'assessment' | 'negligence' | 'custom'
  note?: string
  createdAt: string
}

export const PointStore = {
  getAll(): PointAdjustment[] {
    return getFromStorage<PointAdjustment>(STORAGE_KEYS.points)
  },

  getByOfficer(officerName: string): PointAdjustment[] {
    return this.getAll().filter((p) => p.officerName === officerName)
  },

  add(adj: Omit<PointAdjustment, 'id' | 'createdAt'>): PointAdjustment {
    const newAdj: PointAdjustment = {
      ...adj,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    const all = this.getAll()
    all.push(newAdj)
    setToStorage(STORAGE_KEYS.points, all)
    return newAdj
  },

  delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter((p) => p.id !== id)
    if (filtered.length === all.length) return false
    setToStorage(STORAGE_KEYS.points, filtered)
    return true
  },
}

export interface OfficerStanding {
  officerName: string
  position: string
  score: number // Clamped [0, 110]
  rawScore: number
  tier: 'max' | 'high' | 'normal' | 'warning' | 'critical'
  leavesAvailable: {
    medical: number // 2 if >= 110, 1 if >= 105, 0 otherwise
    personal: number
    academic: number
  }
  hasPrivileges: boolean // true if >= 110 (Travel, Tokens)
  stats: {
    presentCount: number
    lateCount: number
    absentCount: number
    consecutiveLates: number
    adjustmentsTotal: number
  }
  adjustments: PointAdjustment[]
}

/**
 * Compute real-time point score & standing for an officer.
 * Formula from PSITS Whiteboard:
 * - Base: 100 PTS
 * - Present: +3 PTS each
 * - Absent: -5 PTS each
 * - Late: -5 PTS per 3 consecutive lates
 * - Max Cap: 110 PTS (Hard cap)
 * - Tiers: >=110 Max, >=105 High, <=80 Warning, <=75 Removal
 */
export function computeOfficerStanding(officerName: string, position: string): OfficerStanding {
  const meetings = MeetingStore.getAll().filter((m) => m.status !== 'cancelled')
  const records = AttendanceStore.getAll().filter((r) => r.officerName === officerName)
  const adjustments = PointStore.getByOfficer(officerName)

  let presentCount = 0
  let lateCount = 0
  let absentCount = 0
  let consecutiveLates = 0
  let latePenaltyCount = 0

  // Sort meetings chronologically
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
  )

  for (const m of sortedMeetings) {
    const rec = records.find((r) => r.meetingId === m.id)
    const status = rec?.status || (rec ? 'present' : undefined)

    if (status === 'present') {
      presentCount++
      consecutiveLates = 0
    } else if (status === 'late') {
      lateCount++
      consecutiveLates++
      if (consecutiveLates >= 3) {
        latePenaltyCount++
        consecutiveLates = 0
      }
    } else if (status === 'absent') {
      absentCount++
      consecutiveLates = 0
    } else if (m.status === 'completed') {
      // Completed meeting without record defaults to absent
      absentCount++
      consecutiveLates = 0
    }
  }

  const attendanceBonus = presentCount * 3
  const absenceDeductions = absentCount * 5
  const lateDeductions = latePenaltyCount * 5
  const adjustmentsTotal = adjustments.reduce((sum, a) => sum + a.points, 0)

  // Starting baseline is 100 PTS
  const rawScore = 100 + attendanceBonus - absenceDeductions - lateDeductions + adjustmentsTotal
  // Cap at 110 max, floor at 0
  const score = Math.max(0, Math.min(110, rawScore))

  // Standing Tiers
  let tier: OfficerStanding['tier'] = 'normal'
  if (score >= 110) {
    tier = 'max'
  } else if (score >= 105) {
    tier = 'high'
  } else if (score <= 75) {
    tier = 'critical'
  } else if (score <= 80) {
    tier = 'warning'
  }

  // Leaves available: 2 each if >= 110, 1 each if >= 105, 0 otherwise
  const leavesCount = score >= 110 ? 2 : score >= 105 ? 1 : 0

  return {
    officerName,
    position,
    score,
    rawScore,
    tier,
    leavesAvailable: {
      medical: leavesCount,
      personal: leavesCount,
      academic: leavesCount,
    },
    hasPrivileges: score >= 110,
    stats: {
      presentCount,
      lateCount,
      absentCount,
      consecutiveLates,
      adjustmentsTotal,
    },
    adjustments,
  }
}
