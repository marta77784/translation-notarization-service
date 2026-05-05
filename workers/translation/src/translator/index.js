import OpenAI from 'openai';
import { config } from '../config.js';
import { PermanentError, TransientError } from '../lib/errors.js';
import { chunkText } from './chunker.js';
import { buildSystemPrompt } from './prompts.js';

const client = new OpenAI({
  apiKey: config.LLM_API_KEY,
  baseURL: config.LLM_BASE_URL,
});

const TEMPERATURE = 0.1;

const NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ECONNREFUSED',
  'EPIPE',
  'EHOSTUNREACH',
]);

/**
 * Translate text from `sourceLang` to `targetLang`. Splits the input into
 * chunks, calls the LLM per chunk, and rejoins with `\n\n`.
 *
 * @param {string} text - normalized source text (paragraphs separated by `\n\n`)
 * @param {object} options
 * @param {string} options.sourceLang
 * @param {string} options.targetLang
 * @param {(p: { done: number, total: number }) => Promise<void> | void} [options.onProgress]
 *   Invoked after each chunk completes, before the next one starts.
 * @returns {Promise<string>} translated text with paragraphs separated by `\n\n`
 */
export async function translateText(
  text,
  { sourceLang, targetLang, onProgress },
) {
  const chunks = chunkText(text, { lang: sourceLang });
  if (chunks.length === 0) {
    throw new PermanentError(
      'Source document contained no extractable text after normalization.',
    );
  }

  const systemPrompt = buildSystemPrompt({ sourceLang, targetLang });
  const translated = [];

  for (let i = 0; i < chunks.length; i++) {
    const out = await translateChunk(chunks[i], systemPrompt);
    translated.push(out);
    if (onProgress) {
      await onProgress({ done: i + 1, total: chunks.length });
    }
  }

  return translated.join('\n\n');
}

async function translateChunk(chunk, systemPrompt) {
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: config.LLM_MODEL,
      temperature: TEMPERATURE,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: chunk },
      ],
    });
  } catch (err) {
    throw classifyError(err);
  }

  const out = completion?.choices?.[0]?.message?.content?.trim();
  if (!out) {
    throw new TransientError('LLM returned an empty completion');
  }
  return out;
}

function classifyError(err) {
  const status = err?.status ?? err?.response?.status;

  if (status === 400 || status === 404) {
    return new PermanentError(
      `LLM request rejected (HTTP ${status}): ${err.message}`,
      { cause: err },
    );
  }
  if (status === 401 || status === 403) {
    return new PermanentError(
      `LLM authentication/authorization failure (HTTP ${status}). ` +
        `Check LLM_API_KEY and LLM_BASE_URL.`,
      { cause: err },
    );
  }
  if (status === 429 || (typeof status === 'number' && status >= 500)) {
    return new TransientError(
      `LLM provider returned HTTP ${status}: ${err.message}`,
      { cause: err },
    );
  }

  const causeCode = err?.cause?.code ?? err?.code;
  if (typeof causeCode === 'string' && NETWORK_ERROR_CODES.has(causeCode)) {
    return new TransientError(
      `Network error reaching LLM provider: ${causeCode}`,
      { cause: err },
    );
  }

  // Spec: unknown → transient ("better to retry than lose work").
  return new TransientError(
    `Unclassified LLM error: ${err?.message ?? String(err)}`,
    { cause: err },
  );
}
