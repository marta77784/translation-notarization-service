# Translation Worker

A self-contained Node.js worker that consumes translation jobs from a BullMQ
queue, translates documents via an LLM provider, and writes the results back to MinIO
and MongoDB.

See [`SPEC.md`](./SPEC.md) for the full contract.

## Requirements

- Node.js 20.6+ (uses `--env-file`)
- Docker (for local Redis / Mongo / MinIO)

## Quick start

```bash
# 1. Bring up local infra
docker compose up -d

# 2. Configure env
cp .env.example .env
# edit .env and set LLM_API_KEY

# 3. Install and run
npm install
npm run dev
```

The worker connects to:

- Redis at `REDIS_URL` for the BullMQ `translation` queue
- MongoDB at `MONGO_URL` / `MONGO_DB` (`documents` collection)
- MinIO at `MINIO_ENDPOINT:MINIO_PORT` for source files (`uploads` bucket) and
  translated outputs (`translations` bucket)

MinIO console: <http://localhost:9001> (user `minioadmin` / `minioadmin`).

## Enqueueing test jobs

The worker is normally fed by the upload API service. For autonomous local
testing, `scripts/enqueue.js` simulates that producer: it uploads a fixture
file to MinIO, upserts a `documents` row in Mongo, and enqueues a job using
the shared producer contract from `src/queue.js`.

Test cases live in `scripts/enqueue.config.json`. Drop fixture files into
`scripts/fixtures/` (a `sample-ru.txt` is included to start with).

```bash
npm run enqueue                       # list available cases
npm run enqueue -- ru-txt-to-en-txt   # run a specific case
```

Each case generates a fresh `documentId` (an ObjectId) by default — copy it
from the log to inspect Mongo (`db.documents.findOne({_id: ObjectId('...')})`)
or MinIO (`translations/<documentId>/translated.<ext>`).

## Testing the DLQ

Jobs that exhaust their 5 retries on a `TransientError` land in the
`translation-dlq` queue (see [`SPEC-DLQ.md`](./SPEC-DLQ.md)). To force
this path locally without touching real LLM credentials, point the LLM
client at an unreachable host in `.env`:

```bash
LLM_BASE_URL=http://localhost:9999/v1
```

Enqueue any case (e.g. `npm run enqueue -- ru-txt-to-en-txt`). Every chunk
will fail with a network error classified as `TransientError`; after all 5
retries are exhausted, the job is pushed to `translation-dlq` and the
document in Mongo is marked `failed`.

Verify:

```bash
redis-cli LLEN bull:translation-dlq:wait    # DLQ entry count
```

Or use BullMQ Board for UI-friendly inspection. DLQ entries are not
auto-cleaned — that is the point of the queue. Restore `LLM_BASE_URL`
after testing.

## Docker

```bash
docker build -t translation-worker .
docker run --rm --env-file .env translation-worker
```

The image runs as the `node` user, includes only production dependencies, and
ships only `src/` (no scripts, no docs).

## Configuration

All config comes from environment variables; see `.env.example` for the full
list. Validation runs at startup — if anything required is missing the worker
exits with code 1.

## Project layout

```
src/
  index.js              # entry: BullMQ Worker setup, graceful shutdown
  config.js             # env loading + Zod validation
  queue.js              # shared queue/job-options contract for producers
  processor.js          # main job orchestrator
  extractors/           # text extraction by mime type
  translator/           # chunking + LLM calls
  composers/            # output file composition
  storage/              # MinIO + Mongo clients
  lib/                  # logger, custom errors
scripts/
  enqueue.js            # manual job producer for autonomous testing
  enqueue.config.json   # named test cases
  fixtures/             # source documents referenced by cases
```
