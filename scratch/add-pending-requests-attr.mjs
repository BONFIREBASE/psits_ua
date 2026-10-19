import * as fs from 'fs'
import { Client, Databases } from 'node-appwrite'

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

async function run() {
  console.log('Adding pending_requests attribute to threads collection...')
  try {
    await databases.getAttribute(DATABASE_ID, 'threads', 'pending_requests')
    console.log('pending_requests already exists.')
  } catch {
    console.log('Creating pending_requests string array attribute...')
    await databases.createStringAttribute(DATABASE_ID, 'threads', 'pending_requests', 100, false, undefined, true)
    console.log('Created.')
  }
}

run().catch(console.error)
