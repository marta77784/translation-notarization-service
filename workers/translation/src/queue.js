// Shared queue contract — imported by both the worker (src/index.js) and any
// producer (e.g. scripts/enqueue.js, the upload API service). Treat these
// values as the source of truth; SPEC.md mirrors them in the Producer contract
// section.

export const QUEUE_NAME = 'translation';

export const MAX_ATTEMPTS = 5;

/**
 * Default BullMQ job options for translation jobs. Producers should spread
 * this and set `jobId: documentId` so re-enqueueing the same document is
 * idempotent.
 *
 * The `backoff: { type: 'custom' }` opts the job into the worker's custom
 * backoff strategy (5_000 * 3^(attempts-1), capped at 5 minutes).
 */
export const JOB_OPTIONS = Object.freeze({
  attempts: MAX_ATTEMPTS,
  backoff: { type: 'custom' },
  removeOnComplete: { age: 24 * 60 * 60, count: 100 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
});
