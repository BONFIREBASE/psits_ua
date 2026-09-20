import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "psits-media";
export const R2_PUBLIC_URL = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/$/, "");

export const r2Client = new S3Client({
  region: "auto",
  endpoint:
    process.env.CLOUDFLARE_R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined),
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | Blob;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * Upload an object directly to Cloudflare R2 from server runtime.
 */
export async function uploadToR2({ key, body, contentType, metadata }: UploadOptions) {
  const cleanKey = key.replace(/^\//, "");
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2Client.send(command);

  return {
    key: cleanKey,
    url: getR2PublicUrl(cleanKey),
  };
}

/**
 * Generate a presigned PUT URL allowing clients to upload directly to R2.
 * Bypasses Vercel serverless function 4.5MB request payload limit.
 */
export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 3600,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const cleanKey = key.replace(/^\//, "");
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return {
    uploadUrl,
    key: cleanKey,
    publicUrl: getR2PublicUrl(cleanKey),
  };
}

/**
 * Delete an object from Cloudflare R2.
 */
export async function deleteFromR2(key: string) {
  const cleanKey = key.replace(/^\//, "");
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: cleanKey,
  });

  return await r2Client.send(command);
}

/**
 * Get public CDN/development URL for an object key.
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\//, "");
  if (!R2_PUBLIC_URL) {
    return cleanKey;
  }
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

/**
 * List objects in the bucket with an optional prefix.
 */
export async function listR2Objects(prefix = "", maxKeys = 50) {
  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await r2Client.send(command);
  return {
    objects: (response.Contents || []).map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified,
      url: getR2PublicUrl(item.Key || ""),
    })),
    isTruncated: response.IsTruncated,
  };
}
