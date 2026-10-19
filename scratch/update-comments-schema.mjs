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

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

async function run() {
  console.log('Adding new attributes to comments collection...')
  
  const newAttrs = [
    { type: 'string', key: 'parent_id', size: 100, required: false, default: '' },
    { type: 'string', key: 'reply_to_handle', size: 100, required: false, default: '' },
    { type: 'boolean', key: 'is_edited', required: false, default: false },
  ]

  for (const attr of newAttrs) {
    try {
      await databases.getAttribute(DATABASE_ID, 'comments', attr.key)
      console.log(`Attribute ${attr.key} already exists.`)
    } catch {
      console.log(`Creating attribute ${attr.key}...`)
      if (attr.type === 'string') {
        await databases.createStringAttribute(DATABASE_ID, 'comments', attr.key, attr.size, attr.required, attr.default)
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(DATABASE_ID, 'comments', attr.key, attr.required, attr.default)
      }
      await sleep(1000)
    }
  }

  console.log('Done.')
}

run().catch(console.error)
