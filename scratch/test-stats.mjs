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

async function run() {
  console.log('Testing getFollowStats for master_oogway with viewer mt.de0w...')
  const target = 'master_oogway'
  const viewer = 'mt.de0w'

  const [followersRes, followingRes] = await Promise.all([
    db.listDocuments(DB, 'follows', [
      Query.equal('following_handle', target),
      Query.limit(1),
    ]),
    db.listDocuments(DB, 'follows', [
      Query.equal('follower_handle', target),
      Query.limit(1),
    ]),
  ])

  console.log('followers total:', followersRes.total, 'docs:', followersRes.documents.length)
  console.log('following total:', followingRes.total, 'docs:', followingRes.documents.length)

  const [checkViewerFollowsTarget, checkTargetFollowsViewer] = await Promise.all([
    db.listDocuments(DB, 'follows', [
      Query.equal('follower_handle', viewer),
      Query.equal('following_handle', target),
      Query.limit(1),
    ]),
    db.listDocuments(DB, 'follows', [
      Query.equal('follower_handle', target),
      Query.equal('following_handle', viewer),
      Query.limit(1),
    ]),
  ])

  console.log('isFollowing:', checkViewerFollowsTarget.documents.length > 0)
  console.log('isFollowedBy:', checkTargetFollowsViewer.documents.length > 0)
}

run()
