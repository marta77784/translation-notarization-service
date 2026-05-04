import { z } from 'zod';
import { logger } from './lib/logger.js';

const boolFromString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const envSchema = z.object({
  // LLM provider (OpenAI-compatible Chat Completions API)
  LLM_API_KEY: z.string().min(1),
  LLM_BASE_URL: z.string().min(1).default('https://api.openai.com/v1'),
  LLM_MODEL: z.string().min(1).default('gpt-4o-mini'),

  // Redis (BullMQ)
  REDIS_URL: z.string().min(1),

  // MongoDB
  MONGO_URL: z.string().min(1),
  MONGO_DB: z.string().min(1),

  // MinIO
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: boolFromString.default('false'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET_UPLOADS: z.string().min(1).default('uploads'),
  MINIO_BUCKET_TRANSLATIONS: z.string().min(1).default('translations'),

  // Worker
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});

export function loadConfig(env = process.env) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    logger.fatal({ fields }, 'Invalid environment configuration');
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
