import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'psits-media';
const publicUrlBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!accessKeyId || !secretAccessKey) {
  console.error('Missing Cloudflare R2 credentials in environment');
  process.exit(1);
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint:
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const archiveDir = 'C:\\Users\\BONFIRE BASE\\Downloads\\PSITS archived';

async function uploadArchive() {
  if (!fs.existsSync(archiveDir)) {
    console.error(`Directory not found: ${archiveDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(archiveDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  console.log(`Found ${files.length} images to upload...`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(archiveDir, filename);
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase() || '.jpg';
    const indexStr = String(i + 1).padStart(2, '0');
    const r2Key = `archive/psits-archive-${indexStr}${ext}`;

    console.log(`Uploading [${i + 1}/${files.length}]: ${filename} -> ${r2Key} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
      Metadata: {
        original_name: filename,
      },
    });

    await r2Client.send(command);

    const publicUrl = `${publicUrlBase}/${r2Key}`;
    results.push({
      index: i + 1,
      key: r2Key,
      url: publicUrl,
      originalName: filename,
      sizeBytes: fileBuffer.length,
    });
  }

  console.log('\n--- All uploads completed successfully! ---');
  console.log(JSON.stringify(results, null, 2));
}

uploadArchive().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
