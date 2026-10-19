import * as fs from 'fs'
import { createCommunityPostAction } from '../app/community/actions.ts'

// Verify that a 30KB base64 avatar URL is cleanly processed and uploaded to Appwrite Storage
async function test() {
  console.log('Testing createCommunityPostAction with 30KB base64 avatar...')
  const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  
  const result = await createCommunityPostAction({
    content: 'Verification post with base64 avatar',
    userEmail: '2024s00002@antiquespride.edu.ph',
    userName: 'BON JURY PECAOCO',
    userAvatar: sampleBase64,
    userYearSection: 'BSIT 3-A',
    isAnonymous: false,
    tags: ['Tech'],
  })

  console.log('Result:', result.success ? 'SUCCESS!' : 'FAILED:', result.error)
  if (result.post) {
    console.log('Post ID:', result.post.$id)
    console.log('Resolved Avatar URL:', result.post.author_avatar)
    
    // Cleanup the test post
    const { createServerAppwriteClient } = await import('../lib/appwrite-server.ts')
    const { APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS } = await import('../lib/appwrite.ts')
    const { databases } = createServerAppwriteClient()
    await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTIONS.POSTS, result.post.$id)
    console.log('Cleaned up test post')
  }
}

test().catch(e => console.error(e))
