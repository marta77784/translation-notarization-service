import { MongoClient, ObjectId } from 'mongodb';
import { config } from '../config.js';

let client;
let db;

export async function connectMongo() {
  if (client && db) return { client, db };
  client = new MongoClient(config.MONGO_URL);
  await client.connect();
  db = client.db(config.MONGO_DB);
  return { client, db };
}

export async function closeMongo() {
  if (!client) return;
  await client.close();
  client = undefined;
  db = undefined;
}

function documents() {
  if (!db) throw new Error('Mongo not connected. Call connectMongo() first.');
  return db.collection('documents');
}

// Callers must pass a 24-char hex string. Validation lives upstream in the
// processor's payload schema, so this trusts its input.
function oid(documentId) {
  return new ObjectId(documentId);
}

export async function markTranslating(documentId) {
  await documents().updateOne(
    { _id: oid(documentId) },
    { $set: { status: 'translating', progress: 0, updatedAt: new Date() } },
  );
}

export async function setProgress(documentId, progress) {
  await documents().updateOne(
    { _id: oid(documentId) },
    { $set: { progress, updatedAt: new Date() } },
  );
}

export async function markTranslated(documentId, translatedFileKey) {
  const now = new Date();
  await documents().updateOne(
    { _id: oid(documentId) },
    {
      $set: {
        status: 'translated',
        progress: 100,
        translatedFileKey,
        translatedAt: now,
        updatedAt: now,
      },
    },
  );
}

export async function markFailed(documentId, errorMessage) {
  await documents().updateOne(
    { _id: oid(documentId) },
    { $set: { status: 'failed', error: errorMessage, updatedAt: new Date() } },
  );
}
