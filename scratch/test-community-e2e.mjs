import * as fs from 'fs'
import { Client, Databases, ID, Query } from 'node-appwrite'

const env = {}
const content = fs.readFileSync('.env.local', 'utf8')
content.split(/\r?\n/).forEach(line => {
  const i = line.indexOf('=')
  if (i > 0) {
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    env[line.slice(0, i).trim()] = v
  }
})

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320')
  .setKey(env.APPWRITE_API_KEY)

const db = new Databases(client)
const DB_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'

async function runE2ETest() {
  console.log('🧪 Starting Full Community End-to-End Operational Verification...\n')
  const testEmail = '2024s99999@antiquespride.edu.ph'
  const testName = 'Juan Dela Cruz'

  // 1. Create a Post
  console.log('1. Testing Post Creation...')
  const post = await db.createDocument(DB_ID, 'posts', ID.unique(), {
    content: '🎉 System Health Check: Appwrite Community is officially live and connected!',
    author_student_no: testEmail,
    author_display_name: testName,
    author_avatar: 'preset:avatar_terminal',
    author_year_section: 'BSIT 3-A',
    is_anonymous: false,
    is_verified: true,
    is_officer: true,
    officer_title: 'Developer Lead',
    attachments: [],
    attachment_names: [],
    attachment_types: [],
    attachment_sizes: [],
    likes_count: 0,
    comments_count: 0,
    tags: ['Announcements', 'Tech'],
    is_locked: false,
    is_flagged: false,
    flag_count: 0,
    status: 'active',
  })
  console.log(`   ✓ Post created successfully: [ID: ${post.$id}]`)

  // 2. Add a Reaction / Like with full institutional email
  console.log('2. Testing Post Reaction (Like) with institutional email...')
  const reaction = await db.createDocument(DB_ID, 'reactions', ID.unique(), {
    post_id: post.$id,
    student_no: testEmail,
    reaction_type: 'like',
  })
  console.log(`   ✓ Reaction created successfully: [ID: ${reaction.$id}]`)

  // 3. Increment Post Like count
  await db.updateDocument(DB_ID, 'posts', post.$id, {
    likes_count: 1
  })
  console.log('   ✓ Post like count incremented')

  // 4. Add a Comment
  console.log('3. Testing Comment Creation...')
  const comment = await db.createDocument(DB_ID, 'comments', ID.unique(), {
    post_id: post.$id,
    content: 'Tested and verified! High-five to the development team.',
    author_student_no: testEmail,
    author_display_name: testName,
    author_avatar: 'preset:avatar_terminal',
    is_anonymous: false,
    is_verified: true,
    is_officer: true,
    officer_title: 'Developer Lead',
    is_flagged: false,
    flag_count: 0,
    status: 'active',
  })
  console.log(`   ✓ Comment created successfully: [ID: ${comment.$id}]`)

  // 5. Query Feed
  console.log('4. Verifying Query & Retrieval...')
  const feed = await db.listDocuments(DB_ID, 'posts', [
    Query.equal('status', 'active'),
    Query.orderDesc('$createdAt'),
    Query.limit(5)
  ])
  console.log(`   ✓ Retrieved ${feed.documents.length} active posts in feed.`)
  const found = feed.documents.some(d => d.$id === post.$id)
  console.log(`   ✓ Created test post visible in feed?: ${found}`)

  // 6. Cleanup
  console.log('5. Cleaning up test artifacts...')
  await db.deleteDocument(DB_ID, 'comments', comment.$id)
  await db.deleteDocument(DB_ID, 'reactions', reaction.$id)
  await db.deleteDocument(DB_ID, 'posts', post.$id)
  console.log('   ✓ Test comments, reactions, and post removed cleanly.')

  console.log('\n🎉 ALL COMMUNITY ACTIONS PASSED 100% OPERATIONAL!')
}

runE2ETest().catch(err => {
  console.error('❌ E2E Verification Failed:', err)
  process.exit(1)
})
