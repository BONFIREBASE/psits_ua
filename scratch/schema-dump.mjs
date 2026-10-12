// Temporary: dump the live Appwrite community schema so fixes match reality. Deleted after use.
import * as fs from 'fs'
import { Client, Databases } from 'node-appwrite'

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
const DB = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID

const out = []
for (const col of ['posts', 'comments', 'reactions', 'reports', 'follows']) {
  const c = await db.getCollection(DB, col)
  out.push(`=== ${col} ===`)
  for (const a of c.attributes) {
    out.push(`  ${a.key} | type=${a.type} | size=${a.size ?? '-'} | required=${a.required} | array=${a.array}`)
  }
  for (const i of c.indexes) out.push(`  IDX ${i.key} ${i.type} [${i.attributes.join(',')}]`)
}
fs.writeFileSync('scratch/schema.txt', out.join('\n'), 'utf8')
console.log('written', out.length, 'lines')
