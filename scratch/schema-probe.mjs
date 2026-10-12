// Temporary read-only probe of the Appwrite community schema. Deleted after use.
import * as fs from 'fs'
import { Client, Databases, Storage, Query } from 'node-appwrite'

const env = {}
fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach(line => {
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
  .setEndpoint(env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY)

const db = new Databases(client)
const storage = new Storage(client)
const DBID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

for (const col of ['posts', 'comments', 'reactions', 'reports', 'follows']) {
  try {
    const c = await db.getCollection(DBID, col)
    const attrs = c.attributes.map(a => `${a.key}:${a.type}${a.size ? '(' + a.size + ')' : ''}${a.array ? '[]' : ''}`).join(' ')
    console.log(`\n=== ${col} ===`)
    console.log(attrs)
    console.log('perms:', (c.$permissions || []).join(' '))
  } catch (e) {
    console.log(`\n=== ${col} === FAILED: ${e.message}`)
  }
}

try {
  const r = await db.listDocuments(DBID, 'posts', [Query.limit(1)])
  console.log(`\nposts total = ${r.total}`)
  if (r.documents[0]) {
    const d = r.documents[0]
    console.log('author_student_no length =', String(d.author_student_no || '').length)
    console.log('author_student_no sample shape =', /@/.test(String(d.author_student_no || '')) ? 'EMAIL' : 'ID-ish')
  }
} catch (e) {
  console.log('posts list FAILED:', e.message)
}

try {
  const b = await storage.getBucket(env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID)
  console.log(`\nbucket max size = ${b.maximumFileSize}, allowed = ${(b.allowedFileExtensions || []).join(',')}`)
  console.log('bucket perms:', (b.$permissions || []).join(' '))
} catch (e) {
  console.log('bucket FAILED:', e.message)
}
