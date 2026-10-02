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
import {
  getCache,
  setCache,
  invalidateStudentCaches,
  checkRateLimit,
} from '@/lib/ratelimit'


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

    // Rate Limiting Protection (Upstash)
    const rl = await checkRateLimit(recordedBy || 'dues_operator', 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a few moments before submitting again.' }
    }

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

    await invalidateStudentCaches()
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

    const rl = await checkRateLimit('dues_delete', 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment.' }
    }

    const { error } = await supabaseAdmin
      .from('membership_dues')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    await invalidateStudentCaches()
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

    // Check Upstash Redis Cache first
    const cacheKey = `psits:cache:dues_summary:${targetAY}:${targetSem}`
    const cached = await getCache<PublicDuesSummary>(cacheKey)
    if (cached) {
      return { success: true, data: cached }
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

    const summaryResult: PublicDuesSummary = {
      totalPaid: rows.length,
      totalCollected,
      academicYear: targetAY,
      semester: targetSem,
      sectionBreakdown,
      maskedRecords,
    }

    // Cache in Upstash Redis for 3 minutes (180s)
    await setCache(cacheKey, summaryResult, 180)

    return {
      success: true,
      data: summaryResult,
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

    await invalidateStudentCaches()
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

    // Rate Limiting Protection (Upstash)
    const rl = await checkRateLimit(recordedBy || 'batch_operator', 'dues')
    if (!rl.success) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please wait a few moments before submitting another batch.',
      }
    }

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

    await invalidateStudentCaches()
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



/**
 * Get all students with their payment status for a specific term.
 * This joins the students table with membership_dues to show who has paid.
 */
export async function getStudentsWithDuesStatusAction(payload: {
  academicYear: string
  semester: string
  yearLevel?: number
  section?: string
}): Promise<DuesActionResult<StudentWithDuesStatus[]>> {
  try {
    const { academicYear, semester, yearLevel, section } = payload

    // Check Upstash Redis Cache first
    const cacheKey = `psits:cache:dues_students:${academicYear}:${semester}:${yearLevel || 'all'}:${section || 'all'}`
    const cached = await getCache<StudentWithDuesStatus[]>(cacheKey)
    if (cached) {
      return { success: true, data: cached }
    }

    // Get all active students
    let studentsQuery = supabaseAdmin
      .from('students')
      .select('*')
      .eq('is_active', true)

    if (yearLevel) {
      studentsQuery = studentsQuery.eq('year_level', yearLevel)
    }

    if (section) {
      studentsQuery = studentsQuery.eq('section', section)
    }

    const { data: students, error: studentsError } = await studentsQuery
      .order('year_section', { ascending: true })
      .order('full_name', { ascending: true })

    if (studentsError) {
      return { success: false, error: studentsError.message }
    }

    // Get all paid students for this term
    const { data: paidDues, error: duesError } = await supabaseAdmin
      .from('membership_dues')
      .select('student_name_normalized, id')
      .eq('academic_year', academicYear)
      .eq('semester', semester)

    if (duesError) {
      return { success: false, error: duesError.message }
    }

    // Create a set of normalized names who have paid
    const paidSet = new Set(
      (paidDues || []).map((d) => d.student_name_normalized)
    )

    // Map students with their payment status
    const studentsWithStatus: StudentWithDuesStatus[] = (students || []).map(
      (student) => ({
        ...student,
        has_paid: paidSet.has(student.full_name_normalized),
      })
    )

    // Cache in Upstash Redis for 2 minutes (120s)
    await setCache(cacheKey, studentsWithStatus, 120)

    return { success: true, data: studentsWithStatus }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch students with dues status'
    return { success: false, error: message }
  }
}

export interface StudentWithDuesStatus {
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
  has_paid: boolean
}

/**
 * Toggle payment status for a student.
 * If student has paid, remove the payment record.
 * If student hasn't paid, create a payment record.
 */
export async function toggleStudentPaymentAction(payload: {
  studentId: string
  studentName: string
  studentNameNormalized: string
  yearLevel: number
  section: string
  yearSection: string
  academicYear: string
  semester: string
  recordedBy: string
  shouldBePaid: boolean
}): Promise<DuesActionResult<{ action: 'paid' | 'unpaid' }>> {
  try {
    const {
      studentName,
      studentNameNormalized,
      yearLevel,
      section,
      yearSection,
      academicYear,
      semester,
      recordedBy,
      shouldBePaid,
    } = payload

    const rl = await checkRateLimit(recordedBy || 'toggle_operator', 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment before toggling again.' }
    }

    if (shouldBePaid) {
      // Mark as paid - insert a new payment record
      const { error: insertError } = await supabaseAdmin
        .from('membership_dues')
        .insert({
          student_name: studentName,
          student_name_normalized: studentNameNormalized,
          program: DEFAULT_PROGRAM,
          year_level: yearLevel,
          section: section,
          year_section: yearSection,
          amount: DEFAULT_MEMBERSHIP_FEE,
          is_paid: true,
          academic_year: academicYear,
          semester: semester,
          recorded_by: recordedBy,
          paid_at: new Date().toISOString(),
        })

      if (insertError) {
        if (insertError.code === '23505') {
          return {
            success: false,
            error: `${studentName} is already marked as paid for ${academicYear} ${semester}`,
          }
        }
        return { success: false, error: insertError.message }
      }

      await invalidateStudentCaches()
      revalidatePath('/management/dues')
      revalidatePath('/dues')

      return { success: true, data: { action: 'paid' } }
    } else {
      // Mark as unpaid - delete the payment record
      const { error: deleteError } = await supabaseAdmin
        .from('membership_dues')
        .delete()
        .eq('student_name_normalized', studentNameNormalized)
        .eq('year_section', yearSection)
        .eq('academic_year', academicYear)
        .eq('semester', semester)

      if (deleteError) {
        return { success: false, error: deleteError.message }
      }

      await invalidateStudentCaches()
      revalidatePath('/management/dues')
      revalidatePath('/dues')

      return { success: true, data: { action: 'unpaid' } }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle payment status'
    return { success: false, error: message }
  }
}

/**
 * Batch toggle payment status for multiple students.
 * Efficiently handles bulk operations.
 */
export async function batchToggleStudentPaymentsAction(payload: {
  students: Array<{
    studentId: string
    studentName: string
    studentNameNormalized: string
    yearLevel: number
    section: string
    yearSection: string
    shouldBePaid: boolean
  }>
  academicYear: string
  semester: string
  recordedBy: string
}): Promise<DuesActionResult<{ paidCount: number; unpaidCount: number }>> {
  try {
    const { students, academicYear, semester, recordedBy } = payload

    const rl = await checkRateLimit(recordedBy || 'batch_toggle_operator', 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment.' }
    }

    const toInsert = students
      .filter((s) => s.shouldBePaid)
      .map((s) => ({
        student_name: s.studentName,
        student_name_normalized: s.studentNameNormalized,
        program: DEFAULT_PROGRAM,
        year_level: s.yearLevel,
        section: s.section,
        year_section: s.yearSection,
        amount: DEFAULT_MEMBERSHIP_FEE,
        is_paid: true,
        academic_year: academicYear,
        semester: semester,
        recorded_by: recordedBy,
        paid_at: new Date().toISOString(),
      }))

    const toDeleteNormalized = students
      .filter((s) => !s.shouldBePaid)
      .map((s) => s.studentNameNormalized)

    let paidCount = 0
    let unpaidCount = 0

    // Batch insert payments
    if (toInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('membership_dues')
        .upsert(toInsert, {
          onConflict: 'student_name_normalized,year_section,academic_year,semester',
          ignoreDuplicates: true,
        })

      if (insertError) {
        return { success: false, error: `Batch insert error: ${insertError.message}` }
      }

      paidCount = toInsert.length
    }

    // Batch delete payments
    if (toDeleteNormalized.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('membership_dues')
        .delete()
        .in('student_name_normalized', toDeleteNormalized)
        .eq('academic_year', academicYear)
        .eq('semester', semester)

      if (deleteError) {
        return { success: false, error: `Batch delete error: ${deleteError.message}` }
      }

      unpaidCount = toDeleteNormalized.length
    }

    await invalidateStudentCaches()
    revalidatePath('/management/dues')
    revalidatePath('/dues')

    return { success: true, data: { paidCount, unpaidCount } }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to batch toggle payments'
    return { success: false, error: message }
  }
}

export interface StudentRegistryStudent {
  id: string
  student_no: string
  full_name: string
  full_name_normalized: string
  year_level: number
  section: string
  year_section: string
  program: string
  is_active: boolean
  has_paid_current_term: boolean
}

export interface StudentRegistryData {
  students: StudentRegistryStudent[]
  stats: {
    totalStudents: number
    totalActive: number
    totalInactive: number
    byYearLevel: { year: number; count: number }[]
    bySectionCount: { yearSection: string; count: number }[]
  }
}

/**
 * Fetch all students with their dues payment status for directory view and stats.
 * Supports status filtering (active, inactive, all) and caches results in Upstash Redis.
 */
export async function getStudentRegistryAction(payload?: {
  academicYear?: string
  semester?: string
  status?: 'all' | 'active' | 'inactive'
}): Promise<DuesActionResult<StudentRegistryData>> {
  try {
    const targetAcademicYear = payload?.academicYear?.trim() || DEFAULT_ACADEMIC_YEAR
    const targetSemester = payload?.semester?.trim() || DEFAULT_SEMESTER
    const statusFilter = payload?.status || 'all'

    // Upstash Redis Cache check
    const cacheKey = `psits:cache:registry:${targetAcademicYear}:${targetSemester}:${statusFilter}`
    const cached = await getCache<StudentRegistryData>(cacheKey)
    if (cached) {
      return { success: true, data: cached }
    }

    // 1. Fetch students according to status filter
    let studentsQuery = supabaseAdmin.from('students').select('*')
    if (statusFilter === 'active') {
      studentsQuery = studentsQuery.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      studentsQuery = studentsQuery.eq('is_active', false)
    }

    const { data: students, error: studentsError } = await studentsQuery
      .order('year_section', { ascending: true })
      .order('full_name', { ascending: true })

    if (studentsError) {
      return { success: false, error: studentsError.message }
    }

    const studentRows = (students || []) as Array<{
      id: string
      student_no: string
      full_name: string
      full_name_normalized: string
      year_level: number
      section: string
      year_section: string
      program: string
      is_active: boolean
    }>

    // 2. Fetch all paid dues for the specified term
    const { data: paidDues, error: duesError } = await supabaseAdmin
      .from('membership_dues')
      .select('student_name_normalized')
      .eq('academic_year', targetAcademicYear)
      .eq('semester', targetSemester)

    if (duesError) {
      return { success: false, error: duesError.message }
    }

    const paidSet = new Set((paidDues || []).map((d) => d.student_name_normalized))

    // 3. Map students with payment flag
    const mappedStudents: StudentRegistryStudent[] = studentRows.map((s) => ({
      id: s.id,
      student_no: s.student_no,
      full_name: s.full_name,
      full_name_normalized: s.full_name_normalized,
      year_level: s.year_level,
      section: s.section,
      year_section: s.year_section,
      program: s.program || DEFAULT_PROGRAM,
      is_active: s.is_active,
      has_paid_current_term: paidSet.has(s.full_name_normalized),
    }))

    // 4. Compute summary statistics
    const byYearMap = new Map<number, number>()
    const bySectionMap = new Map<string, number>()
    let totalActive = 0
    let totalInactive = 0

    for (const s of mappedStudents) {
      if (s.is_active) {
        totalActive++
      } else {
        totalInactive++
      }
      byYearMap.set(s.year_level, (byYearMap.get(s.year_level) || 0) + 1)
      bySectionMap.set(s.year_section, (bySectionMap.get(s.year_section) || 0) + 1)
    }

    const stats = {
      totalStudents: mappedStudents.length,
      totalActive,
      totalInactive,
      byYearLevel: Array.from(byYearMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year),
      bySectionCount: Array.from(bySectionMap.entries())
        .map(([yearSection, count]) => ({ yearSection, count }))
        .sort((a, b) => a.yearSection.localeCompare(b.yearSection)),
    }

    const registryResult: StudentRegistryData = {
      students: mappedStudents,
      stats,
    }

    // Cache in Upstash Redis for 5 minutes (300s)
    await setCache(cacheKey, registryResult, 300)

    return {
      success: true,
      data: registryResult,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch student registry'
    return { success: false, error: message }
  }
}

/**
 * Create a new student in the master registry.
 */
export async function createStudentAction(payload: {
  studentNo: string
  fullName: string
  yearLevel: number
  section: string
  program?: string
}): Promise<DuesActionResult<StudentRegistryStudent>> {
  try {
    const studentNo = payload.studentNo?.trim()
    const fullName = payload.fullName?.trim()
    const yearLevel = payload.yearLevel
    const section = payload.section?.trim().toUpperCase()
    const program = payload.program?.trim().toUpperCase() || 'BSIT'

    const rl = await checkRateLimit(studentNo || 'create_student', 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment.' }
    }

    if (!studentNo) {
      return { success: false, error: 'Student number is required.' }
    }
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Full name is required (minimum 2 characters).' }
    }
    if (![1, 2, 3, 4].includes(yearLevel)) {
      return { success: false, error: 'Year level must be between 1 and 4.' }
    }
    if (!['A', 'B', 'C', 'D', 'E'].includes(section)) {
      return { success: false, error: 'Section must be between A and E.' }
    }

    const yearSection = `${program} ${yearLevel}-${section}`
    const fullNameNormalized = fullName
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')

    const { data, error } = await supabaseAdmin
      .from('students')
      .insert({
        student_no: studentNo,
        full_name: fullName,
        full_name_normalized: fullNameNormalized,
        year_level: yearLevel,
        section: section,
        year_section: yearSection,
        program: program,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Student number "${studentNo}" already exists in the registry.` }
      }
      return { success: false, error: error.message }
    }

    await invalidateStudentCaches()
    revalidatePath('/management/dues')
    revalidatePath('/dues')

    return {
      success: true,
      data: {
        id: data.id,
        student_no: data.student_no,
        full_name: data.full_name,
        full_name_normalized: data.full_name_normalized,
        year_level: data.year_level,
        section: data.section,
        year_section: data.year_section,
        program: data.program,
        is_active: data.is_active,
        has_paid_current_term: false,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create student'
    return { success: false, error: message }
  }
}

/**
 * Update an existing student's record in the registry.
 * Guarantees strict historical academic term isolation:
 * - If name changes, display name is synced. Historical sections in previous terms are untouched.
 * - If section changes, only the active term receipt is updated if provided. Previous terms remain 100% frozen.
 */
export async function updateStudentAction(payload: {
  studentId: string
  studentNo: string
  fullName: string
  yearLevel: number
  section: string
  isActive?: boolean
  program?: string
  activeAcademicYear?: string
  activeSemester?: string
}): Promise<DuesActionResult<StudentRegistryStudent>> {
  try {
    const studentId = payload.studentId?.trim()
    const studentNo = payload.studentNo?.trim()
    const fullName = payload.fullName?.trim()
    const yearLevel = payload.yearLevel
    const section = payload.section?.trim().toUpperCase()
    const program = payload.program?.trim().toUpperCase() || 'BSIT'
    const isActive = payload.isActive !== undefined ? payload.isActive : true

    const rl = await checkRateLimit(studentId || 'update_student', 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment before updating again.' }
    }

    if (!studentId) {
      return { success: false, error: 'Student ID is required.' }
    }
    if (!studentNo) {
      return { success: false, error: 'Student number is required.' }
    }
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Full name is required (minimum 2 characters).' }
    }
    if (![1, 2, 3, 4].includes(yearLevel)) {
      return { success: false, error: 'Year level must be between 1 and 4.' }
    }
    if (!['A', 'B', 'C', 'D', 'E'].includes(section)) {
      return { success: false, error: 'Section must be between A and E.' }
    }

    const yearSection = `${program} ${yearLevel}-${section}`
    const fullNameNormalized = fullName
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')

    // Fetch original student record
    const { data: originalStudent } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()

    const { data, error } = await supabaseAdmin
      .from('students')
      .update({
        student_no: studentNo,
        full_name: fullName,
        full_name_normalized: fullNameNormalized,
        year_level: yearLevel,
        section: section,
        year_section: yearSection,
        program: program,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select('*')
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: `Student number "${studentNo}" is already in use by another student.` }
      }
      return { success: false, error: error.message }
    }

    // Historical Term Protection:
    // 1. If full name changed, update the display name in membership_dues across all terms for consistency.
    //    CRITICAL: NEVER overwrite section or year_section in historical dues records!
    if (originalStudent && originalStudent.full_name_normalized !== fullNameNormalized) {
      await supabaseAdmin
        .from('membership_dues')
        .update({
          student_name: fullName,
          student_name_normalized: fullNameNormalized,
        })
        .eq('student_name_normalized', originalStudent.full_name_normalized)
    }

    // 2. If section or year level changed, ONLY update the dues record for the ACTIVE semester if provided.
    //    Past semesters MUST remain strictly untouched to preserve accurate historical audit trails.
    if (
      payload.activeAcademicYear &&
      payload.activeSemester &&
      originalStudent &&
      (originalStudent.section !== section || originalStudent.year_level !== yearLevel)
    ) {
      await supabaseAdmin
        .from('membership_dues')
        .update({
          year_level: yearLevel,
          section: section,
          year_section: yearSection,
        })
        .eq('student_name_normalized', fullNameNormalized)
        .eq('academic_year', payload.activeAcademicYear)
        .eq('semester', payload.activeSemester)
    }

    await invalidateStudentCaches()
    revalidatePath('/management/dues')
    revalidatePath('/dues')

    return {
      success: true,
      data: {
        id: data.id,
        student_no: data.student_no,
        full_name: data.full_name,
        full_name_normalized: data.full_name_normalized,
        year_level: data.year_level,
        section: data.section,
        year_section: data.year_section,
        program: data.program,
        is_active: data.is_active,
        has_paid_current_term: false,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update student'
    return { success: false, error: message }
  }
}

/**
 * Delete or soft-delete (drop/archive) a student from the registry.
 * Guarantees that historical payment receipts in membership_dues are NEVER deleted.
 */
export async function deleteStudentAction(payload: {
  studentId: string
  permanent?: boolean
}): Promise<DuesActionResult<{ deleted: boolean; action: 'archived' | 'deleted' }>> {
  try {
    const studentId = payload.studentId?.trim()
    const permanent = Boolean(payload.permanent)

    if (!studentId) {
      return { success: false, error: 'Student ID is required.' }
    }

    const rl = await checkRateLimit(studentId, 'dues')
    if (!rl.success) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment.' }
    }

    if (permanent) {
      // PERMANENT REMOVAL FROM ACTIVE REGISTRY:
      // Note: We deliberately DO NOT delete records from membership_dues!
      // University treasury receipts from past terms must be permanently preserved for audit integrity.
      const { error } = await supabaseAdmin
        .from('students')
        .delete()
        .eq('id', studentId)

      if (error) {
        return { success: false, error: error.message }
      }

      await invalidateStudentCaches()
      revalidatePath('/management/dues')
      revalidatePath('/dues')
      return { success: true, data: { deleted: true, action: 'deleted' } }
    } else {
      // SOFT DELETE / DROP / ARCHIVE:
      // Marks student as inactive (dropped out or moved) without removing their history
      const { error } = await supabaseAdmin
        .from('students')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', studentId)

      if (error) {
        return { success: false, error: error.message }
      }

      await invalidateStudentCaches()
      revalidatePath('/management/dues')
      revalidatePath('/dues')
      return { success: true, data: { deleted: true, action: 'archived' } }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete student'
    return { success: false, error: message }
  }
}



