import { Client as BrowserClient, Databases as BrowserDatabases, Storage as BrowserStorage } from 'appwrite'

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320'
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'
export const APPWRITE_STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'community-attachments'

export const APPWRITE_COLLECTIONS = {
  POSTS: 'posts',
  COMMENTS: 'comments',
  REACTIONS: 'reactions',
  FOLLOWS: 'follows',
  REPORTS: 'reports',
} as const

/* ─── Client-Side SDK (Browser, Public Read, WebSockets) ─── */
const browserClient = new BrowserClient()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)

export const appwrite = browserClient
export const appwriteDatabases = new BrowserDatabases(browserClient)
export const appwriteStorage = new BrowserStorage(browserClient)
