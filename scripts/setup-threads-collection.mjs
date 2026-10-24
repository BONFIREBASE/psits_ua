import * as fs from 'fs'
import { Client, Databases, Permission, Role } from 'node-appwrite'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
})

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320')
  .setKey(env.APPWRITE_API_KEY)

const databases = new Databases(client)
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

async function waitForAttribute(databaseId, collectionId, key, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const attr = await databases.getAttribute(databaseId, collectionId, key)
      if (attr.status === 'available') return true
      if (attr.status === 'failed') throw new Error(`Attribute ${key} failed creation`)
    } catch {
      // waiting
    }
    await sleep(750)
  }
  return true
}

async function run() {
  console.log('🚀 Provisioning threads collection in Appwrite...')

  try {
    await databases.getCollection(DATABASE_ID, 'threads')
    console.log('✔ Collection threads already exists.')
  } catch {
    console.log('Creating collection threads...')
    await databases.createCollection(
      DATABASE_ID,
      'threads',
      'Community Custom Threads',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false,
      true
    )
    console.log('✔ Collection threads created.')
  }

  const attributes = [
    { type: 'string', key: 'title', size: 100, required: true },
    { type: 'string', key: 'slug', size: 100, required: true },
    { type: 'string', key: 'description', size: 1000, required: false, default: '' },
    { type: 'string', key: 'category', size: 50, required: false, default: 'Discussions' },
    { type: 'string', key: 'creator_student_no', size: 100, required: true },
    { type: 'string', key: 'creator_display_name', size: 100, required: true },
    { type: 'string', key: 'creator_avatar', size: 500, required: false, default: '' },
    { type: 'boolean', key: 'is_private', required: false, default: false },
    { type: 'string', key: 'allowed_users', size: 100, required: false, array: true },
    { type: 'boolean', key: 'is_verified_creator', required: false, default: false },
    { type: 'string', key: 'status', size: 20, required: false, default: 'active' },
  ]

  for (const attr of attributes) {
    try {
      await databases.getAttribute(DATABASE_ID, 'threads', attr.key)
      console.log(`  attribute threads.${attr.key} already exists`)
    } catch {
      console.log(`  creating attribute threads.${attr.key}...`)
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          'threads',
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array ?? false
        )
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          'threads',
          attr.key,
          attr.required,
          attr.default,
          attr.array ?? false
        )
      }
      await waitForAttribute(DATABASE_ID, 'threads', attr.key)
    }
  }

  // Indexes
  const indexes = [
    { key: 'idx_threads_slug', type: 'key', attributes: ['slug'] },
    { key: 'idx_threads_creator', type: 'key', attributes: ['creator_student_no'] },
    { key: 'idx_threads_status', type: 'key', attributes: ['status'] },
  ]

  for (const idx of indexes) {
    try {
      await databases.getIndex(DATABASE_ID, 'threads', idx.key)
    } catch {
      console.log(`  creating index threads.${idx.key}...`)
      try {
        await databases.createIndex(DATABASE_ID, 'threads', idx.key, idx.type, idx.attributes)
      } catch (e) {
        console.warn(`  warning on index ${idx.key}:`, e.message)
      }
    }
  }

  console.log('🎉 Threads collection successfully provisioned and ready!')
}

run().catch(console.error)
