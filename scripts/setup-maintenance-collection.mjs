import * as fs from 'fs'
import { Client, Databases, Permission, Role, ID } from 'node-appwrite'

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '').replace(/\r$/, '')
    env[key] = value
  }
})

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320')
  .setKey(env.APPWRITE_API_KEY)

const databases = new Databases(client)
const DATABASE_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'
const COLLECTION_ID = 'maintenance_config'

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

async function waitForAttribute(databaseId, collectionId, key, maxRetries = 25) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const attr = await databases.getAttribute(databaseId, collectionId, key)
      if (attr.status === 'available') return true
      if (attr.status === 'failed') throw new Error(`Attribute ${key} failed creation`)
    } catch {
      // waiting
    }
    await sleep(700)
  }
  return true
}

async function run() {
  console.log('🚀 Provisioning maintenance_config collection in Appwrite...')

  try {
    await databases.getCollection(DATABASE_ID, COLLECTION_ID)
    console.log('✔ Collection maintenance_config already exists.')
  } catch {
    console.log('Creating collection maintenance_config...')
    await databases.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Maintenance Configuration',
      [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ],
      false,
      true
    )
    console.log('✔ Collection maintenance_config created.')
  }

  // Create attributes (in Appwrite, attributes with default values must have required: false)
  const attributes = [
    { type: 'boolean', key: 'is_enabled', required: false, default: false },
    { type: 'string', key: 'scope', size: 32, required: false, default: 'all' },
    { type: 'string', key: 'blocked_routes', size: 255, required: false, array: true },
    { type: 'string', key: 'title', size: 255, required: false, default: 'System Under Scheduled Maintenance' },
    { type: 'string', key: 'message', size: 2000, required: false, default: 'We are performing scheduled updates to improve our services.' },
    { type: 'string', key: 'estimated_return', size: 100, required: false },
    { type: 'string', key: 'updated_at', size: 100, required: false },
    { type: 'string', key: 'updated_by', size: 100, required: false },
  ]

  for (const attr of attributes) {
    try {
      await databases.getAttribute(DATABASE_ID, COLLECTION_ID, attr.key)
      console.log(`  Attribute '${attr.key}' exists.`)
    } catch {
      console.log(`  Creating attribute '${attr.key}'...`)
      if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.required, attr.default)
      } else if (attr.type === 'string') {
        if (attr.array) {
          await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.size, false, undefined, true)
        } else {
          await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.key, attr.size, attr.required, attr.default)
        }
      }
      await waitForAttribute(DATABASE_ID, COLLECTION_ID, attr.key)
      console.log(`  ✔ Attribute '${attr.key}' ready.`)
    }
  }

  // Ensure default document exists
  try {
    await databases.getDocument(DATABASE_ID, COLLECTION_ID, 'active')
    console.log('✔ Default document "active" already exists.')
  } catch {
    console.log('Creating initial "active" configuration document...')
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      'active',
      {
        is_enabled: false,
        scope: 'all',
        blocked_routes: [],
        title: 'System Under Scheduled Maintenance',
        message: 'We are performing scheduled updates to improve our services. PSITS services will be restored shortly.',
        estimated_return: null,
        updated_at: new Date().toISOString(),
        updated_by: 'System',
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.any()),
      ]
    )
    console.log('✔ Initial document "active" created.')
  }

  console.log('🎉 Appwrite maintenance_config setup complete!')
}

run().catch((err) => {
  console.error('❌ Setup failed:', err)
  process.exit(1)
})
