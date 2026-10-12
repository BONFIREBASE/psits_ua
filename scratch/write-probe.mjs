// Temporary probe: confirm which community writes the live schema rejects. Cleans up after itself.
import * as fs from 'fs'
import { Client, Databases, ID, Query } from 'node-appwrite'

const env = {}
fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach(line => {
  const i = line.indexOf('=')
  if (i > 0) {
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[line.slice(0, i).trim()] = v
  }
})

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY)
const db = new Databases(client)
const DBID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const email = '2024s12345@antiquespride.edu.ph'
console.log('email length =', email.length)

// 1. reaction with the full email the app sends
try {
  const r = await db.createDocument(DBID, 'reactions', ID.unique(), {
    post_id: 'probe-post-id',
    student_no: email,
    reaction_type: 'like',
  })
  console.log('REACTION: accepted (unexpected) ->', r.$id)
  await db.deleteDocument(DBID, 'reactions', r.$id)
  console.log('REACTION: probe cleaned up')
} catch (e) {
  console.log('REACTION: REJECTED ->', e.message)
}

// 2. report log with the full moderator email
try {
  const r = await db.createDocument(DBID, 'reports', ID.unique(), {
    target_type: 'post',
    target_id: 'probe-post-id',
    reporter_student_no: email,
    reason: 'probe',
    status: 'resolved',
  })
  console.log('REPORT: accepted (unexpected) ->', r.$id)
  await db.deleteDocument(DBID, 'reports', r.$id)
  console.log('REPORT: probe cleaned up')
} catch (e) {
  console.log('REPORT: REJECTED ->', e.message)
}

// 3. post with a data-URL avatar (what a custom uploaded photo becomes)
const dataUrl = 'data:image/webp;base64,' + 'A'.repeat(40000)
try {
  const r = await db.createDocument(DBID, 'posts', ID.unique(), {
    content: 'probe',
    author_student_no: email,
    author_display_name: '@probe',
    author_avatar: dataUrl,
    author_year_section: 'BSIT 1-A',
    is_anonymous: false,
    is_verified: false,
    is_officer: false,
    officer_title: '',
    attachments: [],
    attachment_names: [],
    attachment_types: [],
    attachment_sizes: [],
    likes_count: 0,
    comments_count: 0,
    tags: ['Discussions'],
    is_locked: false,
    is_flagged: false,
    flag_count: 0,
    status: 'active',
  })
  console.log('POST+data-URL avatar: accepted (unexpected) ->', r.$id)
  await db.deleteDocument(DBID, 'posts', r.$id)
  console.log('POST: probe cleaned up')
} catch (e) {
  console.log('POST+data-URL avatar: REJECTED ->', e.message)
}

const after = await db.listDocuments(DBID, 'posts', [Query.limit(1)])
console.log('posts total now =', after.total)
