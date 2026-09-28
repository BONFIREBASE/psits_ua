'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin, type MembershipDueRow, type PublicMaskedDueRow } from '@/lib/supabase'
import {
  DEFAULT_PROGRAM,
  DEFAULT_MEMBERSHIP_FEE,
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_SEMESTER,
  normalizeStudentName,
  maskStudentName,
  formatYearSection,
  getAllStandardSections,
  type YearLevel,
  type SectionLetter,
} from '@/lib/dues'

export interface DuesActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PublicDuesSummary {
  totalPaid: number
  totalCollected: number
  academicYear: string
  semester: string
  sectionBreakdown: {
    yearSection: string
    count: number
    amount: number
  }[]
  maskedRecords: PublicMaskedDueRow[]
}

/**
 * Fetch all unmasked dues records for management view.
 */
export async function getMembershipDuesAction(): Promise<DuesActionResult<MembershipDueRow[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_dues')
      .select('*')
      .order('paid_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data || []) as MembershipDueRow[] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve dues records'
    return { success: false, error: message }
  }
}

/**
 * Register a student's membership dues payment.
 * Validates fixed program BSIT, year (1-4), section (A-E), and checks duplicates.
 */
export async function recordMembershipDueAction(formData: FormData): Promise<DuesActionResult<MembershipDueRow>> {
  try {
    const rawStudentName = (formData.get('student_name') as string)?.trim()
    const yearLevelNum = parseInt((formData.get('year_level') as string) || '1', 10) as YearLevel
    const sectionLetter = ((formData.get('section') as string)?.trim().toUpperCase() || 'A') as SectionLetter
    const academicYear = (formData.get('academic_year') as string)?.trim() || DEFAULT_ACADEMIC_YEAR
    const semester = (formData.get('semester') as string)?.trim() || DEFAULT_SEMESTER
    const recordedBy = (formData.get('recorded_by') as string)?.trim() || null

    if (!rawStudentName) {
      return { success: false, error: 'Student full name is required.' }
    }

    if (rawStudentName.length < 2) {
      return { success: false, error: 'Student name must have at least 2 characters.' }
    }

    if (![1, 2, 3, 4].includes(yearLevelNum)) {
      return { success: false, error: 'Valid Year Level (1 to 4) is required.' }
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(sectionLetter)) {
      return { success: false, error: 'Valid Section (A to E) is required.' }
    }

    const normalizedName = normalizeStudentName(rawStudentName)
    const formattedSection = formatYearSection(DEFAULT_PROGRAM, yearLevelNum, sectionLetter)

    // Duplicate Check: Check if this student in this section already paid for this term
    const { data: existingDues, error: checkError } = await supabaseAdmin
      .from('membership_dues')
      .select('id, student_name, year_section')
      .eq('student_name_normalized', normalizedName)
      .eq('year_section', formattedSection)
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .limit(1)

    if (checkError) {
      // If table does not exist or network issue, bubble error
      return { success: false, error: `Database check error: ${checkError.message}` }
    }

    if (existingDues && existingDues.length > 0) {
      return {
        success: false,
        error: `Duplicate Entry: "${rawStudentName}" is already recorded as paid for ${formattedSection} (${academicYear} - ${semester}).`,
      }
    }

    // Insert new payment record
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('membership_dues')
      .insert({
        student_name: rawStudentName,
        student_name_normalized: normalizedName,
        program: DEFAULT_PROGRAM,
        year_level: yearLevelNum,
        section: sectionLetter,
        year_section: formattedSection,
        amount: DEFAULT_MEMBERSHIP_FEE,
        is_paid: true,
        academic_year: academicYear,
        semester: semester,
        recorded_by: recordedBy,
        paid_at: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return {
          success: false,
          error: `Duplicate Entry: "${rawStudentName}" already exists for this section in the active term.`,
        }
      }
      return { success: false, error: insertError.message }
    }

    revalidatePath('/management/dues')
    revalidatePath('/dues')

    return { success: true, data: inserted as MembershipDueRow }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record membership due'
    return { success: false, error: message }
  }
}

/**
 * Delete a dues entry (admin / officer undo)
 */
export async function deleteMembershipDueAction(id: string): Promise<DuesActionResult<{ id: string }>> {
  try {
    if (!id) return { success: false, error: 'Record ID is required.' }

    const { error } = await supabaseAdmin
      .from('membership_dues')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/management/dues')
    revalidatePath('/dues')

    return { success: true, data: { id } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete record'
    return { success: false, error: message }
  }
}

/**
 * Fetch Public Transparency Dues Summary.
 * CRITICAL PRIVACY GUARANTEE:
 * Names are masked on the server using maskStudentName().
 * Raw student names are strictly withheld and never serialized in the response.
 */
export async function getPublicDuesSummaryAction(
  academicYear?: string,
  semester?: string
): Promise<DuesActionResult<PublicDuesSummary>> {
  try {
    let targetAY: string = academicYear || ''
    let targetSem: string = semester || ''

    // If term not explicitly specified, query the most recently recorded payment to find the active term
    if (!targetAY || !targetSem) {
      const { data: latestRecord } = await supabaseAdmin
        .from('membership_dues')
        .select('academic_year, semester')
        .order('paid_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (latestRecord?.academic_year && latestRecord?.semester) {
        targetAY = latestRecord.academic_year
        targetSem = latestRecord.semester
      } else {
        targetAY = DEFAULT_ACADEMIC_YEAR
        targetSem = DEFAULT_SEMESTER
      }
    }

    const { data, error } = await supabaseAdmin
      .from('membership_dues')
      .select('id, student_name, program, year_level, section, year_section, amount, is_paid, academic_year, semester, paid_at')
      .eq('academic_year', targetAY)
      .eq('semester', targetSem)
      .order('paid_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const rows = (data || []) as Array<{
      id: string
      student_name: string
      program: string
      year_level: number
      section: string
      year_section: string
      amount: number
      is_paid: boolean
      academic_year: string
      semester: string
      paid_at: string
    }>

    // Calculate aggregated section metrics
    const standardSections = getAllStandardSections()
    const sectionCountsMap = new Map<string, number>()
    standardSections.forEach((s) => sectionCountsMap.set(s, 0))

    let totalCollected = 0
    const maskedRecords: PublicMaskedDueRow[] = []

    for (const r of rows) {
      const amt = Number(r.amount) || DEFAULT_MEMBERSHIP_FEE
      totalCollected += amt

      const sec = r.year_section || formatYearSection(r.program, r.year_level, r.section)
      const currentCount = sectionCountsMap.get(sec) || 0
      sectionCountsMap.set(sec, currentCount + 1)

      // Privacy Masking executed server-side
      maskedRecords.push({
        id: r.id,
        masked_name: maskStudentName(r.student_name),
        program: r.program,
        year_level: r.year_level,
        section: r.section,
        year_section: sec,
        amount: amt,
        is_paid: r.is_paid,
        academic_year: r.academic_year,
        semester: r.semester,
        paid_at: r.paid_at,
      })
    }

    const sectionBreakdown = standardSections.map((sec) => {
      const count = sectionCountsMap.get(sec) || 0
      return {
        yearSection: sec,
        count,
        amount: count * DEFAULT_MEMBERSHIP_FEE,
      }
    })

    return {
      success: true,
      data: {
        totalPaid: rows.length,
        totalCollected,
        academicYear: targetAY,
        semester: targetSem,
        sectionBreakdown,
        maskedRecords,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve dues summary'
    return { success: false, error: message }
  }
}

/**
 * Fetch distinct academic years and semesters recorded in the ledger
 */
export async function getAvailableTermsAction(): Promise<DuesActionResult<{ academicYear: string; semester: string }[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('membership_dues')
      .select('academic_year, semester')
      .order('academic_year', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const uniqueSet = new Set<string>()
    const terms: { academicYear: string; semester: string }[] = []

    for (const r of data || []) {
      const key = `${r.academic_year}__${r.semester}`
      if (!uniqueSet.has(key)) {
        uniqueSet.add(key)
        terms.push({ academicYear: r.academic_year, semester: r.semester })
      }
    }

    return { success: true, data: terms }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve terms'
    return { success: false, error: message }
  }
}

