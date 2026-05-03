# Translation Worker

A self-contained Node.js worker that consumes translation jobs from a BullMQ
queue, translates documents via OpenAI, and writes the results back to MinIO
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
# edit .env and set OPENAI_API_KEY

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

## Configuration

All config comes from environment variables; see `.env.example` for the full
list. Validation runs at startup — if anything required is missing the worker
exits with code 1.

## Project layout

```
src/
  index.js              # entry: BullMQ Worker setup, graceful shutdown
  config.js             # env loading + Zod validation
  processor.js          # main job orchestrator
  extractors/           # text extraction by mime type
  translator/           # chunking + OpenAI calls
  composers/            # output file composition
  storage/              # MinIO + Mongo clients
  lib/                  # logger, custom errors
```
