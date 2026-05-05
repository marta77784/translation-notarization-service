// Importing the inner module directly avoids pdf-parse's package-level
// self-test that reads a bundled fixture PDF on first require.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { PermanentError } from '../lib/errors.js';

export async function extractPdf(buffer) {
  const result = await pdfParse(buffer);
  const text = (result.text ?? '').trim();
  if (!text) {
    throw new PermanentError(
      'PDF contains no extractable text — likely a scanned or image-based PDF. ' +
        'OCR is not supported in the MVP.',
    );
  }
  return paragraphsFromBlankLines(text);
}

// PDFs use blank lines as paragraph breaks; single newlines inside a paragraph
// are layout artifacts from the extractor, so we fold them into spaces.
function paragraphsFromBlankLines(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}
