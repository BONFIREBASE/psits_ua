#!/usr/bin/env node
/**
 * Analyze duplicate student numbers in the Excel file
 * This helps identify which students have duplicate entries
 */

import pkg from 'xlsx'
const { readFile, utils } = pkg

console.log('🔍 PSITS-UA Duplicate Student Analysis')
console.log('='.repeat(60))

const workbook = readFile('./scripts/University_of_Antique_Master_Class_List.xlsx')
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]
const rawData = utils.sheet_to_json(worksheet)

console.log(`📊 Total rows in Excel: ${rawData.length}\n`)

// Track all student numbers and their occurrences
const studentMap = new Map()

rawData.forEach((row, index) => {
  const studentNo = row['Student No.']
  const name = row['Name']
  const section = row['Section']
  
  if (studentNo && name) {
    if (!studentMap.has(studentNo)) {
      studentMap.set(studentNo, [])
    }
    studentMap.get(studentNo).push({
      rowNum: index + 2, // Excel row number (1-indexed + header)
      name,
      section,
      studentNo
    })
  }
})

// Find duplicates
const duplicates = []
const uniqueStudents = []

studentMap.forEach((occurrences, studentNo) => {
  if (occurrences.length > 1) {
    duplicates.push({ studentNo, occurrences })
  } else {
    uniqueStudents.push(occurrences[0])
  }
})

console.log(`✅ Unique students: ${uniqueStudents.length}`)
console.log(`❌ Duplicate student numbers: ${duplicates.length}`)
console.log(`📊 Total occurrences of duplicates: ${duplicates.reduce((sum, d) => sum + d.occurrences.length, 0)}`)
console.log('')

if (duplicates.length > 0) {
  console.log('=' .repeat(60))
  console.log('📋 DUPLICATE STUDENT NUMBERS FOUND:')
  console.log('=' .repeat(60))
  
  duplicates.forEach(({ studentNo, occurrences }) => {
    console.log(`\n🔴 Student No: ${studentNo} (appears ${occurrences.length} times)`)
    occurrences.forEach((occ, idx) => {
      console.log(`   ${idx + 1}. Row ${occ.rowNum}: ${occ.name} - ${occ.section}`)
    })
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('💡 RECOMMENDED ACTIONS:')
  console.log('='.repeat(60))
  console.log('')
  console.log('Option 1: Manual Review (Most Accurate)')
  console.log('  1. Open the Excel file')
  console.log('  2. Review each duplicate listed above')
  console.log('  3. Determine which entry is correct:')
  console.log('     - Same person in different sections? Keep latest enrollment')
  console.log('     - Data entry error? Fix the wrong student number')
  console.log('     - Transferred student? Update section, keep one entry')
  console.log('  4. Delete or correct duplicate rows')
  console.log('  5. Save the Excel file')
  console.log('  6. Re-run: npm run import-students')
  console.log('')
  console.log('Option 2: Auto-Clean (Keep First Occurrence)')
  console.log('  - Script keeps first occurrence of each student number')
  console.log('  - Other duplicates are ignored')
  console.log('  - Result: ' + uniqueStudents.length + ' unique students')
  console.log('  - Current import script already does this')
  console.log('')
  console.log('Option 3: Contact Registrar')
  console.log('  - Request updated master class list')
  console.log('  - Ensure no duplicate student numbers')
  console.log('  - Get official count of enrolled students')
  console.log('')
}

// Check for students with same name but different IDs
console.log('='.repeat(60))
console.log('🔍 Checking for same name, different student numbers...')
console.log('='.repeat(60))

const nameMap = new Map()
rawData.forEach((row, index) => {
  const studentNo = row['Student No.']
  const name = row['Name']?.trim().toUpperCase()
  
  if (name && studentNo) {
    if (!nameMap.has(name)) {
      nameMap.set(name, [])
    }
    nameMap.get(name).push({
      rowNum: index + 2,
      studentNo,
      name: row['Name'],
      section: row['Section']
    })
  }
})

const sameName = []
nameMap.forEach((occurrences, name) => {
  if (occurrences.length > 1) {
    // Check if they have different student numbers
    const uniqueIDs = new Set(occurrences.map(o => o.studentNo))
    if (uniqueIDs.size > 1) {
      sameName.push({ name, occurrences })
    }
  }
})

if (sameName.length > 0) {
  console.log(`\n⚠️  Found ${sameName.length} names with different student numbers:`)
  sameName.slice(0, 10).forEach(({ name, occurrences }) => {
    console.log(`\n   Name: ${occurrences[0].name}`)
    occurrences.forEach(occ => {
      console.log(`      - ${occ.studentNo} (${occ.section}) - Row ${occ.rowNum}`)
    })
  })
  if (sameName.length > 10) {
    console.log(`\n   ... and ${sameName.length - 10} more`)
  }
  console.log('\n   ℹ️  These might be different people with same name or data errors')
} else {
  console.log('✅ No issues found with same name/different IDs')
}

console.log('\n' + '='.repeat(60))
console.log('📊 SUMMARY:')
console.log('='.repeat(60))
console.log(`Total rows in Excel:        ${rawData.length}`)
console.log(`Unique students:            ${uniqueStudents.length}`)
console.log(`Duplicate student numbers:  ${duplicates.length}`)
console.log(`Current import will save:   ${uniqueStudents.length} students`)
console.log('')
console.log('✨ Analysis complete!')
