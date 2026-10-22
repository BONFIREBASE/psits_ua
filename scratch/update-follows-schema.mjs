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

async function updateAttr(key, size) {
  console.log(`Updating follows.${key} to size ${size}...`)
  try {
    const res = await db.updateStringAttribute(DB, 'follows', key, false, null, size)
    console.log(`  ✓ Successfully updated follows.${key} (size: ${res.size})`)
  } catch (err) {
    console.error(`  ✗ Error updating follows.${key}:`, err.message)
  }
}

async function run() {
  await updateAttr('follower_avatar', 2048)
  await updateAttr('following_avatar', 2048)
  console.log('Appwrite follows avatar schema updated!')
}

run()
