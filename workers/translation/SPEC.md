# Translation Worker — Spec

## Context

This is a worker service inside `translation-notarization-service` — a document translation and notarization platform. The full stack: Node.js + Next.js + MongoDB + Redis + MinIO + Stripe + Kubernetes (k3s).

This worker handles the **translation** step: it consumes translation jobs from a Redis queue, downloads source documents from MinIO, translates the text via an LLM provider (OpenAI-compatible Chat Completions API), builds the translated file, uploads it back to MinIO, and updates the document status in MongoDB.

This worker is one piece of a multi-person team project. Other people are building the auth service, the document upload API, Stripe payments, the notary cabinet, the frontend, and Kubernetes deployment. **This worker must be self-contained** and communicate with the rest of the system only through the queue, MinIO, and MongoDB.

## Goal

Build a production-quality Node.js worker that consumes jobs from a BullMQ queue named `translation` and produces translated documents.

## Stack constraints

- Node.js 20+ with ESM (`"type": "module"`).
- BullMQ on top of Redis for the queue.
- MinIO SDK for file storage.
- MongoDB native driver for status updates.
- OpenAI-compatible LLM API for translation. Any provider exposing the OpenAI
  Chat Completions interface works (OpenAI, Groq, local Ollama, etc.) — the
  endpoint and model are selected via env vars. The OpenAI SDK is used as the
  client.
- Pino for structured logging.
- Zod for env and job payload validation.

No TypeScript for MVP — plain JS with JSDoc where helpful.

## Queue contract

The worker listens on a BullMQ queue named `translation`. Each job has this payload:

```json
{
  "documentId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "sourceFileKey": "uploads/65f1.../original.pdf",
  "sourceMimeType": "application/pdf",
  "sourceLang": "ru",
  "targetLang": "en",
  "outputFormat": "pdf"
}
```

- `documentId` is also used as the BullMQ `jobId` so that re-enqueueing the same document does not create a duplicate translation.
- `sourceMimeType` is one of: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
- `sourceLang` and `targetLang` are `"ru"` or `"en"`. They must differ.
- `outputFormat` is one of `"pdf"`, `"docx"`, `"txt"`.
- `targetLang === "ru" && outputFormat === "pdf"` is rejected as a permanent error in MVP — the bundled PDF font does not include Cyrillic glyphs. Use DOCX for Russian output until a Unicode TTF is added (see TODO in `src/composers/pdf.js`).

## Producer contract

Anything that enqueues translation jobs (the upload API service, the test
helper at `scripts/enqueue.js`, etc.) must follow these rules. The shared
constants live in `src/queue.js` and should be imported by JS producers.

**Ordering invariant.** Insert the document into MongoDB *before* enqueueing
the job. The worker calls `updateOne` (no upsert) on `markTranslating`, so a
job that arrives before the document exists will silently no-op the status
update and produce a translation file in MinIO with no Mongo trace.

**Queue + job options.** Producers must use the queue name `translation` and
the following BullMQ `add()` options:

```js
import { Queue } from 'bullmq';
import { QUEUE_NAME, JOB_OPTIONS } from './queue.js';

const queue = new Queue(QUEUE_NAME, { connection });
await queue.add(
  'translate',
  payload,
  {
    ...JOB_OPTIONS,            // attempts: 5, backoff: { type: 'custom' }, retention defaults
    jobId: payload.documentId, // idempotency: same document → same jobId
  },
);
```

- `jobId: documentId` is required for idempotency. BullMQ will silently drop a
  duplicate `add` with the same `jobId`, so re-enqueueing the same document
  never produces a duplicate translation.
- `backoff: { type: 'custom' }` opts the job into the worker's custom backoff
  strategy (`5_000 * 3^(attempts-1)`, capped at 5 minutes). Without this, the
  job will not back off correctly between retries.
- `attempts` should match `MAX_ATTEMPTS` from `src/queue.js` (currently `5`).
- The `name` argument to `queue.add` (here `'translate'`) is informational —
  the worker dispatches by queue, not by job name.

## MongoDB contract

The worker updates the document in the `documents` collection in MongoDB:

- On start: `{ status: "translating", progress: 0 }`
- During translation: `{ progress: <0..100> }` updated at key checkpoints
- On success: `{ status: "translated", progress: 100, translatedFileKey: "...", translatedAt: <Date> }`
- On failure: `{ status: "failed", error: "<message>" }`

Always also set `updatedAt: new Date()`.

## Pipeline

1. Validate job payload with Zod. If invalid → permanent failure.
2. Mark document as `translating`.
3. Download source file from MinIO bucket `uploads`.
4. Extract plain text from the document, preserving paragraph breaks (`\n\n`):
   - PDF → use `pdf-parse`. If extracted text is empty, treat as scanned PDF and fail permanently with a clear error (no OCR in MVP).
   - DOCX → use `mammoth` (`extractRawText`).
   - TXT → read as UTF-8.
5. Split the text into chunks on paragraph boundaries, each up to ~2500 estimated tokens (rough estimate: chars / 4). If a single paragraph is too large, fall back to splitting by sentence.
6. Translate each chunk via the configured LLM provider's Chat Completions
   endpoint. Use a strict system prompt for legal/official document
   translation: literal accuracy, preserve paragraph structure, no markdown,
   no commentary, transliterate proper nouns, preserve numbers and dates.
   Temperature low (~0.1).
7. After each chunk, update progress in MongoDB and via `job.updateProgress()`. Translation should map to progress 10 → 90.
8. Recombine translated chunks with `\n\n`.
9. Compose the output file:
   - PDF → `pdfkit`. Note: default Helvetica does not support Cyrillic. For RU output, a Unicode TTF (e.g. DejaVuSans) must be loaded. For MVP RU→EN this is acceptable as-is; leave a TODO for the EN→RU case.
   - DOCX → `docx` package. Native Unicode, no font issue.
   - TXT → just `Buffer.from(text, 'utf-8')`.
10. Upload to MinIO bucket `translations` under key `translations/<documentId>/translated.<ext>`.
11. Mark document as `translated`.

## Error handling

Use two custom error classes:

- `PermanentError` — do not retry (bad file, unsupported format, invalid payload, LLM auth error). On `failed` event, call `job.discard()` to skip remaining attempts.
- `TransientError` — retry with exponential backoff (LLM 429 or 5xx, network errors, empty completion).

Classify LLM provider errors by HTTP status:
- 400, 404 → permanent
- 401, 403 → permanent (config issue, retry pointless)
- 429, 5xx → transient
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND) → transient
- Unknown → transient (better to retry than lose work)

Backoff: `5_000 * 3^(attempts-1)`, capped at 5 minutes.

## Configuration

All config from env vars, validated via Zod at startup. Required: `LLM_API_KEY`, `REDIS_URL`, `MONGO_URL`, `MONGO_DB`, MinIO endpoint/credentials/bucket names. Optional: `LLM_BASE_URL` (default `https://api.openai.com/v1`), `LLM_MODEL` (default `gpt-4o-mini`), `WORKER_CONCURRENCY` (default 2), `LOG_LEVEL` (default `info`).

The LLM client is constructed as `new OpenAI({ apiKey: LLM_API_KEY, baseURL: LLM_BASE_URL })`. Schema defaults point at OpenAI; `.env.example` ships with Groq for free local development.

If env validation fails, log the missing fields and exit with code 1.

## Project structure

```
src/
  index.js              # entry: BullMQ Worker setup, graceful shutdown
  config.js             # env loading + Zod validation
  processor.js          # main job orchestrator
  extractors/
    index.js            # router by mime type
    pdf.js
    docx.js
    txt.js
  translator/
    index.js            # main translateText() with progress callback
    chunker.js          # paragraph + sentence-fallback chunking
    prompts.js          # system prompt builder
  composers/
    index.js            # router by output format
    pdf.js
    docx.js
  storage/
    minio.js            # download, upload, ensureBuckets
    mongo.js            # connectMongo, setStatus, markTranslating, markTranslated, markFailed
  lib/
    logger.js           # pino instance
    errors.js           # PermanentError, TransientError
```

Plus `package.json`, `Dockerfile`, `.env.example`, `.gitignore`, `README.md`.

## Out of scope for MVP

- OCR for scanned PDFs.
- Preserving original document layout (output is plain paragraphs).
- Tables, images, footnotes.
- Languages other than RU/EN.
- Translation memory or glossary.

## Acceptance

- `npm install && npm run dev` starts the worker locally against local Redis/Mongo/MinIO.
- Manually enqueueing a job (via a small script or BullMQ Board) produces a translated file in the `translations` bucket.
- The corresponding document in MongoDB ends up with `status: "translated"` and a valid `translatedFileKey`.
- A deliberately broken file produces `status: "failed"` with a meaningful error and no infinite retry loop.
