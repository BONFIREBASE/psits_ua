import * as fs from 'fs'
import { Client, Databases } from 'node-appwrite'

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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function updateAttribute(colId, key, required, xdefault, size) {
  console.log(`Updating ${colId}.${key} to size ${size}...`)
  try {
    const res = await db.updateStringAttribute(DB_ID, colId, key, required, xdefault, size)
    console.log(`  ✓ Successfully updated ${colId}.${key} (size: ${res.size})`)
  } catch (err) {
    if (err.message?.includes('Index') || err.message?.includes('index')) {
      console.log(`  ⚠️ Index dependency detected on ${colId}.${key}. Checking indexes...`)
      const indexes = await db.listIndexes(DB_ID, colId)
      const relatedIndex = indexes.indexes.find(idx => idx.attributes.includes(key))
      if (relatedIndex) {
        console.log(`  Deleting index [${relatedIndex.key}]...`)
        await db.deleteIndex(DB_ID, colId, relatedIndex.key)
        await sleep(2000)
        console.log(`  Retrying attribute update for ${colId}.${key}...`)
        const res = await db.updateStringAttribute(DB_ID, colId, key, required, xdefault, size)
        console.log(`  ✓ Successfully updated ${colId}.${key} (size: ${res.size})`)
        await sleep(2000)
        console.log(`  Recreating index [${relatedIndex.key}]...`)
        await db.createIndex(DB_ID, colId, relatedIndex.key, relatedIndex.type, relatedIndex.attributes, relatedIndex.orders)
        console.log(`  ✓ Index [${relatedIndex.key}] restored.`)
      } else {
        throw err
      }
    } else {
      console.error(`  ✗ Error updating ${colId}.${key}:`, err.message)
    }
  }
}

async function main() {
  console.log('🚀 Starting Community Schema Attribute Resizing in Appwrite...\n')

  // 1. reactions.student_no (20 -> 255)
  await updateAttribute('reactions', 'student_no', true, null, 255)
  await sleep(1000)

  // 2. follows.follower_student_no (20 -> 255)
  await updateAttribute('follows', 'follower_student_no', true, null, 255)
  await sleep(1000)

  // 3. follows.following_student_no (20 -> 255)
  await updateAttribute('follows', 'following_student_no', true, null, 255)
  await sleep(1000)

  // 4. reports.reporter_student_no (20 -> 255)
  await updateAttribute('reports', 'reporter_student_no', true, null, 255)
  await sleep(1000)

  // 5. posts.author_avatar (500 -> 2048)
  await updateAttribute('posts', 'author_avatar', false, null, 2048)
  await sleep(1000)

  // 6. comments.author_avatar (500 -> 2048)
  await updateAttribute('comments', 'author_avatar', false, null, 2048)
  await sleep(1000)

  console.log('\n✨ All target attributes updated! Verification commencing...')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
