const DEFAULT_MAX_TOKENS = 2500;
const CHARS_PER_TOKEN = 4;

export function estimateTokens(s) {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}

/**
 * Split normalized text into translation chunks. Paragraph-first; if a single
 * paragraph exceeds the budget, falls back to sentence-level splitting via
 * Intl.Segmenter (with a regex backstop). Chunks are joined with `\n\n` so the
 * model preserves paragraph structure within each request.
 *
 * @param {string} text - text with paragraphs separated by `\n\n`
 * @param {object} [options]
 * @param {number} [options.maxTokens=2500] per-chunk token budget
 * @param {string} [options.lang='en'] source-language hint for sentence splitting
 * @returns {string[]} chunks ready to send to the LLM
 */
export function chunkText(
  text,
  { maxTokens = DEFAULT_MAX_TOKENS, lang = 'en' } = {},
) {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return [];

  const paragraphs = trimmed.split(/\n{2,}/);

  // Expand oversized paragraphs into sentence pieces. A sentence that is still
  // over budget is emitted as-is — splitting mid-sentence wrecks translation
  // quality, and one over-budget chunk is preferable to garbled output.
  const pieces = [];
  for (const para of paragraphs) {
    if (estimateTokens(para) <= maxTokens) {
      pieces.push(para);
    } else {
      pieces.push(...splitSentences(para, lang));
    }
  }

  // Greedy pack. Joiner is `\n\n` — pieces from a sentence-split paragraph
  // get glued with paragraph breaks too, which is acceptable for the rare
  // case where one paragraph is so large it had to be split.
  const chunks = [];
  let current = '';
  for (const piece of pieces) {
    if (!current) {
      current = piece;
      continue;
    }
    const merged = `${current}\n\n${piece}`;
    if (estimateTokens(merged) <= maxTokens) {
      current = merged;
    } else {
      chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);

  return chunks;
}

function splitSentences(paragraph, lang) {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    try {
      const segmenter = new Intl.Segmenter(lang, { granularity: 'sentence' });
      const sentences = [...segmenter.segment(paragraph)]
        .map((s) => s.segment.trim())
        .filter(Boolean);
      if (sentences.length > 0) return sentences;
    } catch {
      // fall through to regex
    }
  }
  return paragraph
    .split(/(?<=[.!?])\s+(?=\S)/)
    .map((s) => s.trim())
    .filter(Boolean);
}
