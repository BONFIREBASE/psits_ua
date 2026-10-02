#!/usr/bin/env tsx
/**
 * Import Students from University of Antique Master Class List
 * 
 * This script reads the Excel file containing the master student list
 * and imports all 605 students into the students table in Supabase.
 * 
 * Usage:
 *   npx tsx scripts/import-students.ts "path/to/University_of_Antique_Master_Class_List.xlsx"
 */

import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase credentials in environment variables')
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface StudentRow {
  student_no: string
  full_name: string
  full_name_normalized: string
  year_level: number
  section: string
  year_section: string
  program: string
  is_active: boolean
}

/**
 * Normalize student name for duplicate detection
 */
function normalizeStudentName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
}

/**
 * Format year section (e.g., "BSIT 1-A")
 */
function formatYearSection(program: string, yearLevel: number, section: string): string {
  return `${program} ${yearLevel}-${section}`
}

/**
 * Parse Excel file and extract student data
 */
function parseExcelFile(filePath: string): StudentRow[] {
  console.log(`📖 Reading Excel file: ${filePath}`)
  
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to JSON
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet)
  
  console.log(`📊 Found ${rawData.length} rows in Excel file`)
  
  const students: StudentRow[] = []
  const errors: string[] = []
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i]
    const rowNum = i + 2 // Excel row number (1-indexed + header)
    
    try {
      // Try to extract student number and name from various possible column names
      let studentNo = row['Student No'] || row['Student Number'] || row['ID'] || row['student_no'] || row['No.'] || row['No']
      let fullName = row['Name'] || row['Full Name'] || row['Student Name'] || row['full_name'] || row['STUDENT NAME']
      let yearLevel = row['Year'] || row['Year Level'] || row['year_level'] || row['YEAR LEVEL']
      let section = row['Section'] || row['section'] || row['SECTION']
      
      // Additional fallback: Try to parse from concatenated fields
      if (!studentNo && row['STUDENT NO.']) studentNo = row['STUDENT NO.']
      if (!fullName && row['FULL NAME']) fullName = row['FULL NAME']
      if (!yearLevel && row['YEAR']) yearLevel = row['YEAR']
      
      // Clean and validate data
      if (!studentNo || !fullName) {
        errors.push(`Row ${rowNum}: Missing student number or name`)
        continue
      }
      
      studentNo = String(studentNo).trim()
      fullName = String(fullName).trim()
      
      // Parse year level
      let yearLevelNum: number
      if (typeof yearLevel === 'number') {
        yearLevelNum = yearLevel
      } else if (typeof yearLevel === 'string') {
        // Extract number from strings like "1st Year", "2nd", "Year 3", etc.
        const match = yearLevel.match(/(\d+)/)
        yearLevelNum = match ? parseInt(match[1], 10) : 1
      } else {
        // Try to infer from year_section if available
        const yearSection = row['Year Section'] || row['year_section'] || ''
        const match = String(yearSection).match(/(\d+)/)
        yearLevelNum = match ? parseInt(match[1], 10) : 1
      }
      
      // Parse section
      let sectionLetter: string
      if (section) {
        sectionLetter = String(section).trim().toUpperCase().charAt(0)
      } else {
        // Try to extract from year_section
        const yearSection = row['Year Section'] || row['year_section'] || ''
        const match = String(yearSection).match(/[A-E]/i)
        sectionLetter = match ? match[0].toUpperCase() : 'A'
      }
      
      // Validate year level and section
      if (yearLevelNum < 1 || yearLevelNum > 4) {
        errors.push(`Row ${rowNum}: Invalid year level ${yearLevelNum} (must be 1-4)`)
        continue
      }
      
      if (!['A', 'B', 'C', 'D', 'E'].includes(sectionLetter)) {
        errors.push(`Row ${rowNum}: Invalid section ${sectionLetter} (must be A-E)`)
        continue
      }
      
      students.push({
        student_no: studentNo,
        full_name: fullName,
        full_name_normalized: normalizeStudentName(fullName),
        year_level: yearLevelNum,
        section: sectionLetter,
        year_section: formatYearSection('BSIT', yearLevelNum, sectionLetter),
        program: 'BSIT',
        is_active: true,
      })
    } catch (error) {
      errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  if (errors.length > 0) {
    console.warn(`⚠️  Encountered ${errors.length} errors:`)
    errors.slice(0, 10).forEach(err => console.warn(`   ${err}`))
    if (errors.length > 10) {
      console.warn(`   ... and ${errors.length - 10} more errors`)
    }
  }
  
  console.log(`✅ Successfully parsed ${students.length} students`)
  
  return students
}

/**
 * Import students into Supabase
 */
async function importStudents(students: StudentRow[]) {
  console.log(`\n🚀 Starting import of ${students.length} students to Supabase...`)
  
  // Check for duplicates in the data itself
  const studentNoSet = new Set<string>()
  const duplicateStudentNos: string[] = []
  
  students.forEach(student => {
    if (studentNoSet.has(student.student_no)) {
      duplicateStudentNos.push(student.student_no)
    }
    studentNoSet.add(student.student_no)
  })
  
  if (duplicateStudentNos.length > 0) {
    console.warn(`⚠️  Found ${duplicateStudentNos.length} duplicate student numbers in Excel file:`)
    console.warn(`   ${duplicateStudentNos.slice(0, 5).join(', ')}${duplicateStudentNos.length > 5 ? '...' : ''}`)
  }
  
  // Batch insert (Supabase recommends batches of 1000 or less)
  const BATCH_SIZE = 100
  let imported = 0
  let skipped = 0
  let errors = 0
  
  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const batch = students.slice(i, i + BATCH_SIZE)
    
    try {
      const { data, error } = await supabase
        .from('students')
        .upsert(batch, {
          onConflict: 'student_no',
          ignoreDuplicates: false, // Update existing records
        })
        .select('id')
      
      if (error) {
        console.error(`❌ Error importing batch ${i / BATCH_SIZE + 1}:`, error.message)
        errors += batch.length
      } else {
        const count = data?.length || batch.length
        imported += count
        console.log(`   ✓ Batch ${i / BATCH_SIZE + 1}: Imported ${count} students`)
      }
    } catch (error) {
      console.error(`❌ Exception importing batch ${i / BATCH_SIZE + 1}:`, error)
      errors += batch.length
    }
  }
  
  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported} students`)
  if (skipped > 0) console.log(`   ⏭️  Skipped: ${skipped} duplicates`)
  if (errors > 0) console.log(`   ❌ Errors: ${errors} students`)
  
  // Print section breakdown
  const sectionBreakdown = new Map<string, number>()
  students.forEach(s => {
    const count = sectionBreakdown.get(s.year_section) || 0
    sectionBreakdown.set(s.year_section, count + 1)
  })
  
  console.log(`\n📚 Section Breakdown:`)
  const sortedSections = Array.from(sectionBreakdown.entries()).sort((a, b) => {
    const [yearA] = a[0].match(/\d+/) || ['0']
    const [yearB] = b[0].match(/\d+/) || ['0']
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
  
  if (args.length === 0) {
    console.error('❌ Error: Please provide the path to the Excel file')
    console.error('\nUsage:')
    console.error('  npx tsx scripts/import-students.ts "path/to/University_of_Antique_Master_Class_List.xlsx"')
    process.exit(1)
  }
  
  const excelFilePath = args[0]
  
  // Resolve path
  const resolvedPath = path.isAbsolute(excelFilePath)
    ? excelFilePath
    : path.resolve(process.cwd(), excelFilePath)
  
  // Check if file exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Error: File not found: ${resolvedPath}`)
    process.exit(1)
  }
  
  console.log('🎓 PSITS-UA Student Import Tool')
  console.log('=' .repeat(60))
  
  try {
    // Parse Excel file
    const students = parseExcelFile(resolvedPath)
    
    if (students.length === 0) {
      console.error('❌ No valid students found in Excel file')
      process.exit(1)
    }
    
    // Import to Supabase
    await importStudents(students)
    
    console.log('\n✨ Import completed successfully!')
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

main()
