#!/usr/bin/env node
/**
 * Import Students from University of Antique Master Class List
 * 
 * Reads the official Excel file across all section sheets (BS INFO 1-A to 4-D),
 * safely resolves registrar ID collisions for distinct students, preserves primary
 * home sections for cross-enrollees, preserves manual entries with dues records,
 * and upserts all students into Supabase.
 * 
 * Usage:
 *   npm run import-students
 *   OR
 *   node scripts/import-students.mjs "path/to/University_of_Antique_Master_Class_List.xlsx"
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import pkg from 'xlsx'
const { readFile, utils } = pkg
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function loadEnv() {
  const envPath = path.join(rootDir, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        process.env[key] = value
      }
    })
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in environment variables')
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function normalizeStudentName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

function normalizeKey(name) {
  return name.trim().toLowerCase().replace(/[^a-z]/g, '')
}

/**
 * Parse Excel file across all section sheets
 */
function parseExcelFile(filePath) {
  console.log(`📖 Reading Excel file: ${filePath}`)
  
  const workbook = readFile(filePath)
  const uniquePeople = new Map()
  const sheetNames = workbook.SheetNames.filter(s => s !== 'Master List')

  console.log(`📊 Scanning ${sheetNames.length} individual section sheets...`)

  for (const sheet of sheetNames) {
    const worksheet = workbook.Sheets[sheet]
    const rows = utils.sheet_to_json(worksheet, { header: 1 })
    
    // Parse year level and section from sheet name (e.g., "BS INFO 1-A", "BSIT 1-A")
    const match = sheet.match(/(\d+)-([A-E])/i)
    if (!match) continue

    const yearLevelNum = parseInt(match[1], 10)
    const sectionLetter = match[2].toUpperCase()

    rows.slice(1).forEach((r, idx) => {
      let studentNo = ''
      let fullName = ''

      r.forEach(cell => {
        const str = String(cell || '').trim()
        if (/^\d{4}-/i.test(str)) studentNo = str
      })
      r.forEach(cell => {
        const str = String(cell || '').trim()
        if (str && !/^\d+$/.test(str) && !/^\d{4}-/i.test(str)) fullName = str
      })

      if (fullName) {
        const key = normalizeKey(fullName)
        // Keep first occurrence (primary cohort)
        if (!uniquePeople.has(key)) {
          uniquePeople.set(key, {
            originalStudentNo: studentNo,
            full_name: fullName,
            full_name_normalized: normalizeStudentName(fullName),
            year_level: yearLevelNum,
            section: sectionLetter,
            year_section: `BSIT ${yearLevelNum}-${sectionLetter}`,
            program: 'BSIT',
            is_active: true,
            sheet,
          })
        }
      }
    })
  }

  // Fallback: If no individual section sheets, fall back to Sheet 0
  if (uniquePeople.size === 0) {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = utils.sheet_to_json(firstSheet)
    for (const row of rawData) {
      const studentNo = String(row['Student No.'] || '').trim()
      const fullName = String(row['Name'] || '').trim()
      const yearSection = String(row['Section'] || '').trim()
      const match = yearSection.match(/(\d+)-([A-E])/i)
      if (fullName && match) {
        const key = normalizeKey(fullName)
        if (!uniquePeople.has(key)) {
          const y = parseInt(match[1], 10)
          const s = match[2].toUpperCase()
          uniquePeople.set(key, {
            originalStudentNo: studentNo,
            full_name: fullName,
            full_name_normalized: normalizeStudentName(fullName),
            year_level: y,
            section: s,
            year_section: `BSIT ${y}-${s}`,
            program: 'BSIT',
            is_active: true,
            sheet: yearSection,
          })
        }
      }
    }
  }

  // Disambiguate duplicate registrar IDs for different people
  const studentList = []
  const usedStudentNos = new Set()
  const idCounts = {}

  for (const person of uniquePeople.values()) {
    let finalStudentNo = person.originalStudentNo
    if (!finalStudentNo) {
      finalStudentNo = `2026-TEMP-${studentList.length + 1}`
    }

    if (usedStudentNos.has(finalStudentNo)) {
      const count = (idCounts[person.originalStudentNo] || 1) + 1
      idCounts[person.originalStudentNo] = count
      const suffix = String.fromCharCode(64 + count) // -B, -C, etc.
      finalStudentNo = `${person.originalStudentNo}-${suffix}`
      console.log(`   ℹ️ Resolved duplicate ID: ${person.full_name} -> ${finalStudentNo}`)
    } else {
      idCounts[person.originalStudentNo] = 1
    }

    usedStudentNos.add(finalStudentNo)

    studentList.push({
      student_no: finalStudentNo,
      full_name: person.full_name,
      full_name_normalized: person.full_name_normalized,
      year_level: person.year_level,
      section: person.section,
      year_section: person.year_section,
      program: person.program,
      is_active: person.is_active,
    })
  }

  console.log(`✅ Successfully extracted ${studentList.length} distinct students`)
  return studentList
}

/**
 * Import students into Supabase, preserving manual paid entries
 */
async function importStudents(students) {
  console.log(`\n🚀 Starting import of ${students.length} students to Supabase...`)

  // Ensure verified manual entries (e.g., Hannah Kriezel Garcia) are included
  const hannahStudent = {
    student_no: '2023-S09001',
    full_name: 'GARCIA, HANNAH KRIEZEL',
    full_name_normalized: 'garcia hannah kriezel',
    year_level: 4,
    section: 'C',
    year_section: 'BSIT 4-C',
    program: 'BSIT',
    is_active: true,
  }

  if (!students.some(s => s.student_no === hannahStudent.student_no || s.full_name_normalized === hannahStudent.full_name_normalized)) {
    students.push(hannahStudent)
    console.log(`   ℹ️ Preserved verified paid student: ${hannahStudent.full_name}`)
  }

  // Batch upsert (100 at a time)
  const BATCH_SIZE = 100
  let imported = 0
  let errors = 0

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE)
    
    try {
      const { data, error } = await supabase
        .from('students')
        .upsert(batch, {
          onConflict: 'student_no',
          ignoreDuplicates: false,
        })
        .select('id')
      
      if (error) {
        console.error(`❌ Error importing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message)
        errors += batch.length
      } else {
        const count = data?.length || batch.length
        imported += count
        console.log(`   ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: Upserted ${count} students`)
      }
    } catch (error) {
      console.error(`❌ Exception in batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
      errors += batch.length
    }
  }

  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Total Active Students: ${imported}`)
  if (errors > 0) console.log(`   ❌ Errors: ${errors}`)

  // Section breakdown
  const sectionBreakdown = new Map()
  students.forEach(s => {
    const count = sectionBreakdown.get(s.year_section) || 0
    sectionBreakdown.set(s.year_section, count + 1)
  })

  console.log(`\n📚 Section Breakdown:`)
  const sortedSections = Array.from(sectionBreakdown.entries()).sort((a, b) => {
    const yearA = a[0].match(/\d+/)?.[0] || '0'
    const yearB = b[0].match(/\d+/)?.[0] || '0'
    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB)
    return a[0].localeCompare(b[0])
  })

  sortedSections.forEach(([section, count]) => {
    console.log(`   ${section}: ${count} students`)
  })
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  let excelFilePath = args[0] || path.join(__dirname, 'University_of_Antique_Master_Class_List.xlsx')
  
  if (!fs.existsSync(excelFilePath)) {
    const downloadsFallback = 'C:\\Users\\BONFIRE BASE\\Downloads\\University_of_Antique_Master_Class_List.xlsx'
    if (fs.existsSync(downloadsFallback)) {
      excelFilePath = downloadsFallback
    }
  }

  const resolvedPath = path.isAbsolute(excelFilePath)
    ? excelFilePath
    : path.resolve(process.cwd(), excelFilePath)

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Error: File not found: ${resolvedPath}`)
    process.exit(1)
  }

  console.log('🎓 PSITS-UA Student Import Tool (Hardened)')
  console.log('='.repeat(60))

  try {
    const students = parseExcelFile(resolvedPath)
    if (students.length === 0) {
      console.error('❌ No valid students found in Excel file')
      process.exit(1)
    }

    await importStudents(students)
    console.log('\n✨ Import and sync completed successfully!')
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
