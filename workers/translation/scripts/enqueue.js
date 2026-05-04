#!/usr/bin/env node
// Manual enqueue helper for autonomous testing. Reads named test cases from
// scripts/enqueue.config.json, optionally uploads a local fixture file to
// MinIO, upserts a Mongo document (simulating the upload API), and enqueues
// a translation job using the shared producer contract.
//
// Usage:
//   npm run enqueue                    # list cases
//   npm run enqueue -- <case-name>     # run a single case

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

  const configFile = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
  const cases = configFile.cases ?? {};
  const caseNames = Object.keys(cases);

  if (!caseName) {
    process.stdout.write('Usage: npm run enqueue -- <case-name>\n\n');
    process.stdout.write('Available cases:\n');
    for (const name of caseNames) process.stdout.write(`  ${name}\n`);
    process.exit(1);
  }

  const testCase = cases[caseName];
  if (!testCase) {
    process.stderr.write(`Unknown case: ${caseName}\n`);
    process.stderr.write(`Available: ${caseNames.join(', ')}\n`);
    process.exit(1);
  }

  const documentId =
    !testCase.documentId || testCase.documentId === 'auto'
      ? new ObjectId().toString()
      : testCase.documentId;

  const { db } = await connectMongo();
  await ensureBuckets();

  const sourceFileKey = await resolveSourceFile(testCase, documentId);

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
  logger.info({ documentId }, 'Document upserted in Mongo');

  const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  const queue = new Queue(QUEUE_NAME, { connection });

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
    {
      ...JOB_OPTIONS,
      jobId: documentId,
    },
  );
  logger.info({ documentId, case: caseName }, 'Job enqueued');

  await queue.close();
  await connection.quit();
  await closeMongo();
}

async function resolveSourceFile(testCase, documentId) {
  if (testCase.sourceFile) {
    const absPath = path.resolve(__dirname, testCase.sourceFile);
    let buffer;
    try {
      buffer = await fs.readFile(absPath);
    } catch (err) {
      logger.fatal({ path: absPath, err: err.message }, 'Cannot read fixture');
      process.exit(1);
    }
    const key = `uploads/${documentId}/${path.basename(absPath)}`;
    await uploadObject(
      config.MINIO_BUCKET_UPLOADS,
      key,
      buffer,
      testCase.sourceMimeType,
    );
    logger.info({ key, bytes: buffer.length }, 'Source uploaded to MinIO');
    return key;
  }

  if (testCase.sourceFileKey) {
    logger.info({ key: testCase.sourceFileKey }, 'Using existing MinIO key');
    return testCase.sourceFileKey;
  }

  logger.fatal('Case must specify either sourceFile or sourceFileKey');
  process.exit(1);
}

main().catch((err) => {
  logger.fatal({ err }, 'Enqueue failed');
  process.exit(1);
});
