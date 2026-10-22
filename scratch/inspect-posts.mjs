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

const r = await db.listDocuments(DB, 'posts')
for (const p of r.documents) {
  console.log(p.author_display_name, 'avatar length:', (p.author_avatar || '').length, (p.author_avatar || '').slice(0, 60))
}
