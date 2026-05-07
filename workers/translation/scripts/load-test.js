#!/usr/bin/env node
// Load tester for the translation queue. Used to demo HPA / manual scaling:
// enqueues N copies of a chosen test case in parallel so the queue depth
// spikes and worker replicas have something to chew through.
//
// Usage:
//   node --env-file=.env scripts/load-test.js <case-name> <count>
//
// Example:
//   node --env-file=.env scripts/load-test.js ru-txt-to-en-txt 50

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { ObjectId } from 'mongodb';
import { config } from '../src/config.js';
import { connectMongo, closeMongo } from '../src/storage/mongo.js';
import { ensureBuckets, uploadObject } from '../src/storage/minio.js';
import { QUEUE_NAME, JOB_OPTIONS } from '../src/queue.js';
import { logger } from '../src/lib/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, 'enqueue.config.json');

async function main() {
  const caseName = process.argv[2];
  const count = parseInt(process.argv[3], 10);

  if (!caseName || !Number.isInteger(count) || count <= 0) {
    process.stdout.write(
      'Usage: node --env-file=.env scripts/load-test.js <case-name> <count>\n',
    );
    process.exit(1);
  }

  const configFile = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
  const testCase = configFile.cases?.[caseName];
  if (!testCase) {
    process.stderr.write(`Unknown case: ${caseName}\n`);
    process.exit(1);
  }
  if (!testCase.sourceFile) {
    process.stderr.write(
      `Case ${caseName} has no sourceFile — load tester needs a real fixture.\n`,
    );
    process.exit(1);
  }

  const fixturePath = path.resolve(__dirname, testCase.sourceFile);
  const fixtureBuffer = await fs.readFile(fixturePath);
  const fixtureName = path.basename(fixturePath);
  logger.info(
    { case: caseName, count, fixture: fixtureName, bytes: fixtureBuffer.length },
    'Load test starting',
  );

  const { db } = await connectMongo();
  await ensureBuckets();

  const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  const queue = new Queue(QUEUE_NAME, { connection });

  const startedAt = Date.now();

  // Enqueue all jobs concurrently. Each gets its own documentId, its own MinIO
  // upload, and its own Mongo doc — same shape as a real upload.
  const tasks = Array.from({ length: count }, async (_unused, i) => {
    const documentId = new ObjectId().toString();
    const sourceFileKey = `uploads/${documentId}/${fixtureName}`;

    await uploadObject(
      config.MINIO_BUCKET_UPLOADS,
      sourceFileKey,
      fixtureBuffer,
      testCase.sourceMimeType,
    );

    const now = new Date();
    await db.collection('documents').updateOne(
      { _id: new ObjectId(documentId) },
      {
        $set: {
          status: 'paid',
          sourceFileKey,
          sourceMimeType: testCase.sourceMimeType,
          sourceLang: testCase.sourceLang,
          targetLang: testCase.targetLang,
          outputFormat: testCase.outputFormat,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    await queue.add(
      'translate',
      {
        documentId,
        sourceFileKey,
        sourceMimeType: testCase.sourceMimeType,
        sourceLang: testCase.sourceLang,
        targetLang: testCase.targetLang,
        outputFormat: testCase.outputFormat,
      },
      { ...JOB_OPTIONS, jobId: documentId },
    );

    if ((i + 1) % 10 === 0) {
      logger.info({ enqueued: i + 1 }, 'Progress');
    }
  });

  await Promise.all(tasks);

  const elapsed = Date.now() - startedAt;
  logger.info(
    { count, ms: elapsed, ratePerSec: ((count / elapsed) * 1000).toFixed(1) },
    'All jobs enqueued',
  );

  await queue.close();
  await connection.quit();
  await closeMongo();
}

main().catch((err) => {
  logger.fatal({ err }, 'Load test failed');
  process.exit(1);
});