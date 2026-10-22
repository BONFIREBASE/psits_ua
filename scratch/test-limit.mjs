import * as fs from 'fs'
import { Client, Databases, Query } from 'node-appwrite'

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

async function testGetRelationships(rawViewerHandle) {
  const viewer = (rawViewerHandle || '').toLowerCase().replace(/^@/, '').trim()
  console.log(`\nTesting rawViewerHandle: "${rawViewerHandle}" -> parsed viewer: "${viewer}"`)

  const [followingRes, followersRes] = await Promise.all([
    db.listDocuments(DB, 'follows', [
      Query.equal('follower_handle', viewer),
      Query.limit(2500),
    ]),
    db.listDocuments(DB, 'follows', [
      Query.equal('following_handle', viewer),
      Query.limit(2500),
    ]),
  ])

  console.log('following:', followingRes.documents.map(d => d.following_handle))
  console.log('followers:', followersRes.documents.map(d => d.follower_handle))
}

await testGetRelationships('mt.de0w')
await testGetRelationships('@mt.de0w')
await testGetRelationships('@@mt.de0w')
await testGetRelationships('master_oogway')
await testGetRelationships('@master_oogway')
await testGetRelationships('@@master_oogway')
