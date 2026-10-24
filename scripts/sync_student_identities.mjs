import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
let url = '', key = ''
env.split('\n').forEach(l => {
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = l.slice('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '')
  if (l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = l.slice('SUPABASE_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '')
})

if (!url || !key) {
  console.error('Missing Supabase URL or Service Role Key in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

function normalizeWords(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function calculateStudentNameMatch(inputName, studentFullName) {
  if (!inputName || !studentFullName) return { isMatch: false, matchedTokens: 0, coverage: 0, jaccard: 0 }

  const tokensA = normalizeWords(inputName).filter(t => t.length >= 2)
  const tokensB = normalizeWords(studentFullName).filter(t => t.length >= 2)
  if (tokensA.length === 0 || tokensB.length === 0) return { isMatch: false, matchedTokens: 0, coverage: 0, jaccard: 0 }

  const setA = new Set(tokensA)
  const setB = new Set(tokensB)
  let matched = 0
  for (const t of setA) {
    if (setB.has(t)) matched++
  }

  const minTokens = Math.min(setA.size, setB.size)
  const coverage = matched / minTokens
  const jaccard = matched / new Set([...setA, ...setB]).size

  // High-confidence matching criteria:
  // 1. Must match at least 2 distinct tokens and coverage >= 60% of shorter name
  // 2. Or if a single-token name, must match exactly with jaccard >= 0.5
  const isMatch = (matched >= 2 && coverage >= 0.6) || (minTokens === 1 && matched === 1 && jaccard >= 0.5)

  return { isMatch, matchedTokens: matched, coverage, jaccard }
}

function findBestMatchingStudent(inputName, candidates) {
  if (!inputName || !candidates || candidates.length === 0) return null

  const scored = candidates
    .map(c => ({ candidate: c, ...calculateStudentNameMatch(inputName, c.full_name) }))
    .filter(x => x.isMatch)
    .sort((a, b) => b.matchedTokens - a.matchedTokens || b.coverage - a.coverage || b.jaccard - a.jaccard)

  return scored[0]?.candidate || null
}

console.log('--- Starting Smart Identity Synchronization ---')
const { data: usersData, error: uErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
if (uErr) {
  console.error('Failed to list users:', uErr)
  process.exit(1)
}

const { data: students, error: sErr } = await supabase.from('students').select('*').eq('is_active', true)
if (sErr) {
  console.error('Failed to fetch students:', sErr)
  process.exit(1)
}

console.log(`Found ${usersData.users.length} users and ${students.length} student roster records.`)

let updatedCount = 0
let skippedCount = 0

for (const user of usersData.users) {
  const meta = user.user_metadata || {}
  const email = (user.email || '').toLowerCase().trim()
  const googleName = meta.full_name || meta.name || ''

  if (!email.endsWith('@antiquespride.edu.ph')) {
    skippedCount++
    continue
  }

  // 1. Check if email prefix matches student_no directly
  const idMatch = email.match(/^(\d{4})s(\d{5})@antiquespride\.edu\.ph$/i)
  const possibleNos = idMatch
    ? [`${idMatch[1]}-S${idMatch[2]}`, `${idMatch[1]}s${idMatch[2]}`, email.split('@')[0]]
    : [email.split('@')[0]]

  const candidatesByNo = students.filter(s => possibleNos.includes(s.student_no) || possibleNos.includes(s.student_no.toLowerCase()))

  let matchingStudent = null
  if (candidatesByNo.length > 0) {
    matchingStudent = googleName ? findBestMatchingStudent(googleName, candidatesByNo) : candidatesByNo[0]
  }

  // 2. If no candidate by student_no matches name, search all students by name similarity
  if (!matchingStudent && googleName && googleName.trim().split(/\s+/).length >= 2) {
    matchingStudent = findBestMatchingStudent(googleName, students)
  }

  if (matchingStudent) {
    const isAlreadyBound = meta.student_no === matchingStudent.student_no && meta.identity_status === 'verified_roster'
    if (isAlreadyBound) {
      skippedCount++
      continue
    }

    console.log(`\nBinding Student Identity for: ${email}`)
    console.log(`  User: "${googleName}" (${meta.community_username || 'no handle'})`)
    console.log(`  Bound Roster Record: ${matchingStudent.student_no} - ${matchingStudent.full_name} (${matchingStudent.year_section})`)

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        student_no: matchingStudent.student_no,
        roster_full_name: matchingStudent.full_name,
        year_section: matchingStudent.year_section || meta.year_section || 'BSIT',
        identity_status: 'verified_roster',
      },
    })

    if (updateErr) {
      console.error(`  Error updating user ${user.id}:`, updateErr.message)
    } else {
      updatedCount++
      console.log('  Successfully bound!')
    }
  } else {
    // Flag unmapped institutional users safely without guessing
    if (meta.identity_status !== 'google_verified') {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          identity_status: 'google_verified',
        },
      })
    }
    skippedCount++
  }
}

console.log(`\n--- Synchronization Complete ---`)
console.log(`Successfully bound: ${updatedCount} users`)
console.log(`Already bound / skipped: ${skippedCount} users`)
