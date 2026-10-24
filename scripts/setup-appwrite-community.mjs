import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { Client, Databases, Storage, Permission, Role } from 'node-appwrite'

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

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320'
const API_KEY = process.env.APPWRITE_API_KEY
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'community-attachments'

if (!API_KEY) {
  console.error('❌ Error: APPWRITE_API_KEY not found in .env.local')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY)

const databases = new Databases(client)
const storage = new Storage(client)

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

async function waitForAttribute(databaseId, collectionId, key, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const attr = await databases.getAttribute(databaseId, collectionId, key)
      if (attr.status === 'available') return true
      if (attr.status === 'failed') throw new Error(`Attribute ${key} failed creation`)
    } catch {
      // not ready yet
    }
    await sleep(750)
  }
  return true
}

async function setup() {
  console.log('🚀 Starting Appwrite Community Backend Provisioning...\n')
  console.log(`Endpoint:   ${ENDPOINT}`)
  console.log(`Project ID: ${PROJECT_ID}`)
  console.log(`Database:   ${DATABASE_ID}`)
  console.log(`Bucket:     ${BUCKET_ID}\n`)

  // 1. Create Database
  try {
    await databases.get(DATABASE_ID)
    console.log(`✔ Database '${DATABASE_ID}' already exists.`)
  } catch {
    console.log(`Creating database '${DATABASE_ID}'...`)
    await databases.create(DATABASE_ID, 'PSITS Community Database', true)
    console.log(`✔ Database '${DATABASE_ID}' created successfully!`)
  }

  // 2. Setup Storage Bucket
  console.log('\n--- Configuring Storage Bucket ---')
  try {
    await storage.getBucket(BUCKET_ID)
    console.log(`✔ Bucket '${BUCKET_ID}' already exists.`)
  } catch {
    console.log(`Creating bucket '${BUCKET_ID}'...`)
    await storage.createBucket(
      BUCKET_ID,
      'Community Attachments & Media',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false, // fileSecurity
      true,  // enabled
      20971520, // 20 MB max file size
      ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'zip'],
      'gzip',
      true,  // encryption
      true   // antivirus
    )
    console.log(`✔ Storage Bucket '${BUCKET_ID}' created with 20MB cap & public read!`)
  }

  // 3. Setup Collection: posts
  console.log('\n--- Configuring Collection: posts ---')
  let postsCollection
  try {
    postsCollection = await databases.getCollection(DATABASE_ID, 'posts')
    console.log(`✔ Collection 'posts' already exists.`)
  } catch {
    console.log(`Creating collection 'posts'...`)
    postsCollection = await databases.createCollection(
      DATABASE_ID,
      'posts',
      'Community Posts',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false, // documentSecurity
      true   // enabled
    )
    console.log(`✔ Collection 'posts' created.`)
  }

  // Attributes for 'posts'
  const postAttributes = [
    { type: 'string', key: 'content', size: 5000, required: true },
    { type: 'string', key: 'author_student_no', size: 20, required: true },
    { type: 'string', key: 'author_display_name', size: 100, required: true },
    { type: 'string', key: 'author_avatar', size: 500, required: false },
    { type: 'string', key: 'author_year_section', size: 20, required: false },
    { type: 'boolean', key: 'is_anonymous', required: false, default: false },
    { type: 'boolean', key: 'is_verified', required: false, default: false },
    { type: 'string', key: 'attachments', size: 500, required: false, array: true },
    { type: 'string', key: 'attachment_names', size: 255, required: false, array: true },
    { type: 'string', key: 'attachment_types', size: 50, required: false, array: true },
    { type: 'string', key: 'attachment_sizes', size: 50, required: false, array: true },
    { type: 'integer', key: 'likes_count', required: false, min: 0, default: 0 },
    { type: 'integer', key: 'comments_count', required: false, min: 0, default: 0 },
    { type: 'string', key: 'tags', size: 50, required: false, array: true },
    { type: 'boolean', key: 'is_locked', required: false, default: false },
    { type: 'boolean', key: 'is_flagged', required: false, default: false },
    { type: 'integer', key: 'flag_count', required: false, min: 0, default: 0 },
    { type: 'string', key: 'status', size: 20, required: false, default: 'active' },
  ]

  for (const attr of postAttributes) {
    try {
      await databases.getAttribute(DATABASE_ID, 'posts', attr.key)
      // Already exists
    } catch {
      console.log(`  Creating attribute posts.${attr.key}...`)
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          'posts',
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array ?? false
        )
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          'posts',
          attr.key,
          attr.required,
          attr.default,
          attr.array ?? false
        )
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          DATABASE_ID,
          'posts',
          attr.key,
          attr.required,
          attr.min,
          undefined,
          attr.default,
          attr.array ?? false
        )
      }
      await waitForAttribute(DATABASE_ID, 'posts', attr.key)
    }
  }
  console.log(`✔ All attributes for 'posts' verified.`)

  // Indexes for 'posts'
  const postIndexes = [
    { key: 'idx_posts_author', type: 'key', attributes: ['author_student_no'] },
    { key: 'idx_posts_status', type: 'key', attributes: ['status'] },
  ]
  for (const idx of postIndexes) {
    try {
      await databases.getIndex(DATABASE_ID, 'posts', idx.key)
    } catch {
      console.log(`  Creating index posts.${idx.key}...`)
      try {
        await databases.createIndex(DATABASE_ID, 'posts', idx.key, idx.type, idx.attributes)
      } catch (e) {
        console.warn(`  Warning on index ${idx.key}:`, e.message)
      }
    }
  }

  // 4. Setup Collection: comments
  console.log('\n--- Configuring Collection: comments ---')
  try {
    await databases.getCollection(DATABASE_ID, 'comments')
    console.log(`✔ Collection 'comments' already exists.`)
  } catch {
    console.log(`Creating collection 'comments'...`)
    await databases.createCollection(
      DATABASE_ID,
      'comments',
      'Post Comments',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false,
      true
    )
    console.log(`✔ Collection 'comments' created.`)
  }

  const commentAttributes = [
    { type: 'string', key: 'post_id', size: 50, required: true },
    { type: 'string', key: 'content', size: 1000, required: true },
    { type: 'string', key: 'author_student_no', size: 20, required: true },
    { type: 'string', key: 'author_display_name', size: 100, required: true },
    { type: 'string', key: 'author_avatar', size: 500, required: false },
    { type: 'boolean', key: 'is_anonymous', required: false, default: false },
    { type: 'boolean', key: 'is_verified', required: false, default: false },
    { type: 'boolean', key: 'is_flagged', required: false, default: false },
    { type: 'integer', key: 'flag_count', required: false, min: 0, default: 0 },
    { type: 'string', key: 'status', size: 20, required: false, default: 'active' },
  ]

  for (const attr of commentAttributes) {
    try {
      await databases.getAttribute(DATABASE_ID, 'comments', attr.key)
    } catch {
      console.log(`  Creating attribute comments.${attr.key}...`)
      if (attr.type === 'string') {
        await databases.createStringAttribute(DATABASE_ID, 'comments', attr.key, attr.size, attr.required, attr.default, false)
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(DATABASE_ID, 'comments', attr.key, attr.required, attr.default, false)
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(DATABASE_ID, 'comments', attr.key, attr.required, attr.min, undefined, attr.default, false)
      }
      await waitForAttribute(DATABASE_ID, 'comments', attr.key)
    }
  }
  console.log(`✔ All attributes for 'comments' verified.`)

  // Indexes for 'comments'
  try {
    await databases.getIndex(DATABASE_ID, 'comments', 'idx_comments_post')
  } catch {
    console.log(`  Creating index comments.idx_comments_post...`)
    try {
      await databases.createIndex(DATABASE_ID, 'comments', 'idx_comments_post', 'key', ['post_id'])
    } catch (e) {
      console.warn(`  Warning on index idx_comments_post:`, e.message)
    }
  }

  // 5. Setup Collection: reactions
  console.log('\n--- Configuring Collection: reactions ---')
  try {
    await databases.getCollection(DATABASE_ID, 'reactions')
    console.log(`✔ Collection 'reactions' already exists.`)
  } catch {
    console.log(`Creating collection 'reactions'...`)
    await databases.createCollection(
      DATABASE_ID,
      'reactions',
      'Post Reactions',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false,
      true
    )
    console.log(`✔ Collection 'reactions' created.`)
  }

  const reactionAttributes = [
    { type: 'string', key: 'post_id', size: 50, required: true },
    { type: 'string', key: 'student_no', size: 20, required: true },
    { type: 'string', key: 'reaction_type', size: 20, required: false, default: 'like' },
  ]

  for (const attr of reactionAttributes) {
    try {
      await databases.getAttribute(DATABASE_ID, 'reactions', attr.key)
    } catch {
      console.log(`  Creating attribute reactions.${attr.key}...`)
      await databases.createStringAttribute(DATABASE_ID, 'reactions', attr.key, attr.size, attr.required, attr.default, false)
      await waitForAttribute(DATABASE_ID, 'reactions', attr.key)
    }
  }
  console.log(`✔ All attributes for 'reactions' verified.`)

  try {
    await databases.getIndex(DATABASE_ID, 'reactions', 'idx_reactions_post_user')
  } catch {
    console.log(`  Creating compound index reactions.idx_reactions_post_user...`)
    try {
      await databases.createIndex(DATABASE_ID, 'reactions', 'idx_reactions_post_user', 'key', ['post_id', 'student_no'])
    } catch (e) {
      console.warn(`  Warning on index idx_reactions_post_user:`, e.message)
    }
  }

  // 6. Setup Collection: follows
  console.log('\n--- Configuring Collection: follows ---')
  try {
    await databases.getCollection(DATABASE_ID, 'follows')
    console.log(`✔ Collection 'follows' already exists.`)
  } catch {
    console.log(`Creating collection 'follows'...`)
    await databases.createCollection(
      DATABASE_ID,
      'follows',
      'Student Follows',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false,
      true
    )
    console.log(`✔ Collection 'follows' created.`)
  }

  const followAttributes = [
    { type: 'string', key: 'follower_student_no', size: 20, required: true },
    { type: 'string', key: 'following_student_no', size: 20, required: true },
  ]

  for (const attr of followAttributes) {
    try {
      await databases.getAttribute(DATABASE_ID, 'follows', attr.key)
    } catch {
      console.log(`  Creating attribute follows.${attr.key}...`)
      await databases.createStringAttribute(DATABASE_ID, 'follows', attr.key, attr.size, attr.required, undefined, false)
      await waitForAttribute(DATABASE_ID, 'follows', attr.key)
    }
  }
  console.log(`✔ All attributes for 'follows' verified.`)

  try {
    await databases.getIndex(DATABASE_ID, 'follows', 'idx_follows_pair')
  } catch {
    console.log(`  Creating compound index follows.idx_follows_pair...`)
    try {
      await databases.createIndex(DATABASE_ID, 'follows', 'idx_follows_pair', 'key', ['follower_student_no', 'following_student_no'])
    } catch (e) {
      console.warn(`  Warning on index idx_follows_pair:`, e.message)
    }
  }

  // 7. Setup Collection: reports (moderation queue)
  console.log('\n--- Configuring Collection: reports ---')
  try {
    await databases.getCollection(DATABASE_ID, 'reports')
    console.log(`✔ Collection 'reports' already exists.`)
  } catch {
    console.log(`Creating collection 'reports'...`)
    await databases.createCollection(
      DATABASE_ID,
      'reports',
      'Moderation Reports',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false,
      true
    )
    console.log(`✔ Collection 'reports' created.`)
  }

  const reportAttributes = [
    { type: 'string', key: 'target_type', size: 20, required: true }, // 'post' | 'comment'
    { type: 'string', key: 'target_id', size: 50, required: true },
    { type: 'string', key: 'reporter_student_no', size: 20, required: true },
    { type: 'string', key: 'reason', size: 255, required: true },
    { type: 'string', key: 'status', size: 20, required: false, default: 'pending' }, // 'pending' | 'resolved' | 'dismissed'
  ]

  for (const attr of reportAttributes) {
    try {
      await databases.getAttribute(DATABASE_ID, 'reports', attr.key)
    } catch {
      console.log(`  Creating attribute reports.${attr.key}...`)
      await databases.createStringAttribute(DATABASE_ID, 'reports', attr.key, attr.size, attr.required, attr.default, false)
      await waitForAttribute(DATABASE_ID, 'reports', attr.key)
    }
  }
  console.log(`✔ All attributes for 'reports' verified.`)

  console.log('\n🎉 ALL APPWRITE COMMUNITY COLLECTIONS AND STORAGE BUCKETS CONFIGURED SUCCESSFULLY!\n')
}

setup().catch((err) => {
  console.error('\n❌ Setup error:', err)
  process.exit(1)
})
