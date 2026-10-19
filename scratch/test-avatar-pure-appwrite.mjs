import * as fs from 'fs'
import { Client, Databases, Storage, ID } from 'node-appwrite'

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
const storage = new Storage(client)
const DB_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'
const BUCKET_ID = env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'community-attachments'
const ENDPOINT = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320'

async function resolveAvatarUrl(avatar) {
  if (!avatar) return ''
  const trimmed = avatar.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('preset:')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.slice(0, 2048)
  }
  if (trimmed.startsWith('data:image/')) {
    const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/)
    if (match) {
      const rawExt = match[1].toLowerCase()
      const ext = rawExt.includes('webp') ? 'webp' : rawExt.includes('png') ? 'png' : 'jpg'
      const mime = `image/${ext}`
      const buffer = Buffer.from(match[2], 'base64')
      const file = new File([buffer], `avatar-${Date.now()}.${ext}`, { type: mime })
      const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file)
      const fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${PROJECT_ID}`
      return { fileUrl, fileId: uploaded.$id }
    }
  }
  return { fileUrl: trimmed.slice(0, 2048) }
}

async function run() {
  console.log('Testing Appwrite Storage avatar upload & post creation...')
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  
  const { fileUrl, fileId } = await resolveAvatarUrl(sampleBase64)
  console.log('Uploaded to Appwrite Storage:', fileUrl)

  const post = await db.createDocument(DB_ID, 'posts', ID.unique(), {
    content: 'Testing post with pure Appwrite avatar upload',
    author_student_no: '2024s00002@antiquespride.edu.ph',
    author_display_name: 'BON JURY PECAOCO',
    author_avatar: fileUrl,
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
    tags: ['Tech'],
    is_locked: false,
    is_flagged: false,
    flag_count: 0,
    status: 'active',
  })

  console.log('Post created in Appwrite Database! Post ID:', post.$id)
  console.log('Document author_avatar in Appwrite:', post.author_avatar)

  // Cleanup
  await db.deleteDocument(DB_ID, 'posts', post.$id)
  if (fileId) await storage.deleteFile(BUCKET_ID, fileId)
  console.log('✓ Cleaned up post and storage file cleanly.')
  console.log('🎉 PURE APPWRITE AVATAR STORAGE & POST CREATION VERIFIED 100% WORKING!')
}

run().catch(e => console.error('FAILED:', e))
