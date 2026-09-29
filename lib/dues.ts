export const DEFAULT_PROGRAM = 'BSIT'
export const YEAR_LEVELS = [1, 2, 3, 4] as const
export const SECTIONS = ['A', 'B', 'C', 'D', 'E'] as const

export const DEFAULT_MEMBERSHIP_FEE = 25.00
export const DEFAULT_ACADEMIC_YEAR = '2026-2027'
export const DEFAULT_SEMESTER = '1st Semester'

export const ACADEMIC_YEARS = [
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024',
] as const

export const SEMESTERS = [
  '1st Semester',
  '2nd Semester',
  'Midyear / Summer',
] as const

export type YearLevel = typeof YEAR_LEVELS[number]
export type SectionLetter = typeof SECTIONS[number]
export type AcademicYearOption = typeof ACADEMIC_YEARS[number]
export type SemesterOption = typeof SEMESTERS[number]

/**
 * Normalizes section name string to standard "BSIT {year}-{section}" format.
 */
export function formatYearSection(
  program: string = DEFAULT_PROGRAM,
  year: number | string,
  section: string
): string {
  const cleanProg = (program || DEFAULT_PROGRAM).trim().toUpperCase()
  const cleanYear = String(year).trim()
  const cleanSec = section.trim().toUpperCase()
  return `${cleanProg} ${cleanYear}-${cleanSec}`
}

/**
 * Normalizes a student name for casing and space-insensitive deduplication check.
 * e.g., "  jOhN   dOE  " -> "john doe"
 */
export function normalizeStudentName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Server-Side Student Name Masking Algorithm.
 * Executed STRICTLY on the server before transmitting payloads to the client.
 * Inspect tools / DevTools cannot recover unmasked names.
 *
 * Examples:
 * "Juan Dela Cruz" -> "J*** D*** C***"
 * "Ana Sy" -> "A** S*"
 * "Al" -> "A*"
 * "J" -> "J"
 */
export function maskStudentName(name: string): string {
  if (!name || !name.trim()) return '***'
  
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word.toUpperCase()
      if (word.length === 2) return `${word[0].toUpperCase()}*`
      const maskedLength = Math.min(Math.max(word.length - 1, 2), 4)
      return `${word[0].toUpperCase()}${'*'.repeat(maskedLength)}`
    })
    .join(' ')
}

/**
 * Generates all valid standard section keys:
 * ['BSIT 1-A', 'BSIT 1-B', ... 'BSIT 4-E']
 */
export function getAllStandardSections(): string[] {
  const list: string[] = []
  for (const y of YEAR_LEVELS) {
    for (const s of SECTIONS) {
      list.push(`${DEFAULT_PROGRAM} ${y}-${s}`)
    }
  }
  return list
}

export interface CollectingOfficerOption {
  name: string
  role: string
  category: 'Finance & Treasury' | 'Year Representatives' | 'Executive Council' | 'Other'
}

export const STANDARD_COLLECTING_OFFICERS: CollectingOfficerOption[] = [
  // Finance & Treasury (Primary Collectors)
  { name: 'Charyl Naldo', role: 'Treasurer', category: 'Finance & Treasury' },
  { name: 'John Vincent Peniero', role: 'Assistant Treasurer', category: 'Finance & Treasury' },
  { name: 'Johnric Ysulat', role: 'Auditor', category: 'Finance & Treasury' },
  { name: 'Vhonn Gabriel Habulin', role: 'Assistant Auditor', category: 'Finance & Treasury' },

  // Year Representatives (Section Collectors)
  { name: 'Christine Sumande', role: '1st Year Representative', category: 'Year Representatives' },
  { name: 'Rona Mae Sangcap', role: '2nd Year Representative', category: 'Year Representatives' },
  { name: 'Ramel Azar Jr.', role: '3rd Year Representative', category: 'Year Representatives' },
  { name: 'Carmelo Dapar II', role: '4th Year Representative', category: 'Year Representatives' },

  // Executive Council
  { name: 'Arvin James Balquin', role: 'President', category: 'Executive Council' },
  { name: 'Jared Patrick Evangelio', role: 'Vice President', category: 'Executive Council' },
  { name: 'Kimberly Ann Erispe', role: 'Secretary', category: 'Executive Council' },
  { name: 'Jin Sung Jung', role: 'Assistant Secretary', category: 'Executive Council' },
]

/**
 * Parses a recorded_by string into name and role.
 * e.g. "Charyl Naldo (Treasurer)" -> { name: "Charyl Naldo", role: "Treasurer" }
 */
export function parseRecordedBy(recordedBy?: string | null): { name: string; role: string | null } {
  if (!recordedBy || !recordedBy.trim()) return { name: 'Officer', role: null }
  const match = recordedBy.match(/^(.*?)(?:\s*\((.*?)\))?$/)
  if (match) {
    const rawName = match[1]?.trim() || recordedBy
    const rawRole = match[2]?.trim() || null
    return { name: rawName, role: rawRole }
  }
  return { name: recordedBy, role: null }
}

/**
 * Intelligent Batch Student Name Parser.
 * Designed for minimalist, zero-friction fast entry.
 * Extracts clean student names from text copied from Excel, Google Sheets,
 * word documents, or plain text lists.
 */
export function parseBatchStudentNames(rawInput: string): string[] {
  if (!rawInput || !rawInput.trim()) return []

  const rawLines = rawInput.split(/\r?\n/)
  const candidateNames: string[] = []

  for (const line of rawLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Tab-delimited (Copied multi-column from Google Sheets or Excel)
    if (trimmed.includes('\t')) {
      const cells = trimmed.split('\t').map((c) => c.trim()).filter(Boolean)
      for (const cell of cells) {
        // Discard pure numeric cells (e.g., student IDs, row counts, fees)
        if (/^[\d\s.,₱$]+$/.test(cell)) continue
        // Discard known section or status labels
        if (/^(bsit|act|cs|is)\s*\d/i.test(cell) || /^(paid|unpaid|pending|yes|no)$/i.test(cell)) continue
        // Discard very short fragments
        if (cell.length < 2) continue

        // Strip leading numbering or bullet points
        const cleanCell = cell.replace(/^(\[\d+\]|\d+[\.\)\-:]|\*|\-|•)\s*/, '').trim()
        if (cleanCell.length >= 2 && !/^[\d\s.,₱$]+$/.test(cleanCell)) {
          candidateNames.push(cleanCell)
        }
      }
      continue
    }

    // Comma-separated on a single line (e.g. "Juan Dela Cruz, Maria Santos, Cardo Dalisay")
    // If the line has 2 or more commas and is not just a single "Lastname, Firstname M."
    const commaParts = trimmed.split(',').map((p) => p.trim()).filter(Boolean)
    if (commaParts.length > 2) {
      for (const part of commaParts) {
        const clean = part.replace(/^(\[\d+\]|\d+[\.\)\-:]|\*|\-|•)\s*/, '').trim()
        if (clean.length >= 2 && !/^[\d\s.,₱$]+$/.test(clean)) {
          candidateNames.push(clean)
        }
      }
      continue
    }

    // Single line entry: strip leading numbering or bullet points
    // e.g. "1. Juan Dela Cruz", "2) Maria Santos", "• Pedro Penduko"
    const cleaned = trimmed.replace(/^(\[\d+\]|\d+[\.\)\-:]|\*|\-|•)\s*/, '').trim()
    if (cleaned.length >= 2 && !/^[\d\s.,₱$]+$/.test(cleaned)) {
      candidateNames.push(cleaned)
    }
  }

  // Deduplicate within the batch (case-insensitive) while preserving display casing of first occurrence
  const seen = new Set<string>()
  const uniqueNames: string[] = []

  for (const name of candidateNames) {
    const norm = normalizeStudentName(name)
    if (!seen.has(norm)) {
      seen.add(norm)
      uniqueNames.push(name)
    }
  }

  return uniqueNames
}

