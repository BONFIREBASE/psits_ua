#!/usr/bin/env node
/**
 * Diagnostic script to check if students data exists
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Simple .env.local parser
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

console.log('🔍 PSITS-UA Student Registry Diagnostic Tool')
console.log('='.repeat(60))

// Check environment variables
console.log('\n1️⃣ Checking Environment Variables...')
if (!SUPABASE_URL) {
  console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
  process.exit(1)
} else {
  console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL found')
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local')
  process.exit(1)
} else {
  console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY found')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Check if students table exists and has data
console.log('\n2️⃣ Checking Students Table...')
try {
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('   ❌ Students table does NOT exist')
      console.log('\n   📋 ACTION REQUIRED:')
      console.log('   1. Open Supabase Dashboard → SQL Editor')
      console.log('   2. Copy content from: supabase/migrations/20261001_create_students.sql')
      console.log('   3. Paste and RUN the SQL')
      process.exit(1)
    } else {
      console.log('   ❌ Error checking table:', error.message)
      process.exit(1)
    }
  }

  console.log('   ✅ Students table exists')
  console.log(`   📊 Student count: ${count || 0}`)

  if (count === 0) {
    console.log('\n   ⚠️  Table is EMPTY (0 students)')
    console.log('\n   📋 ACTION REQUIRED:')
    console.log('   Run: npm run import-students')
    process.exit(1)
  } else if (count < 600) {
    console.log(`   ⚠️  Only ${count} students found (expected ~640)`)
    console.log('   Consider re-running import: npm run import-students')
  } else {
    console.log('   ✅ Student data looks good!')
  }
} catch (err) {
  console.log('   ❌ Connection error:', err.message)
  process.exit(1)
}

// Check sample student data
console.log('\n3️⃣ Checking Sample Student Data...')
try {
  const { data, error } = await supabase
    .from('students')
    .select('student_no, full_name, year_section')
    .limit(5)

  if (error) {
    console.log('   ❌ Error fetching data:', error.message)
  } else if (data && data.length > 0) {
    console.log('   ✅ Sample students:')
    data.forEach(s => {
      console.log(`      - ${s.student_no}: ${s.full_name} (${s.year_section})`)
    })
  }
} catch (err) {
  console.log('   ❌ Error:', err.message)
}

// Check section breakdown
console.log('\n4️⃣ Checking Section Distribution...')
try {
  const { data, error } = await supabase
    .from('students')
    .select('year_section')

  if (error) {
    console.log('   ❌ Error:', error.message)
  } else if (data) {
    const sectionCounts = {}
    data.forEach(s => {
      sectionCounts[s.year_section] = (sectionCounts[s.year_section] || 0) + 1
    })

    const sections = Object.keys(sectionCounts).sort()
    console.log('   ✅ Section breakdown:')
    sections.forEach(sec => {
      console.log(`      ${sec}: ${sectionCounts[sec]} students`)
    })
  }
} catch (err) {
  console.log('   ❌ Error:', err.message)
}

console.log('\n' + '='.repeat(60))
console.log('✨ Diagnostic complete!')
console.log('\nNext steps:')
console.log('1. Run: npm run dev')
console.log('2. Open: http://localhost:3000/management/dues')
console.log('3. You should see students in "Student Registry" view')
