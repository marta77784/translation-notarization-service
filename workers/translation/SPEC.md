# Translation Worker — Spec

## Context

This is a worker service inside `translation-notarization-service` — a document translation and notarization platform. The full stack: Node.js + Next.js + MongoDB + Redis + MinIO + Stripe + Kubernetes (k3s).

This worker handles the **translation** step: it consumes translation jobs from a Redis queue, downloads source documents from MinIO, translates the text via OpenAI, builds the translated file, uploads it back to MinIO, and updates the document status in MongoDB.

This worker is one piece of a multi-person team project. Other people are building the auth service, the document upload API, Stripe payments, the notary cabinet, the frontend, and Kubernetes deployment. **This worker must be self-contained** and communicate with the rest of the system only through the queue, MinIO, and MongoDB.

## Goal

Build a production-quality Node.js worker that consumes jobs from a BullMQ queue named `translation` and produces translated documents.

## Stack constraints

- Node.js 20+ with ESM (`"type": "module"`).
- BullMQ on top of Redis for the queue.
- MinIO SDK for file storage.
- MongoDB native driver for status updates.
- OpenAI SDK for translation (`gpt-4o-mini` by default).
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
6. Translate each chunk with OpenAI Chat Completions. Use a strict system prompt for legal/official document translation: literal accuracy, preserve paragraph structure, no markdown, no commentary, transliterate proper nouns, preserve numbers and dates. Temperature low (~0.1).
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

- `PermanentError` — do not retry (bad file, unsupported format, invalid payload, OpenAI auth error). On `failed` event, call `job.discard()` to skip remaining attempts.
- `TransientError` — retry with exponential backoff (OpenAI 429 or 5xx, network errors, empty completion).

Classify OpenAI errors by HTTP status:
- 400, 404 → permanent
- 401, 403 → permanent (config issue, retry pointless)
- 429, 5xx → transient
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND) → transient
- Unknown → transient (better to retry than lose work)

Backoff: `5_000 * 3^(attempts-1)`, capped at 5 minutes.

## Configuration

All config from env vars, validated via Zod at startup. Required: `OPENAI_API_KEY`, `REDIS_URL`, `MONGO_URL`, `MONGO_DB`, MinIO endpoint/credentials/bucket names. Optional: `OPENAI_MODEL` (default `gpt-4o-mini`), `WORKER_CONCURRENCY` (default 2), `LOG_LEVEL` (default `info`).

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
