import * as fs from 'fs'
import { Client, Databases, Storage } from 'node-appwrite'

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

console.log('Appwrite Endpoint:', env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '(default: https://sgp.cloud.appwrite.io/v1)')
console.log('Project ID:', env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? env.NEXT_PUBLIC_APPWRITE_PROJECT_ID.slice(0, 6) + '...' : '(MISSING)')
console.log('API Key present?:', !!env.APPWRITE_API_KEY)
console.log('Database ID:', env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '(default: psits_community)')
console.log('Bucket ID:', env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || '(default: community-attachments)')

const client = new Client()
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320')

if (env.APPWRITE_API_KEY) {
  client.setKey(env.APPWRITE_API_KEY)
}

const db = new Databases(client)
const storage = new Storage(client)

try {
  const dbId = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'
  const database = await db.get(dbId)
  console.log('\n[SUCCESS] Connected to Appwrite Database!')
  console.log('Database Name:', database.name)
  console.log('Database Status:', database.enabled ? 'Enabled' : 'Disabled')
  
  const cols = await db.listCollections(dbId)
  console.log(`Collections found (${cols.total}):`)
  cols.collections.forEach(c => {
    console.log(`  - [${c.$id}] ${c.name} (${c.attributes?.length || 0} attributes)`)
  })

  const bucketId = env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'community-attachments'
  try {
    const bucket = await storage.getBucket(bucketId)
    console.log(`\n[SUCCESS] Connected to Storage Bucket [${bucketId}] (${bucket.name})`)
  } catch (bErr) {
    console.log(`\n[WARNING] Bucket issue: ${bErr.message}`)
  }

} catch (err) {
  console.error('\n[ERROR] Appwrite Connection Failed:', err.message, 'Code:', err.code)
}
