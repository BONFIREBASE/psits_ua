import { Client as ServerClient, Databases as ServerDatabases, Storage as ServerStorage } from 'node-appwrite'
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './appwrite'

export function createServerAppwriteClient() {
  const apiKey = process.env.APPWRITE_API_KEY
  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is not defined in server environment variables.')
  }

  const serverClient = new ServerClient()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(apiKey)

  return {
    client: serverClient,
    databases: new ServerDatabases(serverClient),
    storage: new ServerStorage(serverClient),
  }
}
