// Temporary read-only probe: is Cloudflare R2 reachable and is the public URL set? Deleted after use.
import * as fs from 'fs'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const env = {}
fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).forEach(line => {
  const i = line.indexOf('=')
  if (i > 0) {
    let v = line.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[line.slice(0, i).trim()] = v
  }
})

const client = new S3Client({
  region: 'auto',
  endpoint: env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

console.log('R2 public url host =', (() => { try { return new URL(env.NEXT_PUBLIC_R2_PUBLIC_URL).host } catch { return 'INVALID' } })())

try {
  const r = await client.send(new ListObjectsV2Command({ Bucket: env.CLOUDFLARE_R2_BUCKET_NAME, MaxKeys: 3 }))
  console.log('R2 LIST OK, keys:', (r.Contents || []).map(o => o.Key).join(', ') || '(empty)')
} catch (e) {
  console.log('R2 LIST FAILED:', e.message)
}
