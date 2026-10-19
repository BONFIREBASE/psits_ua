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

databases.listCollections(env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community')
  .then(res => {
    console.log('COLLECTIONS:', res.collections.map(c => c.$id))
  })
  .catch(err => {
    console.error('ERROR:', err.message)
  })
