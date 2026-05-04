import mammoth from 'mammoth';

export async function extractDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  // mammoth emits one paragraph per line; promote each non-empty line to a
  // \n\n-separated paragraph so the chunker can split on the standard boundary.
  return (value ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join('\n\n');
}
