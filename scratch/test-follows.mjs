import * as fs from 'fs'
import { Client, Databases, Query, ID } from 'node-appwrite'

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

async function run() {
  try {
    console.log('Testing create follow document...')
    const doc = await db.createDocument(
      DB,
      'follows',
      ID.unique(),
      {
        follower_student_no: 'test_user1',
        following_student_no: 'test_user2',
        follower_handle: 'test_user1',
        following_handle: 'test_user2',
        follower_name: 'Test User 1',
        follower_avatar: '',
        following_name: 'Test User 2',
        following_avatar: '',
      }
    )
    console.log('Created follow document:', doc.$id)

    console.log('Testing query by handle...')
    const qRes = await db.listDocuments(DB, 'follows', [
      Query.equal('follower_handle', 'test_user1'),
      Query.equal('following_handle', 'test_user2'),
    ])
    console.log('Query result count:', qRes.total)

    console.log('Testing delete...')
    await db.deleteDocument(DB, 'follows', doc.$id)
    console.log('Deleted successfully!')
  } catch (err) {
    console.error('Test FAILED:', err)
  }
}

run()
