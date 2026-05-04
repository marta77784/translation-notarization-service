import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { ensureBuckets } from './storage/minio.js';
import { connectMongo, closeMongo } from './storage/mongo.js';
import { processJob } from './processor.js';
import { QUEUE_NAME } from './queue.js';

// Backoff per spec: 5_000 * 3^(attempts-1), capped at 5 minutes.
// Producers must enqueue with `{ attempts, backoff: { type: 'custom' } }` for
// this strategy to apply (see src/queue.js).
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MULTIPLIER = 3;
const BACKOFF_MAX_MS = 5 * 60 * 1000;

function computeBackoff(attemptsMade) {
  const delay = BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, attemptsMade - 1);
  return Math.min(delay, BACKOFF_MAX_MS);
}

async function main() {
  await connectMongo();
  logger.info('Connected to MongoDB');

  await ensureBuckets();
  logger.info('MinIO buckets verified');

  // BullMQ requires maxRetriesPerRequest: null on its Redis connection.
  const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  const worker = new Worker(QUEUE_NAME, processJob, {
    connection,
    concurrency: config.WORKER_CONCURRENCY,
    settings: {
      backoffStrategy: computeBackoff,
    },
  });

  worker.on('completed', (job, result) => {
    logger.info(
      { jobId: job.id, result },
      'Job completed',
    );
  });

  worker.on('failed', async (job, err) => {
    const log = logger.child({ jobId: job?.id });
    log.error(
      { err: { name: err?.name, message: err?.message, stack: err?.stack } },
      'Job failed',
    );

    if (err?.name === 'PermanentError' && job) {
      try {
        await job.discard();
        log.info('Permanent failure — job discarded, no further retries');
      } catch (discardErr) {
        log.error(
          { err: discardErr },
          'Failed to discard permanent-failure job',
        );
      }
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker error');
  });

  logger.info(
    {
      queue: QUEUE_NAME,
      concurrency: config.WORKER_CONCURRENCY,
      llmModel: config.LLM_MODEL,
      llmBaseUrl: config.LLM_BASE_URL,
    },
    'Translation worker started',
  );

  // Graceful shutdown: stop accepting new jobs, drain in-flight, close
  // connections. The worker.close() call below waits for active jobs.
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    try {
      await worker.close();
      await connection.quit();
      await closeMongo();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.fatal({ err }, 'Fatal error during worker startup');
  process.exit(1);
});
