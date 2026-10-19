import * as fs from 'fs'
import { Client, Storage, ID } from 'node-appwrite'

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

const storage = new Storage(client)
const bucketId = env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'community-attachments'

async function testUpload() {
  const sampleBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const buffer = Buffer.from(sampleBase64, 'base64')
  const file = new File([buffer], 'avatar.png', { type: 'image/png' })

  console.log('Uploading sample file to bucket:', bucketId)
  const res = await storage.createFile(bucketId, ID.unique(), file)
  console.log('Upload SUCCESS! File ID:', res.$id)
  
  // Cleanup
  await storage.deleteFile(bucketId, res.$id)
  console.log('Cleaned up file')
}

testUpload().catch(e => console.error('Upload Error:', e))
