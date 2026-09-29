'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin, type MembershipDueRow, type PublicMaskedDueRow, type DuesTermConfigRow } from '@/lib/supabase'
import {
  DEFAULT_PROGRAM,
  DEFAULT_MEMBERSHIP_FEE,
  DEFAULT_ACADEMIC_YEAR,
  DEFAULT_SEMESTER,
  normalizeStudentName,
  maskStudentName,
  formatYearSection,
  getAllStandardSections,
  parseBatchStudentNames,
  ACADEMIC_YEARS,
  type YearLevel,
  type SectionLetter,
} from '@/lib/dues'

export interface DuesActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface DuesTermConfig {
  activeAcademicYear: string
  activeSemester: string
  availableAcademicYears: string[]
  updatedAt?: string
  updatedBy?: string | null
  isDatabaseBacked: boolean
}

export interface BatchRecordResult {
  totalSubmitted: number
  recordedCount: number
  skippedDuplicates: string[]
  insertedRows: MembershipDueRow[]
  yearSection: string
  academicYear: string
  semester: string
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

    // If term not explicitly specified, first query the official dues_term_config
    if (!targetAY || !targetSem) {
      const { data: configRecord } = await supabaseAdmin
        .from('dues_term_config')
        .select('active_academic_year, active_semester')
        .eq('id', 1)
        .maybeSingle()

      if (configRecord?.active_academic_year && configRecord?.active_semester) {
        targetAY = configRecord.active_academic_year
        targetSem = configRecord.active_semester
      } else {
        // Fallback: query the most recently recorded payment to find the active term
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

/**
 * Fetch the global active term and list of available academic years.
 * Backed by public.dues_term_config in Supabase with automatic graceful fallback.
 */
export async function getDuesTermConfigAction(): Promise<DuesActionResult<DuesTermConfig>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('dues_term_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (!error && data) {
      const configRow = data as DuesTermConfigRow
      return {
        success: true,
        data: {
          activeAcademicYear: configRow.active_academic_year || DEFAULT_ACADEMIC_YEAR,
          activeSemester: configRow.active_semester || DEFAULT_SEMESTER,
          availableAcademicYears:
            Array.isArray(configRow.available_academic_years) && configRow.available_academic_years.length > 0
              ? configRow.available_academic_years
              : [...ACADEMIC_YEARS],
          updatedAt: configRow.updated_at,
          updatedBy: configRow.updated_by,
          isDatabaseBacked: true,
        },
      }
    }

    // Graceful fallback if table does not exist or has not been seeded yet:
    // Determine active term from most recent payment in membership_dues
    const { data: latestRecord } = await supabaseAdmin
      .from('membership_dues')
      .select('academic_year, semester')
      .order('paid_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      success: true,
      data: {
        activeAcademicYear: latestRecord?.academic_year || DEFAULT_ACADEMIC_YEAR,
        activeSemester: latestRecord?.semester || DEFAULT_SEMESTER,
        availableAcademicYears: [...ACADEMIC_YEARS],
        isDatabaseBacked: false,
      },
    }
  } catch {
    return {
      success: true,
      data: {
        activeAcademicYear: DEFAULT_ACADEMIC_YEAR,
        activeSemester: DEFAULT_SEMESTER,
        availableAcademicYears: [...ACADEMIC_YEARS],
        isDatabaseBacked: false,
      },
    }
  }
}

/**
 * Update global active term and managed academic years (Admin / Officer action).
 */
export async function updateDuesTermConfigAction(payload: {
  activeAcademicYear: string
  activeSemester: string
  availableAcademicYears: string[]
  updatedBy?: string
}): Promise<DuesActionResult<DuesTermConfig>> {
  try {
    const cleanAY = payload.activeAcademicYear.trim()
    const cleanSem = payload.activeSemester.trim()

    if (!cleanAY) {
      return { success: false, error: 'Academic Year cannot be blank.' }
    }
    if (!cleanSem) {
      return { success: false, error: 'Semester cannot be blank.' }
    }

    const uniqueYears = Array.from(
      new Set(payload.availableAcademicYears.map((y) => y.trim()).filter(Boolean))
    )
    if (!uniqueYears.includes(cleanAY)) {
      uniqueYears.unshift(cleanAY)
    }

    const { data, error } = await supabaseAdmin
      .from('dues_term_config')
      .upsert(
        {
          id: 1,
          active_academic_year: cleanAY,
          active_semester: cleanSem,
          available_academic_years: uniqueYears,
          updated_at: new Date().toISOString(),
          updated_by: payload.updatedBy?.trim() || null,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single()

    if (error) {
      return {
        success: false,
        error: `Could not sync to database table dues_term_config (${error.message}). Please ensure migration 20260929_dues_term_config.sql is applied.`,
      }
    }

    revalidatePath('/management/dues')
    revalidatePath('/dues')

    const row = data as DuesTermConfigRow
    return {
      success: true,
      data: {
        activeAcademicYear: row.active_academic_year,
        activeSemester: row.active_semester,
        availableAcademicYears: row.available_academic_years,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
        isDatabaseBacked: true,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update term configuration'
    return { success: false, error: message }
  }
}

/**
 * Record a batch of students for membership dues in one atomic operation.
 * Eliminates repetitive single modal submissions for high-speed ledger entry.
 */
export async function recordBatchMembershipDuesAction(payload: {
  rawNamesText: string
  yearLevel: YearLevel
  section: SectionLetter
  academicYear: string
  semester: string
  recordedBy: string
}): Promise<DuesActionResult<BatchRecordResult>> {
  try {
    const parsedNames = parseBatchStudentNames(payload.rawNamesText)

    if (parsedNames.length === 0) {
      return {
        success: false,
        error: 'No valid student names detected. Please paste at least one name (e.g. one per line).',
      }
    }

    const yearLevelNum = payload.yearLevel
    const sectionLetter = payload.section
    const academicYear = payload.academicYear?.trim() || DEFAULT_ACADEMIC_YEAR
    const semester = payload.semester?.trim() || DEFAULT_SEMESTER
    const recordedBy = payload.recordedBy?.trim() || null

    if (![1, 2, 3, 4].includes(yearLevelNum)) {
      return { success: false, error: 'Valid Year Level (1 to 4) is required.' }
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(sectionLetter)) {
      return { success: false, error: 'Valid Section (A to E) is required.' }
    }

    const formattedSection = formatYearSection(DEFAULT_PROGRAM, yearLevelNum, sectionLetter)

    // Build map of normalized name -> original display name
    const normalizedToOriginal = new Map<string, string>()
    for (const name of parsedNames) {
      const norm = normalizeStudentName(name)
      if (!normalizedToOriginal.has(norm)) {
        normalizedToOriginal.set(norm, name)
      }
    }

    const allNormalizedNames = Array.from(normalizedToOriginal.keys())

    // Single batch query to check which students are already recorded as paid for this term
    const { data: existingDues, error: checkError } = await supabaseAdmin
      .from('membership_dues')
      .select('student_name_normalized, student_name')
      .eq('year_section', formattedSection)
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .in('student_name_normalized', allNormalizedNames)

    if (checkError) {
      return { success: false, error: `Database check error: ${checkError.message}` }
    }

    const existingNormalizedSet = new Set(
      (existingDues || []).map((d) => d.student_name_normalized)
    )

    const skippedDuplicates: string[] = []
    const toInsertRows: Array<{
      student_name: string
      student_name_normalized: string
      program: string
      year_level: number
      section: string
      year_section: string
      amount: number
      is_paid: boolean
      academic_year: string
      semester: string
      recorded_by: string | null
      paid_at: string
    }> = []

    for (const [norm, originalName] of normalizedToOriginal.entries()) {
      if (existingNormalizedSet.has(norm)) {
        skippedDuplicates.push(originalName)
      } else {
        toInsertRows.push({
          student_name: originalName,
          student_name_normalized: norm,
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
      }
    }

    if (toInsertRows.length === 0) {
      return {
        success: false,
        error: `All ${parsedNames.length} student(s) submitted are already recorded as paid for ${formattedSection} (${academicYear} · ${semester}).`,
      }
    }

    // Insert new students in bulk
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('membership_dues')
      .insert(toInsertRows)
      .select('*')

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath('/management/dues')
    revalidatePath('/dues')

    return {
      success: true,
      data: {
        totalSubmitted: parsedNames.length,
        recordedCount: inserted?.length || 0,
        skippedDuplicates,
        insertedRows: (inserted || []) as MembershipDueRow[],
        yearSection: formattedSection,
        academicYear,
        semester,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record batch dues'
    return { success: false, error: message }
  }
}


