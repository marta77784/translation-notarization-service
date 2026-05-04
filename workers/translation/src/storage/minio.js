import { Client } from 'minio';
import { config } from '../config.js';
import { PermanentError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export const minioClient = new Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

/**
 * Verify the `uploads` bucket exists (owned by the upload API service — we
 * fail loudly rather than silently masking a config bug) and create the
 * `translations` bucket if missing (owned by this worker).
 */
export async function ensureBuckets() {
  const uploads = config.MINIO_BUCKET_UPLOADS;
  const translations = config.MINIO_BUCKET_TRANSLATIONS;

  const uploadsExists = await minioClient.bucketExists(uploads);
  if (!uploadsExists) {
    throw new Error(
      `MinIO bucket "${uploads}" does not exist. It is owned by the upload API ` +
        `service and must be created there. Refusing to start.`,
    );
  }

  const translationsExists = await minioClient.bucketExists(translations);
  if (!translationsExists) {
    logger.info({ bucket: translations }, 'Creating MinIO bucket');
    await minioClient.makeBucket(translations);
  }
}

/**
 * Download an object as a Buffer. NoSuchKey → PermanentError; other errors
 * propagate unchanged so the caller can classify them.
 */
export async function downloadObject(bucket, key) {
  let stream;
  try {
    stream = await minioClient.getObject(bucket, key);
  } catch (err) {
    if (err?.code === 'NoSuchKey' || err?.code === 'NotFound') {
      throw new PermanentError(
        `Source file not found in MinIO: ${bucket}/${key}`,
        { cause: err },
      );
    }
    throw err;
  }

  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function uploadObject(bucket, key, buffer, contentType) {
  await minioClient.putObject(bucket, key, buffer, buffer.length, {
    'Content-Type': contentType,
  });
}
