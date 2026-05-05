import { PermanentError } from '../lib/errors.js';
import { extractPdf } from './pdf.js';
import { extractDocx } from './docx.js';
import { extractTxt } from './txt.js';

const MIME_TO_EXTRACTOR = {
  'application/pdf': extractPdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    extractDocx,
  'text/plain': extractTxt,
};

export const SUPPORTED_MIMES = Object.keys(MIME_TO_EXTRACTOR);

/**
 * Extract plain text from a source document buffer. Returns text with
 * paragraphs separated by `\n\n`. Throws PermanentError for unsupported mime
 * types or unrecoverable extraction failures (e.g. scanned PDFs).
 */
export async function extractText(buffer, mimeType) {
  const extractor = MIME_TO_EXTRACTOR[mimeType];
  if (!extractor) {
    throw new PermanentError(`Unsupported source mime type: ${mimeType}`);
  }
  return extractor(buffer);
}
