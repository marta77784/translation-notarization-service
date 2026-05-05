import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { config } from './config.js';
import { logger } from './lib/logger.js';
import { PermanentError } from './lib/errors.js';
import { downloadObject, uploadObject } from './storage/minio.js';
import {
  markTranslating,
  setProgress,
  markTranslated,
  markFailed,
} from './storage/mongo.js';
import { extractText, SUPPORTED_MIMES } from './extractors/index.js';
import { translateText } from './translator/index.js';
import { compose, SUPPORTED_FORMATS } from './composers/index.js';

const objectIdString = z
  .string()
  .refine((s) => ObjectId.isValid(s), {
    message: 'must be a 24-character hex ObjectId',
  });

const jobPayloadSchema = z
  .object({
    documentId: objectIdString,
    sourceFileKey: z.string().min(1),
    sourceMimeType: z.enum(SUPPORTED_MIMES),
    sourceLang: z.enum(['ru', 'en']),
    targetLang: z.enum(['ru', 'en']),
    outputFormat: z.enum(SUPPORTED_FORMATS),
  })
  .refine((d) => d.sourceLang !== d.targetLang, {
    message: 'sourceLang and targetLang must differ',
    path: ['targetLang'],
  });

const PROGRESS_AFTER_EXTRACT = 10;
const PROGRESS_AFTER_TRANSLATE = 90;

export async function processJob(job) {
  const log = logger.child({ jobId: job.id });

  // 1. Validate payload. Without a valid documentId we can't record a failure
  //    in Mongo, so we just throw permanent and let the worker's failed-event
  //    listener log it.
  const parsed = jobPayloadSchema.safeParse(job.data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '<root>'}: ${i.message}`)
      .join('; ');
    throw new PermanentError(`Invalid job payload: ${issues}`);
  }
  const {
    documentId,
    sourceFileKey,
    sourceMimeType,
    sourceLang,
    targetLang,
    outputFormat,
  } = parsed.data;

  // Cyrillic + PDF rejection — see the TODO in composers/pdf.js for what's
  // needed to lift this restriction.
  if (targetLang === 'ru' && outputFormat === 'pdf') {
    const message =
      'PDF output for Russian is not supported in MVP — use DOCX instead.';
    await markFailed(documentId, message);
    throw new PermanentError(message);
  }

  log.info(
    { documentId, sourceLang, targetLang, outputFormat, sourceMimeType },
    'Starting translation',
  );

  try {
    await markTranslating(documentId);
    await job.updateProgress(0);

    const sourceBuffer = await downloadObject(
      config.MINIO_BUCKET_UPLOADS,
      sourceFileKey,
    );
    log.debug({ bytes: sourceBuffer.length }, 'Source downloaded');

    const sourceText = await extractText(sourceBuffer, sourceMimeType);
    await setProgress(documentId, PROGRESS_AFTER_EXTRACT);
    await job.updateProgress(PROGRESS_AFTER_EXTRACT);
    log.debug({ chars: sourceText.length }, 'Text extracted');

    const translateSpan = PROGRESS_AFTER_TRANSLATE - PROGRESS_AFTER_EXTRACT;
    const translatedText = await translateText(sourceText, {
      sourceLang,
      targetLang,
      onProgress: async ({ done, total }) => {
        const progress =
          PROGRESS_AFTER_EXTRACT + Math.round((done / total) * translateSpan);
        await setProgress(documentId, progress);
        await job.updateProgress(progress);
      },
    });

    const { buffer, ext, contentType } = await compose(
      translatedText,
      outputFormat,
    );
    log.debug(
      { bytes: buffer.length, format: outputFormat },
      'Output composed',
    );

    const translatedFileKey = `translations/${documentId}/translated.${ext}`;
    await uploadObject(
      config.MINIO_BUCKET_TRANSLATIONS,
      translatedFileKey,
      buffer,
      contentType,
    );

    await markTranslated(documentId, translatedFileKey);
    await job.updateProgress(100);

    log.info({ translatedFileKey }, 'Translation complete');
    return { translatedFileKey };
  } catch (err) {
    const message = err?.message ?? String(err);
    try {
      await markFailed(documentId, message);
    } catch (mongoErr) {
      log.error(
        { err: mongoErr },
        'Failed to record document failure in Mongo',
      );
    }
    throw err;
  }
}
