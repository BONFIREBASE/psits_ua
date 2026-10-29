import { Client as BrowserClient, Databases as BrowserDatabases, Storage as BrowserStorage } from 'appwrite'

export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '6aca2ff0002a4dd19320'
export const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'psits_community'
export const APPWRITE_STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'community-attachments'

export const APPWRITE_COLLECTIONS = {
  POSTS: 'posts',
  COMMENTS: 'comments',
  REACTIONS: 'reactions',
  COMMENT_LIKES: 'comment_likes',
  NOTES: 'notes',
  FOLLOWS: 'follows',
  REPORTS: 'reports',
  THREADS: 'threads',
  NOTIFICATIONS: 'notifications',
  MAINTENANCE: 'maintenance_config',
} as const

/* ─── Client-Side SDK (Browser, Public Read, WebSockets) ─── */
const browserClient = new BrowserClient()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)

// Suppress Appwrite SDK non-fatal WebSocket reconnect logs in development
// Turbopack intercepts all console.error calls and renders a full-screen overlay.
// Downgrading to console.warn keeps DevTools informative without breaking UI.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Realtime got disconnected')
    ) {
      console.warn('[Appwrite SDK Realtime]', ...args)
      return
    }
    originalConsoleError.apply(console, args)
  }
}

export const appwrite = browserClient
export const appwriteDatabases = new BrowserDatabases(browserClient)
export const appwriteStorage = new BrowserStorage(browserClient)
