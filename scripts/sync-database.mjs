#!/usr/bin/env node
/**
 * PSITS-UA Database Synchronization Utility
 *
 * Pulls live tables from Supabase and synchronizes:
 * 1. `supabase/seed.sql` - Idempotent SQL seed for local database & localhost testing.
 * 2. `data/officers.ts` - Synchronizes local TypeScript officers roster with live DB.
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// 1. Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(rootDir, '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '').replace(/\r$/, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/* ─── SQL Formatting Utilities ─── */

function sqlVal(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'number') return isFinite(val) ? val.toString() : 'NULL'
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'::text[]"
    const escaped = val.map((item) => `"${String(item).replace(/"/g, '\\"')}"`).join(',')
    return `'{${escaped}}'::text[]`
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  }
  // String
  return `'${String(val).replace(/'/g, "''")}'`
}

function generateTableInserts(tableName, pkey, rows, conflictColumns = [pkey]) {
  if (!rows || rows.length === 0) return `-- No records found for ${tableName}\n`

  const cols = Object.keys(rows[0])
  const conflictTarget = conflictColumns.join(', ')

  let sql = `-- ─── ${tableName.toUpperCase()} (${rows.length} rows) ───\n`
  for (const row of rows) {
    const colList = cols.join(', ')
    const valList = cols.map((c) => sqlVal(row[c])).join(', ')
    const updateList = cols
      .filter((c) => !conflictColumns.includes(c))
      .map((c) => `${c} = EXCLUDED.${c}`)
      .join(', ')

    sql += `INSERT INTO public.${tableName} (${colList})\nVALUES (${valList})\n`
    if (updateList) {
      sql += `ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateList};\n\n`
    } else {
      sql += `ON CONFLICT (${conflictTarget}) DO NOTHING;\n\n`
    }
  }
  return sql
}

async function main() {
  console.log('🔄 Starting PSITS-UA Database Sync from Supabase...')
  console.log(`📡 Connected to: ${SUPABASE_URL}\n`)

  // 1. Fetch tables
  const [
    facultyRes,
    officersRes,
    postsRes,
    eventsRes,
    projectsRes,
    bannersRes,
    archiveRes,
  ] = await Promise.all([
    supabase.from('faculty_leadership').select('*').order('id'),
    supabase.from('officers').select('*').order('created_at', { ascending: true }),
    supabase.from('posts').select('*').order('created_at', { ascending: true }),
    supabase.from('events').select('*').order('created_at', { ascending: true }),
    supabase.from('projects').select('*').order('created_at', { ascending: true }),
    supabase.from('banners').select('*').order('display_order', { ascending: true }),
    supabase.from('archive_photos').select('*').order('display_order', { ascending: true }),
  ])

  if (officersRes.error) console.error('Error fetching officers:', officersRes.error)
  if (postsRes.error) console.error('Error fetching posts:', postsRes.error)
  if (eventsRes.error) console.error('Error fetching events:', eventsRes.error)
  if (projectsRes.error) console.error('Error fetching projects:', projectsRes.error)
  if (bannersRes.error) console.error('Error fetching banners:', bannersRes.error)
  if (archiveRes.error) console.error('Error fetching archive_photos:', archiveRes.error)
  if (facultyRes.error) console.error('Error fetching faculty_leadership:', facultyRes.error)

  const faculty = facultyRes.data || []
  const officers = officersRes.data || []
  const posts = postsRes.data || []
  const events = eventsRes.data || []
  const projects = projectsRes.data || []
  const banners = bannersRes.data || []
  const archive = archiveRes.data || []

  console.log(`📊 Fetched Records:`)
  console.log(`  • faculty_leadership: ${faculty.length}`)
  console.log(`  • officers:           ${officers.length}`)
  console.log(`  • posts:              ${posts.length}`)
  console.log(`  • events:             ${events.length}`)
  console.log(`  • projects:           ${projects.length}`)
  console.log(`  • banners:            ${banners.length}`)
  console.log(`  • archive_photos:     ${archive.length}\n`)

  // 2. Generate supabase/seed.sql
  let seedSql = `-- =====================================================================\n`
  seedSql += `-- PSITS-UA Local Development Seed SQL\n`
  seedSql += `-- Generated: ${new Date().toISOString()}\n`
  seedSql += `-- Source: Live Supabase Production Sync\n`
  seedSql += `-- =====================================================================\n\n`

  seedSql += generateTableInserts('faculty_leadership', 'id', faculty)
  seedSql += generateTableInserts('officers', 'id', officers)
  seedSql += generateTableInserts('posts', 'id', posts)
  seedSql += generateTableInserts('events', 'id', events)
  seedSql += generateTableInserts('projects', 'id', projects)
  seedSql += generateTableInserts('banners', 'id', banners)
  seedSql += generateTableInserts('archive_photos', 'id', archive)

  const seedPath = path.join(rootDir, 'supabase', 'seed.sql')
  fs.writeFileSync(seedPath, seedSql, 'utf-8')
  console.log(`✅ Generated local SQL seed: ${seedPath}`)

  // 3. Update data/officers.ts
  const deanRow = faculty.find((f) => f.id === 'dean')
  const adviserRow = faculty.find((f) => f.id === 'adviser')

  const regularOfficers = officers.filter((o) => !o.is_pubmat)
  const pubmatOfficers = officers.filter((o) => o.is_pubmat)

  let officersTs = `export type Adviser = {
  name: string
  credentials: string
  title: string
  department: string
  institution: string
  image?: string
}

export type Officer = {
  name: string
  position: string
  roleGroup: 'Executive' | 'Secretariat & Finance' | 'Operations & PR' | 'Year Representatives'
  department: string
  image?: string
  quote?: string
}

export type Dean = {
  name: string
  credentials: string
  title: string
  college: string
  institution: string
  image?: string
}

export const dean: Dean = {
  name: ${JSON.stringify(deanRow?.name || 'Dr. John C. Amar')},
  credentials: ${JSON.stringify(deanRow?.credentials || 'DM')},
  title: ${JSON.stringify(deanRow?.title || 'Dean')},
  college: ${JSON.stringify(deanRow?.department_or_college || 'College of Computing and Information Sciences')},
  institution: ${JSON.stringify(deanRow?.institution || 'University of Antique — Main Campus')},
  image: ${JSON.stringify(deanRow?.image_url || '/assets/dean.png')},
}

export const adviser: Adviser = {
  name: ${JSON.stringify(adviserRow?.name || 'Carl Spence Percy')},
  credentials: ${JSON.stringify(adviserRow?.credentials || 'MIT')},
  title: ${JSON.stringify(adviserRow?.title || 'BSIT Program Head / PSITS Adviser')},
  department: ${JSON.stringify(adviserRow?.department_or_college || 'College of Computing and Information Sciences')},
  institution: ${JSON.stringify(adviserRow?.institution || 'University of Antique — Main Campus')},
}

export const officers: Officer[] = [
`

  for (const o of regularOfficers) {
    officersTs += `  {\n`
    officersTs += `    name: ${JSON.stringify(o.name)},\n`
    officersTs += `    position: ${JSON.stringify(o.position)},\n`
    officersTs += `    roleGroup: ${JSON.stringify(o.role_group)},\n`
    officersTs += `    department: ${JSON.stringify(o.year_section || 'BSIT · CCIS')},\n`
    if (o.image_url) {
      officersTs += `    image: ${JSON.stringify(o.image_url)},\n`
    }
    if (o.quote) {
      officersTs += `    quote: ${JSON.stringify(o.quote)},\n`
    }
    officersTs += `  },\n`
  }

  officersTs += `]\n\n`

  officersTs += `export type PubmatMember = {
  name: string
  role: string
  isLead?: boolean
  image?: string
}

export const pubmatTeam: PubmatMember[] = [
`

  for (const p of pubmatOfficers) {
    const isLead = (p.position || '').toLowerCase().includes('lead') || (p.pubmat_role || '').toLowerCase().includes('lead')
    officersTs += `  {\n`
    officersTs += `    name: ${JSON.stringify(p.name)},\n`
    officersTs += `    role: ${JSON.stringify(p.position || p.pubmat_role || 'Creative Staff')},\n`
    officersTs += `    isLead: ${isLead},\n`
    if (p.image_url) {
      officersTs += `    image: ${JSON.stringify(p.image_url)},\n`
    }
    officersTs += `  },\n`
  }

  officersTs += `]\n`

  const officersTsPath = path.join(rootDir, 'data', 'officers.ts')
  fs.writeFileSync(officersTsPath, officersTs, 'utf-8')
  console.log(`✅ Synchronized local data file: ${officersTsPath}`)
  console.log('\n🎉 Database sync completed successfully!')
}

main().catch((err) => {
  console.error('Fatal sync error:', err)
  process.exit(1)
})
