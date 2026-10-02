import { supabase, supabaseAdmin } from './supabase'

/* ─── Types ─── */

export interface StudentRow {
  id: string
  student_no: string
  full_name: string
  full_name_normalized: string
  year_level: number
  section: string
  year_section: string
  program: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudentWithDuesStatus extends StudentRow {
  has_paid: boolean
}

export interface StudentRegistryStats {
  totalStudents: number
  totalActive: number
  byYearLevel: { year: number; count: number }[]
  bySectionCount: { yearSection: string; count: number }[]
}

/* ─── Queries ─── */

/**
 * Get all active students, ordered by year_section and full_name.
 */
export async function getAllStudents(): Promise<StudentRow[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('year_section', { ascending: true })
      .order('full_name', { ascending: true })

    if (error) throw error
    return (data || []) as StudentRow[]
  } catch {
    return []
  }
}

/**
 * Get total count of active students (lightweight, no payload).
 */
export async function getStudentCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) throw error
    return count || 0
  } catch {
    return 0
  }
}

/**
 * Get distinct active section count.
 */
export async function getActiveSectionCount(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('year_section')
      .eq('is_active', true)

    if (error) throw error

    const uniqueSections = new Set((data || []).map(r => r.year_section))
    return uniqueSections.size
  } catch {
    return 0
  }
}

/**
 * Get registry stats for the management dashboard.
 */
export async function getStudentRegistryStats(): Promise<StudentRegistryStats> {
  try {
    const students = await getAllStudents()

    const byYearMap = new Map<number, number>()
    const bySectionMap = new Map<string, number>()

    for (const s of students) {
      byYearMap.set(s.year_level, (byYearMap.get(s.year_level) || 0) + 1)
      bySectionMap.set(s.year_section, (bySectionMap.get(s.year_section) || 0) + 1)
    }

    return {
      totalStudents: students.length,
      totalActive: students.length,
      byYearLevel: Array.from(byYearMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year),
      bySectionCount: Array.from(bySectionMap.entries())
        .map(([yearSection, count]) => ({ yearSection, count }))
        .sort((a, b) => a.yearSection.localeCompare(b.yearSection)),
    }
  } catch {
    return {
      totalStudents: 0,
      totalActive: 0,
      byYearLevel: [],
      bySectionCount: [],
    }
  }
}

/**
 * Search students by name or student number.
 */
export async function searchStudents(query: string): Promise<StudentRow[]> {
  try {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('is_active', true)
      .or(`full_name_normalized.ilike.%${normalized}%,student_no.ilike.%${normalized}%`)
      .order('year_section', { ascending: true })
      .order('full_name', { ascending: true })
      .limit(100)

    if (error) throw error
    return (data || []) as StudentRow[]
  } catch {
    return []
  }
}
