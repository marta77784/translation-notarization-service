export async function extractTxt(buffer) {
  const text = buffer.toString('utf-8');
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}
