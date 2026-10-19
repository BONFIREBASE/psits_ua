import { Client as ServerClient, Databases as ServerDatabases, Storage as ServerStorage } from 'node-appwrite'
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from './appwrite'

const DEFAULT_SERVER_API_KEY =
  'standard_bd051d10088ab746489b56b211798502ddfbc98af367295270397d1c1076d857cf6fd343a7003b1f6c6f32a1128c85e7caced26ac5187a870e4684e269ceb459ae5299ea8ca831b6aaf4221f7aaafa1cca6d26f8792830e64f24f0bcf9fec1a92538d03ce36a039c811ce0b9c2d1d950a750860d1e67d7add372c35c5b0899f6'

export function createServerAppwriteClient() {
  const apiKey = process.env.APPWRITE_API_KEY || DEFAULT_SERVER_API_KEY

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
