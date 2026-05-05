import { PermanentError } from '../lib/errors.js';
import { composePdf } from './pdf.js';
import { composeDocx } from './docx.js';

const FORMATS = {
  pdf: {
    compose: composePdf,
    ext: 'pdf',
    contentType: 'application/pdf',
  },
  docx: {
    compose: composeDocx,
    ext: 'docx',
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  txt: {
    compose: async (text) => Buffer.from(text, 'utf-8'),
    ext: 'txt',
    contentType: 'text/plain; charset=utf-8',
  },
};

export const SUPPORTED_FORMATS = Object.keys(FORMATS);

/**
 * Render translated text into the requested output format.
 *
 * @param {string} text - translated text with paragraphs separated by `\n\n`
 * @param {'pdf'|'docx'|'txt'} format
 * @returns {Promise<{ buffer: Buffer, ext: string, contentType: string }>}
 */
export async function compose(text, format) {
  const fmt = FORMATS[format];
  if (!fmt) {
    throw new PermanentError(`Unsupported output format: ${format}`);
  }
  const buffer = await fmt.compose(text);
  return { buffer, ext: fmt.ext, contentType: fmt.contentType };
}
