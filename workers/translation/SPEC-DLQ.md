# Translation Worker -- Dead Letter Queue (DLQ) Spec

## Context

The translation worker already has retry logic via BullMQ:
- `PermanentError` -> `job.discard()`, no retry (bad input, invalid payload, scanned PDF, auth failure)
- `TransientError` -> up to 5 retries with custom backoff (5s, 15s, 45s, 2m, 5m capped)

Problem: jobs that exhaust all 5 retries on `TransientError` currently disappear silently. This is bad operationally -- if Groq is down for an hour or Mongo has a network partition, the worker will eat dozens of jobs without anyone knowing.

This spec adds a Dead Letter Queue (DLQ) for jobs that exhausted all retries, so they remain inspectable instead of vanishing.

## Goal

Failed jobs that exhausted retries get pushed to a separate BullMQ queue (`translation-dlq`) with full context for later inspection or manual retry.

## Out of scope

- Automated DLQ processor (just storage for now)
- DLQ web UI / monitoring (future tooling)
- Alerting on DLQ depth (also future)

## DLQ Queue contract

### Queue name

`translation-dlq` -- exported as `DLQ_NAME` from `src/queue.js`.

### DLQ job payload

```json
{
  "originalJobId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "originalPayload": {
    "documentId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "sourceFileKey": "uploads/65f1.../original.pdf",
    "sourceMimeType": "application/pdf",
    "sourceLang": "ru",
    "targetLang": "en",
    "outputFormat": "pdf"
  },
  "error": {
    "name": "TransientError",
    "message": "OpenAI transient error (429): Rate limit exceeded",
    "stack": "..."
  },
  "attemptsMade": 5,
  "failedAt": "2026-05-05T12:34:56.789Z",
  "lastFailedQueue": "translation"
}
```

### When jobs go to DLQ

A job is pushed to DLQ when ALL of these are true:
1. The job failed (worker's `failed` event fires)
2. `err.name !== 'PermanentError'` (PermanentError jobs are discarded, never DLQ'd -- they failed for non-retriable reasons)
3. `job.attemptsMade >= job.opts.attempts` (no more retries left)

### When jobs DO NOT go to DLQ

- `PermanentError` failures -- already handled via `job.discard()`, status is set to `failed` in Mongo with the error message. User-visible failure, no point in DLQ.
- Transient failures with retries remaining -- BullMQ will retry.

## Implementation

### 1. Update `src/queue.js`

Export `DLQ_NAME = 'translation-dlq'` alongside existing constants. No special `JOB_OPTIONS` needed for DLQ -- DLQ jobs aren't meant to be auto-processed (no worker on this queue in MVP), they're just stored.

### 2. Update `src/index.js`

In the existing `worker.on('failed', ...)` listener:

- If `err.name === 'PermanentError'` -- discard, do not DLQ (existing behavior).
- Else if `job.attemptsMade >= job.opts.attempts` -- push to DLQ via a `Queue(DLQ_NAME)` producer instance set up at startup.

The DLQ producer should be created alongside the worker (separate `Queue` instance, same Redis connection) and closed on graceful shutdown together with the worker.

### 3. Update Mongo on DLQ

When a job lands in DLQ, also update the document in Mongo: `markFailed(documentId, errorMessage)` so the user-facing status reflects the failure. Otherwise the document is stuck in `translating` forever.

### 4. Add a smoke test approach

For testing DLQ manually: set `LLM_BASE_URL=http://localhost:9999/v1` in `.env` (unreachable host). This makes all chunks fail with network errors classified as TransientError, exhaust retries, and land in DLQ. Document this in a comment in `scripts/enqueue.config.json` rather than adding it as an automated case -- we do not want to make it easy to accidentally fill DLQ in normal use.

## Acceptance

- After 5 transient failures, job appears in `translation-dlq` queue (verify via `redis-cli` or BullMQ Board)
- DLQ payload includes original payload + error details + timestamp
- Document in Mongo has `status: 'failed'` with the error message
- PermanentError jobs do NOT go to DLQ (verified by checking DLQ is empty after a `rejected-en-to-ru-pdf` test case)